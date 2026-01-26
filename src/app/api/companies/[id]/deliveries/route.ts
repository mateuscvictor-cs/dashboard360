import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deliveries = await prisma.delivery.findMany({
      where: { companyId: id },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(deliveries);
  } catch (error) {
    console.error("Erro ao buscar entregas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar entregas" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const delivery = await prisma.delivery.create({
      data: {
        title: body.title,
        status: body.status || "PENDING",
        progress: body.progress || 0,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        assignee: body.assignee,
        impact: body.impact || "MEDIUM",
        cadence: body.cadence || null,
        companyId: id,
      },
    });

    await prisma.timelineEvent.create({
      data: {
        type: "DELIVERY",
        title: `Entrega criada: ${body.title}`,
        description: body.description,
        date: new Date(),
        companyId: id,
      },
    });

    return NextResponse.json(delivery, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar entrega:", error);
    return NextResponse.json(
      { error: "Erro ao criar entrega" },
      { status: 500 }
    );
  }
}
