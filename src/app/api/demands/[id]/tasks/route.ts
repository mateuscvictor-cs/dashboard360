import { NextRequest, NextResponse } from "next/server";
import { requireDemandAccess } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Priority } from "@prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireDemandAccess(id);

    const tasks = await prisma.demandTask.findMany({
      where: { demandId: id },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "DemandNotFound") {
      return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });
    }
    console.error("Erro ao buscar tarefas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar tarefas" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: demandId } = await params;
    await requireDemandAccess(demandId);
    const body = await request.json();

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    const count = await prisma.demandTask.count({ where: { demandId } });
    const priorityMap: Record<string, Priority> = {
      URGENT: "URGENT",
      HIGH: "HIGH",
      MEDIUM: "MEDIUM",
      LOW: "LOW",
    };
    const priority = priorityMap[String(body.priority || "MEDIUM").toUpperCase()] ?? "MEDIUM";

    const task = await prisma.demandTask.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() ?? null,
        demandId,
        priority,
        orderIndex: count,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "DemandNotFound") {
      return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });
    }
    console.error("Erro ao criar tarefa:", error);
    return NextResponse.json(
      { error: "Erro ao criar tarefa" },
      { status: 500 }
    );
  }
}
