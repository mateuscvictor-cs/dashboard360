import { NextRequest, NextResponse } from "next/server"
import { requireRole, getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { id } = await params

    const delivery = await prisma.delivery.findUnique({
      where: { id },
    })

    if (!delivery) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      )
    }

    const documents = await prisma.deliveryDocument.findMany({
      where: { deliveryId: id },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Erro ao buscar documentos:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao buscar documentos" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    const session = await getSession()
    
    const { id } = await params
    const body = await request.json()

    const delivery = await prisma.delivery.findUnique({
      where: { id },
    })

    if (!delivery) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      )
    }

    if (!body.title || !body.url) {
      return NextResponse.json(
        { error: "Título e URL são obrigatórios" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      select: { csOwnerId: true },
    })

    const document = await prisma.deliveryDocument.create({
      data: {
        title: body.title,
        description: body.description,
        url: body.url,
        type: body.type || "OTHER",
        deliveryId: id,
        uploadedById: user?.csOwnerId,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar documento:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao criar documento" },
      { status: 500 }
    )
  }
}
