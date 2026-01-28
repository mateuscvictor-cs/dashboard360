import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { prisma } from "@/lib/db"
import { DependencyType, DependencyStatus } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; depId: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { id, depId } = await params

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

    return NextResponse.json(dependency)
  } catch (error) {
    console.error("Erro ao buscar dependência:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao buscar dependência" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; depId: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { id, depId } = await params
    const body = await request.json()

    const existing = await prisma.deliveryDependency.findFirst({
      where: {
        id: depId,
        deliveryId: id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Dependência não encontrada" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    
    if (body.type !== undefined) {
      const validTypes: DependencyType[] = ["ACCESS", "DOCUMENT", "APPROVAL", "INFORMATION"]
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: "Tipo inválido" },
          { status: 400 }
        )
      }
      updateData.type = body.type
    }

    if (body.status !== undefined) {
      const validStatuses: DependencyStatus[] = ["PENDING", "PROVIDED", "OVERDUE", "NOT_NEEDED"]
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Status inválido" },
          { status: 400 }
        )
      }
      updateData.status = body.status
      
      if (body.status === "PROVIDED") {
        updateData.providedAt = new Date()
      }
    }

    const dependency = await prisma.deliveryDependency.update({
      where: { id: depId },
      data: updateData,
    })

    const pendingCount = await prisma.deliveryDependency.count({
      where: {
        deliveryId: id,
        status: { in: ["PENDING", "OVERDUE"] },
      },
    })

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      select: { status: true },
    })

    if (pendingCount === 0 && delivery?.status === "BLOCKED") {
      await prisma.delivery.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      })
    } else if (pendingCount > 0 && delivery?.status !== "BLOCKED" && delivery?.status !== "COMPLETED") {
      await prisma.delivery.update({
        where: { id },
        data: { status: "BLOCKED" },
      })
    }

    return NextResponse.json(dependency)
  } catch (error) {
    console.error("Erro ao atualizar dependência:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao atualizar dependência" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; depId: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { id, depId } = await params

    const existing = await prisma.deliveryDependency.findFirst({
      where: {
        id: depId,
        deliveryId: id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Dependência não encontrada" },
        { status: 404 }
      )
    }

    await prisma.deliveryDependency.delete({
      where: { id: depId },
    })

    const pendingCount = await prisma.deliveryDependency.count({
      where: {
        deliveryId: id,
        status: { in: ["PENDING", "OVERDUE"] },
      },
    })

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      select: { status: true },
    })

    if (pendingCount === 0 && delivery?.status === "BLOCKED") {
      await prisma.delivery.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar dependência:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao deletar dependência" },
      { status: 500 }
    )
  }
}
