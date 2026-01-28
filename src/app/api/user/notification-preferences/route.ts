import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { id: string };

    const preferences = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        notifyInApp: true,
        notifyEmail: true,
        notifyDeliveries: true,
        notifyProgress: true,
        notifyDeadlines: true,
        notifyWeeklySummary: true,
      },
    });

    if (!preferences) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Erro ao buscar preferências:", error);
    return NextResponse.json(
      { error: "Erro ao buscar preferências" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { id: string };
    const body = await request.json();

    const allowedFields = [
      "notifyInApp",
      "notifyEmail",
      "notifyDeliveries",
      "notifyProgress",
      "notifyDeadlines",
      "notifyWeeklySummary",
    ];

    const updateData: Record<string, boolean> = {};

    for (const field of allowedFields) {
      if (typeof body[field] === "boolean") {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo válido para atualizar" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        notifyInApp: true,
        notifyEmail: true,
        notifyDeliveries: true,
        notifyProgress: true,
        notifyDeadlines: true,
        notifyWeeklySummary: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar preferências:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar preferências" },
      { status: 500 }
    );
  }
}
