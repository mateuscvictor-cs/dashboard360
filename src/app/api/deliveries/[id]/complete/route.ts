import { NextResponse } from "next/server"
import { requireRole, getSession } from "@/lib/auth-server"
import { surveyService } from "@/services/survey.service"
import { prisma } from "@/lib/db"
import { notificationService } from "@/services/notification.service"

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

    if (!body.fathomLink || typeof body.fathomLink !== "string" || !body.fathomLink.trim()) {
      return NextResponse.json(
        { error: "Link do Fathom é obrigatório" },
        { status: 400 }
      )
    }

    const proofDocuments = Array.isArray(body.proofDocuments) ? body.proofDocuments : []
    if (proofDocuments.length === 0) {
      return NextResponse.json(
        { error: "É obrigatório anexar ao menos uma prova (print, documento ou vídeo)" },
        { status: 400 }
      )
    }
    for (const p of proofDocuments) {
      if (!p.url || typeof p.url !== "string" || !p.url.trim()) {
        return NextResponse.json(
          { error: "Cada prova deve ter título e URL" },
          { status: 400 }
        )
      }
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        completion: true,
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
      fathomLink: body.fathomLink.trim(),
      proofDocuments: proofDocuments.map((p: { title?: string; url: string; type?: string }) => ({
        title: (p.title && String(p.title).trim()) || "Prova",
        url: String(p.url).trim(),
        type: p.type && ["PRESENTATION", "SPREADSHEET", "PDF", "VIDEO", "IMAGE", "LINK", "OTHER"].includes(p.type) ? p.type : "OTHER",
      })),
    })

    notificationService.notifyDeliveryCompleted(delivery as never).catch(console.error)

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
