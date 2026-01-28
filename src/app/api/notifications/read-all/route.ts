import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { notificationService } from "@/services/notification.service";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { id: string };

    const count = await notificationService.markAllAsRead(user.id);

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Erro ao marcar todas como lidas:", error);
    return NextResponse.json(
      { error: "Erro ao marcar todas como lidas" },
      { status: 500 }
    );
  }
}
