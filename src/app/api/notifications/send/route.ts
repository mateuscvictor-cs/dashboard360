import { NextRequest, NextResponse } from "next/server";
import { requireRole, getSession } from "@/lib/auth-server";
import { notificationService } from "@/services/notification.service";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    await requireRole(["ADMIN", "CS_OWNER"]);

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { id: string; role: string };
    const body = await request.json();

    const { title, message, link, targetType, targetId, targetRole } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Título e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    let recipientIds: string[] = [];

    if (targetType === "user" && targetId) {
      recipientIds = [targetId];
    } else if (targetType === "company" && targetId) {
      if (user.role === "CS_OWNER") {
        const csOwner = await prisma.cSOwner.findFirst({
          where: { user: { id: user.id } },
          include: { companies: { select: { id: true } } },
        });

        const companyIds = csOwner?.companies.map((c) => c.id) || [];
        if (!companyIds.includes(targetId)) {
          return NextResponse.json(
            { error: "Você não tem acesso a esta empresa" },
            { status: 403 }
          );
        }
      }

      const companyUsers = await prisma.user.findMany({
        where: { companyId: targetId },
        select: { id: true },
      });

      recipientIds = companyUsers.map((u) => u.id);
    } else if (targetType === "broadcast") {
      const count = await notificationService.sendBroadcast(user.id, {
        title,
        message,
        link,
        targetRole: targetRole || "ALL",
      });

      return NextResponse.json({
        success: true,
        count,
      });
    } else {
      return NextResponse.json(
        { error: "Tipo de destinatário inválido" },
        { status: 400 }
      );
    }

    if (recipientIds.length === 0) {
      return NextResponse.json(
        { error: "Nenhum destinatário encontrado" },
        { status: 400 }
      );
    }

    const count = await notificationService.sendManual(user.id, {
      title,
      message,
      link,
      recipientIds,
    });

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Erro ao enviar notificação" },
      { status: 500 }
    );
  }
}
