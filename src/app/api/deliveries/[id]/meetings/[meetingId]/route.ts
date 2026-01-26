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

    const meeting = await prisma.deliveryMeeting.findUnique({
      where: { id: meetingId },
      include: {
        participants: {
          include: {
            contact: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        delivery: {
          select: {
            id: true,
            title: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!meeting) {
      return NextResponse.json(
        { error: "Reunião não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(meeting)
  } catch (error) {
    console.error("Erro ao buscar reunião:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao buscar reunião" },
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

    const existing = await prisma.deliveryMeeting.findUnique({
      where: { id: meetingId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Reunião não encontrada" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.date !== undefined) updateData.date = new Date(body.date)
    if (body.duration !== undefined) updateData.duration = body.duration
    if (body.meetingLink !== undefined) updateData.meetingLink = body.meetingLink
    if (body.fathomLink !== undefined) updateData.fathomLink = body.fathomLink
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.status !== undefined) updateData.status = body.status

    const meeting = await prisma.deliveryMeeting.update({
      where: { id: meetingId },
      data: updateData,
      include: {
        participants: {
          include: {
            contact: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    return NextResponse.json(meeting)
  } catch (error) {
    console.error("Erro ao atualizar reunião:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao atualizar reunião" },
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

    const existing = await prisma.deliveryMeeting.findUnique({
      where: { id: meetingId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Reunião não encontrada" },
        { status: 404 }
      )
    }

    await prisma.deliveryMeeting.delete({
      where: { id: meetingId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar reunião:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao deletar reunião" },
      { status: 500 }
    )
  }
}
