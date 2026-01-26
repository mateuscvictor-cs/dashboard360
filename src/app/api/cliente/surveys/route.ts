import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { surveyService } from "@/services/survey.service"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true },
    })

    if (!user || user.role !== "CLIENT" || !user.companyId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get("all") === "true"

    if (all) {
      const surveys = await prisma.survey.findMany({
        where: { companyId: user.companyId },
        include: {
          delivery: { select: { id: true, title: true } },
          workshop: { select: { id: true, title: true } },
          response: {
            select: {
              id: true,
              npsScore: true,
              csatScore: true,
              adoptionScore: true,
              comment: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json(surveys)
    }

    const surveys = await surveyService.findPendingByCompany(user.companyId)

    return NextResponse.json(surveys)
  } catch (error) {
    console.error("Erro ao buscar pesquisas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar pesquisas" },
      { status: 500 }
    )
  }
}
