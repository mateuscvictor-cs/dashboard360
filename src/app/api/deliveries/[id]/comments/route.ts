import { NextRequest, NextResponse } from "next/server"
import { requireRole, getSession } from "@/lib/auth-server"
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
    await requireRole(["ADMIN", "CS_OWNER"])
    
    const { id } = await params

    const delivery = await prisma.delivery.findUnique({
      where: { id },
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
    console.error("Erro ao buscar comentários:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

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
    await requireRole(["ADMIN", "CS_OWNER"])
    const session = await getSession()
    
    const { id } = await params
    const body = await request.json()

    const delivery = await prisma.delivery.findUnique({
      where: { id },
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

    const validTypes: CommentType[] = ["COMMENT", "CHANGE_REQUEST", "APPROVAL", "REJECTION", "RESPONSE"]
    const commentType = body.type || "RESPONSE"
    
    if (!validTypes.includes(commentType)) {
      return NextResponse.json(
        { error: "Tipo inválido" },
        { status: 400 }
      )
    }

    const user = session?.user as { id: string }
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

    notificationService.notifyCommentResponse(comment as never).catch(console.error)

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar comentário:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Erro ao criar comentário" },
      { status: 500 }
    )
  }
}
