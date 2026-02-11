import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN", "CS_OWNER", "CLIENT", "CLIENT_MEMBER"]);
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const filename = searchParams.get("filename");

    if (!url || !filename) {
      return NextResponse.json(
        { error: "url e filename são obrigatórios" },
        { status: 400 }
      );
    }

    const decodedUrl = decodeURIComponent(url);
    const decodedFilename = decodeURIComponent(filename);

    const allowedHosts: string[] = [
      "r2.cloudflarestorage.com",
      "r2.dev",
      new URL(process.env.NEXT_PUBLIC_APP_URL || "https://localhost").hostname,
    ];
    if (process.env.R2_PUBLIC_URL) {
      try {
        allowedHosts.push(new URL(process.env.R2_PUBLIC_URL).hostname);
      } catch {
        /**/
      }
    }
    try {
      const urlObj = new URL(decodedUrl);
      const isAllowed =
        allowedHosts.some((h) => urlObj.hostname === h) ||
        urlObj.hostname.endsWith(".r2.dev") ||
        urlObj.hostname.endsWith(".r2.cloudflarestorage.com");
      if (!isAllowed) {
        return NextResponse.json({ error: "URL não permitida" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }

    const res = await fetch(decodedUrl, { method: "GET" });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Arquivo não encontrado ou inacessível" },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = `attachment; filename="${decodedFilename.replace(/"/g, '\\"')}"`;

    const blob = await res.blob();
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    console.error("Erro no download:", error);
    return NextResponse.json(
      { error: "Erro ao baixar arquivo" },
      { status: 500 }
    );
  }
}
