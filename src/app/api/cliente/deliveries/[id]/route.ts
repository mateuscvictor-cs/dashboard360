import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const user = session.user as { companyId?: string }
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário não vinculado a empresa" }, { status: 400 })
    }

    const { id } = await params

    const delivery = await prisma.delivery.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            csOwner: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        dependencies: {
          orderBy: [
            { status: "asc" },
            { dueDate: "asc" },
          ],
        },
        documents: {
          include: {
            uploadedBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        meetings: {
          include: {
            participants: {
              select: {
                id: true,
                name: true,
                email: true,
                attended: true,
              },
            },
          },
          orderBy: { date: "desc" },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, image: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        completion: {
          include: {
            completedBy: {
              select: { id: true, name: true },
            },
          },
        },
        clientApprovedBy: {
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

    const pendingDependencies = delivery.dependencies.filter(
      (dep) => dep.status === "PENDING" || dep.status === "OVERDUE"
    )

    return NextResponse.json({
      ...delivery,
      pendingDependenciesCount: pendingDependencies.length,
      hasPendingDependencies: pendingDependencies.length > 0,
    })
  } catch (error) {
    console.error("Erro ao buscar entrega do cliente:", error)
    return NextResponse.json(
      { error: "Erro ao buscar entrega" },
      { status: 500 }
    )
  }
}
