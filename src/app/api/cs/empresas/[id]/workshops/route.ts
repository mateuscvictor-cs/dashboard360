import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;

    const workshops = await prisma.workshop.findMany({
      where: { companyId: id },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(workshops);
  } catch (error) {
    console.error("Erro ao buscar workshops:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

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
    const {
      title,
      description,
      date,
      duration,
      participants,
      locationType,
      address,
      meetingLink,
      fathomLink,
      attachments,
      notes,
    } = body;

    if (!title || !date) {
      return NextResponse.json({ error: "Título e data são obrigatórios" }, { status: 400 });
    }

    const workshop = await prisma.workshop.create({
      data: {
        title,
        description,
        date: new Date(date),
        duration,
        participants: participants || 0,
        locationType: locationType || "ONLINE",
        address,
        meetingLink,
        fathomLink,
        attachments: attachments || [],
        notes,
        companyId: id,
        createdById: user.csOwnerId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    await prisma.company.update({
      where: { id },
      data: {
        workshopsCount: { increment: 1 },
        lastInteraction: new Date(),
      },
    });

    return NextResponse.json(workshop, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar workshop:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
