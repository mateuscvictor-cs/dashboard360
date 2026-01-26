import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hotseats = await prisma.hotseat.findMany({
      where: { companyId: id },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(hotseats);
  } catch (error) {
    console.error("Erro ao buscar hotseats:", error);
    return NextResponse.json(
      { error: "Erro ao buscar hotseats" },
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

    const hotseat = await prisma.hotseat.create({
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
        title: `Hotseat agendado: ${body.title}`,
        description: body.description,
        date: new Date(body.date),
        companyId: id,
      },
    });

    return NextResponse.json(hotseat, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar hotseat:", error);
    return NextResponse.json(
      { error: "Erro ao criar hotseat" },
      { status: 500 }
    );
  }
}
