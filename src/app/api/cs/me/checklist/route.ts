import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { csOwnerId?: string; role?: string };

    if (!user.csOwnerId) {
      return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
    }

    const checklist = await prisma.checklistItem.findMany({
      where: { csOwnerId: user.csOwnerId },
      orderBy: [{ completed: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(checklist);
  } catch (error) {
    console.error("Erro ao buscar checklist:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { csOwnerId?: string; role?: string };

    if (!user.csOwnerId) {
      return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, priority } = body;

    if (!title) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
    }

    const item = await prisma.checklistItem.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        csOwnerId: user.csOwnerId,
        date: new Date(),
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar tarefa:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
