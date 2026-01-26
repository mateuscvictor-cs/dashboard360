import { NextRequest, NextResponse } from "next/server"
import { requireRole, getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    const session = await getSession()

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const companyId = searchParams.get("companyId")
    const csOwnerId = searchParams.get("csOwnerId")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    const user = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      select: { role: true, csOwnerId: true },
    })

    const where: Record<string, unknown> = {}

    if (user?.role === "CS_OWNER" && user.csOwnerId) {
      where.company = { csOwnerId: user.csOwnerId }
    } else if (csOwnerId) {
      where.company = { csOwnerId }
    }

    if (status) {
      const statuses = status.split(",").map((s) => s.trim().toUpperCase())
      where.status = { in: statuses }
    }

    if (companyId) {
      where.companyId = companyId
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            csOwner: { select: { id: true, name: true } },
          },
        },
        completion: {
          select: {
            id: true,
            completedAt: true,
            completedBy: { select: { name: true } },
          },
        },
        meetings: {
          select: { id: true },
        },
        documents: {
          select: { id: true },
        },
        _count: {
          select: {
            meetings: true,
            documents: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { dueDate: "asc" },
      ],
      take: limit ? parseInt(limit) : 50,
      skip: offset ? parseInt(offset) : 0,
    })

    const total = await prisma.delivery.count({ where })

    return NextResponse.json({
      deliveries,
      total,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    })
  } catch (error) {
    console.error("Erro ao buscar entregas:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao buscar entregas" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const body = await request.json()

    if (!body.title || !body.companyId) {
      return NextResponse.json(
        { error: "Título e empresa são obrigatórios" },
        { status: 400 }
      )
    }

    const delivery = await prisma.delivery.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.status || "PENDING",
        progress: body.progress || 0,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        assignee: body.assignee,
        blockers: body.blockers || [],
        impact: body.impact || "MEDIUM",
        cadence: body.cadence,
        companyId: body.companyId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            csOwner: { select: { id: true, name: true } },
          },
        },
      },
    })

    return NextResponse.json(delivery, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar entrega:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao criar entrega" },
      { status: 500 }
    )
  }
}
