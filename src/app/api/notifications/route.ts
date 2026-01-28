import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { notificationService } from "@/services/notification.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { id: string };
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    const notifications = await notificationService.getForUser(user.id, {
      unreadOnly,
      limit,
    });

    const unreadCount = await notificationService.getUnreadCount(user.id);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar notificações" },
      { status: 500 }
    );
  }
}
