import { getSession } from "@/lib/auth-server";
import { sseBroadcaster } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = session.user as { id: string };
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      sseBroadcaster.addClient(user.id, controller);

      controller.enqueue(encoder.encode(`data: {"type":"connected"}\n\n`));

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: {"type":"heartbeat"}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        sseBroadcaster.removeClient(user.id, controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
