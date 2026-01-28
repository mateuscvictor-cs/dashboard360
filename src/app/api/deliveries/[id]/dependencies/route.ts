import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { prisma } from "@/lib/db"
import { DependencyType } from "@prisma/client"
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
      select: { id: true },
    })

    if (!delivery) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      )
    }

    const dependencies = await prisma.deliveryDependency.findMany({
      where: { deliveryId: id },
      orderBy: [
        { status: "asc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json(dependencies)
  } catch (error) {
    console.error("Erro ao buscar dependências:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao buscar dependências" },
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

    if (!body.title || !body.type) {
      return NextResponse.json(
        { error: "Título e tipo são obrigatórios" },
        { status: 400 }
      )
    }

    const validTypes: DependencyType[] = ["ACCESS", "DOCUMENT", "APPROVAL", "INFORMATION"]
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: "Tipo inválido" },
        { status: 400 }
      )
    }

    const dependency = await prisma.deliveryDependency.create({
      data: {
        title: body.title,
        description: body.description || null,
        type: body.type,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        deliveryId: id,
      },
    })

    const pendingCount = await prisma.deliveryDependency.count({
      where: {
        deliveryId: id,
        status: { in: ["PENDING", "OVERDUE"] },
      },
    })

    if (pendingCount > 0) {
      await prisma.delivery.update({
        where: { id },
        data: { status: "BLOCKED" },
      })
    }

    notificationService.notifyDependencyAdded(delivery as never, dependency).catch(console.error)

    return NextResponse.json(dependency, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar dependência:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao criar dependência" },
      { status: 500 }
    )
  }
}
