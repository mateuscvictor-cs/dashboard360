import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])

    const { id } = await params

    const company = await prisma.company.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      )
    }

    const surveys = await prisma.survey.findMany({
      where: { companyId: id },
      include: {
        delivery: { select: { id: true, title: true } },
        workshop: { select: { id: true, title: true } },
        requestedBy: { select: { id: true, name: true } },
        response: {
          include: {
            respondent: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(surveys)
  } catch (error) {
    console.error("Erro ao buscar pesquisas:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao buscar pesquisas" },
      { status: 500 }
    )
  }
}
