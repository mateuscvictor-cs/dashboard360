import { NextRequest, NextResponse } from "next/server";
import { requireDemandAccess } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Priority } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: demandId, taskId } = await params;
    await requireDemandAccess(demandId);
    const body = await request.json();

    const task = await prisma.demandTask.findFirst({
      where: { id: taskId, demandId },
    });

    if (!task) {
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
    }

    const priorityMap: Record<string, Priority> = {
      URGENT: "URGENT",
      HIGH: "HIGH",
      MEDIUM: "MEDIUM",
      LOW: "LOW",
    };
    const updateData: {
      title?: string;
      description?: string;
      completed?: boolean;
      priority?: Priority;
      orderIndex?: number;
    } = {};

    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() ?? null;
    if (typeof body.completed === "boolean") updateData.completed = body.completed;
    if (body.priority !== undefined) {
      updateData.priority = priorityMap[String(body.priority).toUpperCase()] ?? task.priority;
    }
    if (typeof body.orderIndex === "number") updateData.orderIndex = body.orderIndex;

    const updated = await prisma.demandTask.update({
      where: { id: taskId },
      data: updateData,
    });

    return NextResponse.json(updated);
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
    console.error("Erro ao atualizar tarefa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar tarefa" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: demandId, taskId } = await params;
    await requireDemandAccess(demandId);

    const task = await prisma.demandTask.findFirst({
      where: { id: taskId, demandId },
    });

    if (!task) {
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
    }

    await prisma.demandTask.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
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
    console.error("Erro ao excluir tarefa:", error);
    return NextResponse.json(
      { error: "Erro ao excluir tarefa" },
      { status: 500 }
    );
  }
}
