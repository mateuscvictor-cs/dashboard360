import { NextResponse } from "next/server"
import { requireCompanyAccess } from "@/lib/auth-server"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireCompanyAccess(id)

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

    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
      }
      if (error.message === "CompanyNotFound") {
        return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
      }
    }

    return NextResponse.json(
      { error: "Erro ao buscar pesquisas" },
      { status: 500 }
    )
  }
}
