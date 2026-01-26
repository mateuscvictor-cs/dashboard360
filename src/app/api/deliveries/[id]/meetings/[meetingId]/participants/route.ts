import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { meetingId } = await params

    const participants = await prisma.deliveryMeetingParticipant.findMany({
      where: { meetingId },
      include: {
        contact: { select: { id: true, name: true, email: true, role: true, avatar: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(participants)
  } catch (error) {
    console.error("Erro ao buscar participantes:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao buscar participantes" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { meetingId } = await params
    const body = await request.json()

    const meeting = await prisma.deliveryMeeting.findUnique({
      where: { id: meetingId },
    })

    if (!meeting) {
      return NextResponse.json(
        { error: "Reunião não encontrada" },
        { status: 404 }
      )
    }

    if (!body.name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      )
    }

    const participant = await prisma.deliveryMeetingParticipant.create({
      data: {
        name: body.name,
        email: body.email,
        role: body.role,
        attended: body.attended || false,
        meetingId,
        contactId: body.contactId,
      },
      include: {
        contact: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    console.error("Erro ao adicionar participante:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao adicionar participante" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { meetingId } = await params
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get("participantId")

    if (!participantId) {
      return NextResponse.json(
        { error: "ID do participante é obrigatório" },
        { status: 400 }
      )
    }

    const participant = await prisma.deliveryMeetingParticipant.findFirst({
      where: { id: participantId, meetingId },
    })

    if (!participant) {
      return NextResponse.json(
        { error: "Participante não encontrado" },
        { status: 404 }
      )
    }

    await prisma.deliveryMeetingParticipant.delete({
      where: { id: participantId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover participante:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao remover participante" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { meetingId } = await params
    const body = await request.json()

    if (!body.participantId) {
      return NextResponse.json(
        { error: "ID do participante é obrigatório" },
        { status: 400 }
      )
    }

    const participant = await prisma.deliveryMeetingParticipant.findFirst({
      where: { id: body.participantId, meetingId },
    })

    if (!participant) {
      return NextResponse.json(
        { error: "Participante não encontrado" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.attended !== undefined) updateData.attended = body.attended
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.role !== undefined) updateData.role = body.role

    const updated = await prisma.deliveryMeetingParticipant.update({
      where: { id: body.participantId },
      data: updateData,
      include: {
        contact: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Erro ao atualizar participante:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao atualizar participante" },
      { status: 500 }
    )
  }
}
