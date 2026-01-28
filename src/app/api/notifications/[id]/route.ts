import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { notificationService } from "@/services/notification.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { id: string };
    const { id } = await params;

    const notification = await notificationService.markAsRead(id, user.id);

    if (!notification) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    return NextResponse.json(
      { error: "Erro ao marcar notificação como lida" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { id: string };
    const { id } = await params;

    const deleted = await notificationService.delete(id, user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar notificação:", error);
    return NextResponse.json(
      { error: "Erro ao deletar notificação" },
      { status: 500 }
    );
  }
}
