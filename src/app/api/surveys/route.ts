import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { surveyService } from "@/services/survey.service"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true, csOwnerId: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    if (user.role === "CLIENT" && user.companyId) {
      const surveys = await surveyService.findPendingByCompany(user.companyId)
      return NextResponse.json(surveys)
    }

    if ((user.role === "CS_OWNER" || user.role === "ADMIN") && user.csOwnerId) {
      const companies = await prisma.company.findMany({
        where: { csOwnerId: user.csOwnerId },
        select: { id: true },
      })

      const companyIds = companies.map((c) => c.id)

      const surveys = await prisma.survey.findMany({
        where: { companyId: { in: companyIds } },
        include: {
          company: { select: { id: true, name: true } },
          delivery: { select: { id: true, title: true } },
          workshop: { select: { id: true, title: true } },
          response: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })

      return NextResponse.json(surveys)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error("Erro ao buscar pesquisas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar pesquisas" },
      { status: 500 }
    )
  }
}
