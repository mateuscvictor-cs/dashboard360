import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["CLIENT", "CLIENT_MEMBER"])

    const user = session.user as { companyId?: string }
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário não vinculado a empresa" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: Record<string, unknown> = { companyId: user.companyId }
    
    if (status) {
      where.status = status
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        dependencies: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            dueDate: true,
          },
        },
        documents: {
          select: {
            id: true,
            title: true,
            type: true,
            url: true,
          },
          take: 3,
        },
        meetings: {
          select: {
            id: true,
            title: true,
            date: true,
            status: true,
          },
          orderBy: { date: "desc" },
          take: 3,
        },
        completion: {
          select: {
            completedAt: true,
            feedback: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { dueDate: "asc" },
      ],
    })

    const deliveriesWithPendingCount = deliveries.map((delivery) => {
      const pendingDependencies = delivery.dependencies.filter(
        (dep) => dep.status === "PENDING" || dep.status === "OVERDUE"
      )

      return {
        ...delivery,
        pendingDependenciesCount: pendingDependencies.length,
        hasPendingDependencies: pendingDependencies.length > 0,
      }
    })

    return NextResponse.json(deliveriesWithPendingCount)
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    console.error("Erro ao buscar entregas do cliente:", error)
    return NextResponse.json(
      { error: "Erro ao buscar entregas" },
      { status: 500 }
    )
  }
}
