import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { inviteService } from "@/services";

export async function GET() {
  try {
    const session = await requireRole(["CLIENT"]);

    const user = session.user as { companyId?: string };
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário não vinculado a empresa" }, { status: 400 });
    }

    const [members, invites, stats] = await Promise.all([
      prisma.user.findMany({
        where: { companyId: user.companyId, role: "CLIENT_MEMBER" },
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      inviteService.getCompanyInvites(user.companyId),
      inviteService.getMemberInviteStats(user.companyId),
    ]);

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        createdAt: m.createdAt,
      })),
      invites: invites.map((i) => ({
        id: i.id,
        email: i.email,
        status: i.status,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
        invitedBy: i.invitedBy?.name ?? i.invitedBy?.email,
      })),
      stats,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao buscar membros:", error);
    return NextResponse.json({ error: "Erro ao buscar membros" }, { status: 500 });
  }
}
