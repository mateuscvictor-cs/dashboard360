import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { prisma } from "@/lib/db"
import { CommentType } from "@prisma/client"
import { notificationService } from "@/services/notification.service"

function normalizeAttachments(
  raw: unknown
): { fileName: string; url: string }[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (x): x is { fileName?: string; url?: string } =>
        x != null && typeof x === "object"
    )
    .filter((x) => typeof x.fileName === "string" && typeof x.url === "string")
    .map((x) => ({ fileName: x.fileName!, url: x.url! }))
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["CLIENT", "CLIENT_MEMBER"])

    const user = session.user as { companyId?: string }
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário não vinculado a empresa" }, { status: 400 })
    }

    const { id } = await params

    const delivery = await prisma.delivery.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      select: { id: true },
    })

    if (!delivery) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      )
    }

    const comments = await prisma.deliveryComment.findMany({
      where: { deliveryId: id },
      include: {
        author: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(comments)
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    console.error("Erro ao buscar comentários:", error)
    return NextResponse.json(
      { error: "Erro ao buscar comentários" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["CLIENT", "CLIENT_MEMBER"])

    const user = session.user as { companyId?: string; id: string }
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário não vinculado a empresa" }, { status: 400 })
    }

    const { id } = await params
    const body = await request.json()

    const delivery = await prisma.delivery.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        company: {
          include: {
            users: true,
            csOwner: { include: { user: true } },
          },
        },
      },
    })

    if (!delivery) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      )
    }

    if (!body.content) {
      return NextResponse.json(
        { error: "Conteúdo é obrigatório" },
        { status: 400 }
      )
    }

    const allowedTypes: CommentType[] = ["COMMENT", "CHANGE_REQUEST"]
    const commentType = body.type || "COMMENT"
    
    if (!allowedTypes.includes(commentType)) {
      return NextResponse.json(
        { error: "Tipo inválido para cliente" },
        { status: 400 }
      )
    }

    const attachments = normalizeAttachments(body.attachments)

    const comment = await prisma.deliveryComment.create({
      data: {
        content: body.content,
        type: commentType,
        deliveryId: id,
        authorId: user.id,
        attachments,
      },
      include: {
        author: true,
        delivery: {
          include: {
            company: {
              include: {
                users: true,
                csOwner: { include: { user: true } },
              },
            },
          },
        },
      },
    })

    notificationService.notifyClientComment(comment as never).catch(console.error)

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    console.error("Erro ao criar comentário:", error)
    return NextResponse.json(
      { error: "Erro ao criar comentário" },
      { status: 500 }
    )
  }
}
