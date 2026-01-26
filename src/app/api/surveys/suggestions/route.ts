import { NextResponse } from "next/server"
import { requireRole, getSession } from "@/lib/auth-server"
import { npsSuggestionService } from "@/services/nps-suggestion.service"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    const session = await getSession()

    const user = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      select: { role: true, csOwnerId: true },
    })

    if (user?.role === "ADMIN") {
      const companies = await prisma.company.findMany({
        select: { id: true, name: true },
      })

      const results = await Promise.all(
        companies.map(async (company) => ({
          companyId: company.id,
          companyName: company.name,
          suggestion: await npsSuggestionService.analyze(company.id),
        }))
      )

      const suggestions = results
        .filter((r) => r.suggestion.shouldSend)
        .sort((a, b) => {
          const order = { HIGH: 3, MEDIUM: 2, LOW: 1 }
          return order[b.suggestion.confidence] - order[a.suggestion.confidence]
        })

      return NextResponse.json(suggestions)
    }

    if (!user?.csOwnerId) {
      return NextResponse.json(
        { error: "CS Owner não encontrado" },
        { status: 404 }
      )
    }

    const suggestions = await npsSuggestionService.analyzePortfolio(user.csOwnerId)

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error("Erro ao buscar sugestões:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao buscar sugestões" },
      { status: 500 }
    )
  }
}
