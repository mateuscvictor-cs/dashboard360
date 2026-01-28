import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/db"
import { ClientApprovalStatus } from "@prisma/client"
import { notificationService } from "@/services/notification.service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const user = session.user as { companyId?: string; id: string; name?: string }
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário não vinculado a empresa" }, { status: 400 })
    }

    const { id } = await params
    const body = await request.json()

    const delivery = await prisma.delivery.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        company: {
          include: {
            users: true,
            csOwner: { include: { user: true } },
          },
        },
      },
    })

    if (!delivery) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      )
    }

    if (delivery.status !== "COMPLETED" && delivery.clientApprovalStatus !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { error: "Entrega não está aguardando aprovação" },
        { status: 400 }
      )
    }

    const validActions = ["approve", "request_changes"]
    if (!validActions.includes(body.action)) {
      return NextResponse.json(
        { error: "Ação inválida. Use 'approve' ou 'request_changes'" },
        { status: 400 }
      )
    }

    if (body.action === "request_changes" && !body.reason) {
      return NextResponse.json(
        { error: "Motivo é obrigatório para solicitar alterações" },
        { status: 400 }
      )
    }

    const newStatus: ClientApprovalStatus = body.action === "approve" 
      ? "APPROVED" 
      : "CHANGES_REQUESTED"

    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: {
        clientApprovalStatus: newStatus,
        clientApprovedAt: body.action === "approve" ? new Date() : null,
        clientApprovedById: body.action === "approve" ? user.id : null,
        status: body.action === "approve" ? "COMPLETED" : "IN_PROGRESS",
      },
      include: {
        company: {
          include: {
            users: true,
            csOwner: { include: { user: true } },
          },
        },
      },
    })

    const commentType = body.action === "approve" ? "APPROVAL" : "CHANGE_REQUEST"
    const commentContent = body.action === "approve"
      ? body.comment || "Entrega aprovada pelo cliente."
      : body.reason

    const comment = await prisma.deliveryComment.create({
      data: {
        content: commentContent,
        type: commentType,
        deliveryId: id,
        authorId: user.id,
      },
      include: {
        author: true,
        delivery: {
          include: {
            company: {
              include: {
                users: true,
                csOwner: { include: { user: true } },
              },
            },
          },
        },
      },
    })

    if (body.action === "approve") {
      notificationService.notifyDeliveryApproved(updatedDelivery as never).catch(console.error)
    } else {
      notificationService.notifyClientComment(comment as never).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
      message: body.action === "approve" 
        ? "Entrega aprovada com sucesso" 
        : "Solicitação de alterações enviada",
    })
  } catch (error) {
    console.error("Erro ao processar aprovação:", error)
    return NextResponse.json(
      { error: "Erro ao processar aprovação" },
      { status: 500 }
    )
  }
}
