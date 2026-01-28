import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { prisma } from "@/lib/db"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { id, commentId } = await params

    const existing = await prisma.deliveryComment.findFirst({
      where: {
        id: commentId,
        deliveryId: id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Comentário não encontrado" },
        { status: 404 }
      )
    }

    await prisma.deliveryComment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar comentário:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao deletar comentário" },
      { status: 500 }
    )
  }
}
