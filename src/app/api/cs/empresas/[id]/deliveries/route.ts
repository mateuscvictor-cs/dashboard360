import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { csOwnerId?: string };
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      select: { csOwnerId: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    if (company.csOwnerId !== user.csOwnerId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { title, status, progress, dueDate, assignee, impact } = body;

    if (!title) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
    }

    const delivery = await prisma.delivery.create({
      data: {
        title,
        status: status || "PENDING",
        progress: progress || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignee,
        impact: impact || "MEDIUM",
        companyId: id,
      },
    });

    return NextResponse.json(delivery, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar entregável:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { csOwnerId?: string };
    const body = await request.json();
    const { deliveryId, ...data } = body;

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { company: { select: { csOwnerId: true } } },
    });

    if (!delivery) {
      return NextResponse.json({ error: "Entregável não encontrado" }, { status: 404 });
    }

    if (delivery.company.csOwnerId !== user.csOwnerId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.status && { status: data.status }),
        ...(data.progress !== undefined && { progress: data.progress }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.assignee !== undefined && { assignee: data.assignee }),
        ...(data.impact && { impact: data.impact }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar entregável:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
