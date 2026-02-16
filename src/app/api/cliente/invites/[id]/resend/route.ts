import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { inviteService } from "@/services";

type Params = Promise<{ id: string }>;

export async function POST(_request: Request, { params }: { params: Params }) {
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

    const result = await inviteService.resend(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao reenviar convite:", error);
    return NextResponse.json({ error: "Erro ao reenviar convite" }, { status: 500 });
  }
}
