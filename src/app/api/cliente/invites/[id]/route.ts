import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { inviteService } from "@/services";

type Params = Promise<{ id: string }>;

export async function DELETE(_request: Request, { params }: { params: Params }) {
  try {
    const session = await requireRole(["CLIENT"]);
    const { id } = await params;

    const user = session.user as { companyId?: string };
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário não vinculado a empresa" }, { status: 400 });
    }

    const invite = await inviteService.findById(id);
    if (!invite) {
      return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
    }
    if (invite.companyId !== user.companyId || invite.type !== "COMPANY_MEMBER") {
      return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
    }

    await inviteService.cancel(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao cancelar convite:", error);
    return NextResponse.json({ error: "Erro ao cancelar convite" }, { status: 500 });
  }
}
