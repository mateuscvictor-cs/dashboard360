import { NextResponse } from "next/server"
import { requireRole, getSession } from "@/lib/auth-server"
import { surveyService } from "@/services/survey.service"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    const session = await getSession()

    const body = await request.json()

    if (!body.companyId) {
      return NextResponse.json(
        { error: "companyId é obrigatório" },
        { status: 400 }
      )
    }

    const company = await prisma.company.findUnique({
      where: { id: body.companyId },
      select: { id: true, name: true },
    })

    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      )
    }

    const hasPending = await surveyService.hasPendingNPS(body.companyId)

    if (hasPending) {
      return NextResponse.json(
        { error: "Já existe uma pesquisa NPS pendente para este cliente" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      select: { role: true, csOwnerId: true },
    })

    const survey = await surveyService.create({
      type: "NPS",
      companyId: body.companyId,
      requestedById: user?.csOwnerId || undefined,
      aiSuggested: body.aiSuggested || false,
      aiReason: body.aiReason,
    })

    const senderLabel = user?.role === "ADMIN" ? "Admin" : "CS"

    await prisma.timelineEvent.create({
      data: {
        companyId: body.companyId,
        type: "FEEDBACK",
        title: "Pesquisa NPS enviada",
        description: body.aiReason || `Pesquisa NPS enviada manualmente pelo ${senderLabel}`,
        date: new Date(),
        sentiment: "NEUTRAL",
      },
    })

    return NextResponse.json(survey, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar pesquisa NPS:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao criar pesquisa NPS" },
      { status: 500 }
    )
  }
}
