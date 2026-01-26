import { NextResponse } from "next/server"
import { requireRole, getSession } from "@/lib/auth-server"
import { surveyService } from "@/services/survey.service"
import { prisma } from "@/lib/db"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    const session = await getSession()

    const { id } = await params
    const body = await request.json()

    if (!body.feedback || body.feedback.trim().length < 50) {
      return NextResponse.json(
        { error: "Feedback é obrigatório e deve ter no mínimo 50 caracteres" },
        { status: 400 }
      )
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { completion: true },
    })

    if (!delivery) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      )
    }

    if (delivery.completion) {
      return NextResponse.json(
        { error: "Entrega já foi concluída" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      select: { role: true, csOwnerId: true },
    })

    let completedById = user?.csOwnerId

    if (!completedById && user?.role === "ADMIN") {
      const company = await prisma.company.findFirst({
        where: {
          deliveries: { some: { id } },
        },
        select: { csOwnerId: true },
      })
      completedById = company?.csOwnerId || undefined
    }

    if (!completedById) {
      const firstCsOwner = await prisma.cSOwner.findFirst()
      completedById = firstCsOwner?.id
    }

    if (!completedById) {
      return NextResponse.json(
        { error: "Nenhum CS Owner encontrado no sistema" },
        { status: 404 }
      )
    }

    const result = await surveyService.completeDelivery({
      deliveryId: id,
      completedById,
      feedback: body.feedback.trim(),
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Erro ao concluir entrega:", error)
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao concluir entrega" },
      { status: 500 }
    )
  }
}
