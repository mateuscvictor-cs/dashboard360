import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { surveyService } from "@/services/survey.service"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const survey = await surveyService.findById(id)

    if (!survey) {
      return NextResponse.json({ error: "Pesquisa não encontrada" }, { status: 404 })
    }

    if (survey.status !== "PENDING") {
      return NextResponse.json(
        { error: "Esta pesquisa já foi respondida ou expirou" },
        { status: 400 }
      )
    }

    if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Esta pesquisa expirou" },
        { status: 400 }
      )
    }

    if (survey.type === "NPS") {
      if (
        body.npsScore === undefined ||
        body.atendimentoScore === undefined ||
        body.prazosScore === undefined ||
        body.qualidadeScore === undefined ||
        body.treinamentoScore === undefined ||
        body.clarezaScore === undefined
      ) {
        return NextResponse.json(
          { error: "Todas as notas são obrigatórias para NPS" },
          { status: 400 }
        )
      }

      const scores = [
        body.npsScore,
        body.atendimentoScore,
        body.prazosScore,
        body.qualidadeScore,
        body.treinamentoScore,
        body.clarezaScore,
      ]

      if (scores.some((s) => s < 0 || s > 10)) {
        return NextResponse.json(
          { error: "Notas devem estar entre 0 e 10" },
          { status: 400 }
        )
      }
    }

    if (survey.type === "CSAT") {
      if (body.csatScore === undefined) {
        return NextResponse.json(
          { error: "Nota CSAT é obrigatória" },
          { status: 400 }
        )
      }

      if (body.csatScore < 0 || body.csatScore > 10) {
        return NextResponse.json(
          { error: "Nota deve estar entre 0 e 10" },
          { status: 400 }
        )
      }
    }

    if (survey.type === "ADOPTION_CHECK") {
      if (body.adoptionScore === undefined) {
        return NextResponse.json(
          { error: "Nota de adoção é obrigatória" },
          { status: 400 }
        )
      }

      if (body.adoptionScore < 0 || body.adoptionScore > 10) {
        return NextResponse.json(
          { error: "Nota deve estar entre 0 e 10" },
          { status: 400 }
        )
      }
    }

    const response = await surveyService.respond({
      surveyId: id,
      respondentId: session.user.id,
      npsScore: body.npsScore,
      atendimentoScore: body.atendimentoScore,
      prazosScore: body.prazosScore,
      qualidadeScore: body.qualidadeScore,
      treinamentoScore: body.treinamentoScore,
      clarezaScore: body.clarezaScore,
      csatScore: body.csatScore,
      adoptionScore: body.adoptionScore,
      comment: body.comment,
    })

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error("Erro ao responder pesquisa:", error)
    return NextResponse.json(
      { error: "Erro ao responder pesquisa" },
      { status: 500 }
    )
  }
}
