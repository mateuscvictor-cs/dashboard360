import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type { AdminApprovalStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMIN"]);
    const user = session.user as { id: string };

    const { id } = await params
    const body = await request.json()

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, csOwnerId: true },
        },
        completion: {
          select: { id: true, fathomLink: true, completedBy: { select: { id: true, name: true } } },
        },
      },
    })

    if (!delivery) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      )
    }

    if (delivery.adminApprovalStatus !== "PENDING_ADMIN_APPROVAL") {
      return NextResponse.json(
        { error: "Entrega não está aguardando aprovação do admin" },
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

    if (body.action === "approve") {
      const score = body.score != null ? Number(body.score) : NaN
      if (Number.isNaN(score) || score < 0 || score > 10) {
        return NextResponse.json(
          { error: "Nota é obrigatória e deve ser entre 0 e 10" },
          { status: 400 }
        )
      }

      const updated = await prisma.delivery.update({
        where: { id },
        data: {
          adminApprovalStatus: "APPROVED_BY_ADMIN" as AdminApprovalStatus,
          adminApprovedAt: new Date(),
          adminApprovedById: user.id,
          adminScore: score,
          clientApprovalStatus: "PENDING_APPROVAL",
        },
        include: {
          company: { select: { id: true, name: true, csOwner: { select: { id: true, name: true } } } },
          completion: { select: { fathomLink: true, completedBy: { select: { name: true } } } },
        },
      })

      return NextResponse.json({
        success: true,
        delivery: updated,
        message: "Entrega aprovada. Enviada para aprovação do cliente.",
      })
    }

    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        adminApprovalStatus: "CHANGES_REQUESTED_BY_ADMIN" as AdminApprovalStatus,
        status: "IN_PROGRESS",
        progress: Math.min(delivery.progress, 90),
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      delivery: updated,
      message: "Solicitação de alterações registrada.",
    })
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    console.error("Erro ao aprovar entrega (admin):", error)
    return NextResponse.json(
      { error: "Erro ao processar aprovação" },
      { status: 500 }
    )
  }
}
