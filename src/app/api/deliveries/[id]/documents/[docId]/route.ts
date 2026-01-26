import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { docId } = await params

    const document = await prisma.deliveryDocument.findUnique({
      where: { id: docId },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
        delivery: {
          select: {
            id: true,
            title: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error("Erro ao buscar documento:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao buscar documento" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { docId } = await params
    const body = await request.json()

    const existing = await prisma.deliveryDocument.findUnique({
      where: { id: docId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.url !== undefined) updateData.url = body.url
    if (body.type !== undefined) updateData.type = body.type

    const document = await prisma.deliveryDocument.update({
      where: { id: docId },
      data: updateData,
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error("Erro ao atualizar documento:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao atualizar documento" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { docId } = await params

    const existing = await prisma.deliveryDocument.findUnique({
      where: { id: docId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      )
    }

    await prisma.deliveryDocument.delete({
      where: { id: docId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar documento:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao deletar documento" },
      { status: 500 }
    )
  }
}
