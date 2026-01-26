import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { id } = await params

    const delivery = await prisma.delivery.findUnique({
      where: { id },
    })

    if (!delivery) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      )
    }

    const meetings = await prisma.deliveryMeeting.findMany({
      where: { deliveryId: id },
      include: {
        participants: {
          include: {
            contact: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(meetings)
  } catch (error) {
    console.error("Erro ao buscar reuniões:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao buscar reuniões" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { id } = await params
    const body = await request.json()

    const delivery = await prisma.delivery.findUnique({
      where: { id },
    })

    if (!delivery) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      )
    }

    if (!body.title || !body.date) {
      return NextResponse.json(
        { error: "Título e data são obrigatórios" },
        { status: 400 }
      )
    }

    const meeting = await prisma.deliveryMeeting.create({
      data: {
        title: body.title,
        description: body.description,
        date: new Date(body.date),
        duration: body.duration,
        meetingLink: body.meetingLink,
        fathomLink: body.fathomLink,
        notes: body.notes,
        status: body.status || "SCHEDULED",
        deliveryId: id,
        participants: body.participants?.length > 0
          ? {
              create: body.participants.map((p: { name: string; email?: string; role?: string; contactId?: string }) => ({
                name: p.name,
                email: p.email,
                role: p.role,
                contactId: p.contactId,
              })),
            }
          : undefined,
      },
      include: {
        participants: {
          include: {
            contact: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar reunião:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao criar reunião" },
      { status: 500 }
    )
  }
}
