import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { prisma } from "@/lib/db"
import { notificationService } from "@/services/notification.service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; depId: string }> }
) {
  try {
    const session = await requireRole(["CLIENT", "CLIENT_MEMBER"])

    const user = session.user as { companyId?: string; id: string }
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário não vinculado a empresa" }, { status: 400 })
    }

    const { id, depId } = await params
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

    const dependency = await prisma.deliveryDependency.findFirst({
      where: {
        id: depId,
        deliveryId: id,
      },
    })

    if (!dependency) {
      return NextResponse.json(
        { error: "Dependência não encontrada" },
        { status: 404 }
      )
    }

    if (dependency.status === "PROVIDED") {
      return NextResponse.json(
        { error: "Dependência já foi fornecida" },
        { status: 400 }
      )
    }

    const updatedDependency = await prisma.deliveryDependency.update({
      where: { id: depId },
      data: {
        status: "PROVIDED",
        providedAt: new Date(),
        providedNote: body.note || null,
      },
      include: {
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

    const pendingCount = await prisma.deliveryDependency.count({
      where: {
        deliveryId: id,
        status: { in: ["PENDING", "OVERDUE"] },
      },
    })

    if (pendingCount === 0 && delivery.status === "BLOCKED") {
      await prisma.delivery.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      })
    }

    notificationService.notifyDependencyProvided(updatedDependency as never).catch(console.error)

    return NextResponse.json(updatedDependency)
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    console.error("Erro ao fornecer dependência:", error)
    return NextResponse.json(
      { error: "Erro ao fornecer dependência" },
      { status: 500 }
    )
  }
}
