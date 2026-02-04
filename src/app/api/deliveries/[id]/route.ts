import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { prisma } from "@/lib/db"
import { notificationService } from "@/services/notification.service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { id } = await params

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            csOwner: { select: { id: true, name: true, avatar: true } },
          },
        },
        completion: {
          select: {
            id: true,
            feedback: true,
            fathomLink: true,
            completedAt: true,
            completedBy: { select: { id: true, name: true } },
          },
        },
        meetings: {
          include: {
            participants: {
              include: {
                contact: { select: { id: true, name: true, email: true } },
              },
            },
          },
          orderBy: { date: "desc" },
        },
        documents: {
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        surveys: {
          include: {
            response: true,
          },
          orderBy: { createdAt: "desc" },
        },
        dependencies: {
          orderBy: [
            { status: "asc" },
            { dueDate: "asc" },
          ],
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, image: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        clientApprovedBy: {
          select: { id: true, name: true },
        },
        adminApprovedBy: {
          select: { id: true, name: true },
        },
      },
    })

    if (!delivery) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(delivery)
  } catch (error) {
    console.error("Erro ao buscar entrega:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao buscar entrega" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.delivery.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    const validTypes = ["AUTOMATION", "IPC", "OTHER"]
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.impactDescription !== undefined) updateData.impactDescription = body.impactDescription
    if (body.type !== undefined) updateData.type = body.type && validTypes.includes(body.type) ? body.type : null
    if (body.typeOtherSpec !== undefined) updateData.typeOtherSpec = body.typeOtherSpec ?? null
    if (body.status !== undefined) updateData.status = body.status
    if (body.progress !== undefined) updateData.progress = body.progress
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.assignee !== undefined) updateData.assignee = body.assignee
    if (body.blockers !== undefined) updateData.blockers = body.blockers
    if (body.impact !== undefined) updateData.impact = body.impact
    if (body.cadence !== undefined) updateData.cadence = body.cadence
    if (body.clientApprovalStatus !== undefined) updateData.clientApprovalStatus = body.clientApprovalStatus

    const delivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          include: {
            users: true,
            csOwner: { include: { user: true } },
          },
        },
        completion: {
          select: {
            id: true,
            completedAt: true,
            completedBy: { select: { name: true } },
          },
        },
      },
    })

    if (body.progress !== undefined && body.progress !== existing.progress) {
      notificationService.notifyDeliveryProgress(
        delivery as never,
        existing.progress,
        body.progress
      ).catch(console.error)
    }

    return NextResponse.json(delivery)
  } catch (error) {
    console.error("Erro ao atualizar entrega:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao atualizar entrega" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"])
    
    const { id } = await params

    const existing = await prisma.delivery.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      )
    }

    await prisma.delivery.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar entrega:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao deletar entrega" },
      { status: 500 }
    )
  }
}
