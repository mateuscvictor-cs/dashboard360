import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const workshops = await prisma.workshop.findMany({
      where: { companyId: id },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(workshops);
  } catch (error) {
    console.error("Erro ao buscar workshops:", error);
    return NextResponse.json(
      { error: "Erro ao buscar workshops" },
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

    const workshop = await prisma.workshop.create({
      data: {
        title: body.title,
        description: body.description,
        date: new Date(body.date),
        duration: body.duration ? parseInt(body.duration) : null,
        participants: body.participants || 0,
        locationType: body.locationType || "ONLINE",
        address: body.address,
        meetingLink: body.meetingLink,
        fathomLink: body.fathomLink,
        cadence: body.cadence || null,
        companyId: id,
        createdById: body.createdById,
      },
    });

    await prisma.timelineEvent.create({
      data: {
        type: "MEETING",
        title: `Workshop agendado: ${body.title}`,
        description: body.description,
        date: new Date(body.date),
        companyId: id,
      },
    });

    return NextResponse.json(workshop, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar workshop:", error);
    return NextResponse.json(
      { error: "Erro ao criar workshop" },
      { status: 500 }
    );
  }
}
