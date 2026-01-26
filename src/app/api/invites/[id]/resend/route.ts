import { NextResponse } from "next/server";
import { inviteService } from "@/services";
import { requireRole } from "@/lib/auth-server";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const result = await inviteService.resend(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
    }
    console.error("Erro ao reenviar convite:", error);
    return NextResponse.json(
      { error: "Erro ao reenviar convite" },
      { status: 500 }
    );
  }
}
