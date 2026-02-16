import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { inviteService } from "@/services";

export async function POST(request: Request) {
  try {
    const session = await requireRole(["CLIENT"]);

    const user = session.user as { id: string; companyId?: string };
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário não vinculado a empresa" }, { status: 400 });
    }

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    const canInvite = await inviteService.canInviteMember(user.companyId);
    if (!canInvite.allowed) {
      return NextResponse.json({ error: canInvite.reason ?? "Não é possível enviar convite" }, { status: 400 });
    }

    const invite = await inviteService.create({
      email,
      type: "COMPANY_MEMBER",
      companyId: user.companyId,
      invitedById: user.id,
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (
      error instanceof Error &&
      (error.message.includes("convite pendente") || error.message.includes("usuário cadastrado"))
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Erro ao convidar membro:", error);
    return NextResponse.json({ error: "Erro ao enviar convite" }, { status: 500 });
  }
}
