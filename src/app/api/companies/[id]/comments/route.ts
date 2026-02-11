import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAccess, getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

function normalizeAttachments(
  raw: unknown
): { fileName: string; url: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (x): x is { fileName?: string; url?: string } =>
        x != null && typeof x === "object"
    )
    .filter((x) => typeof x.fileName === "string" && typeof x.url === "string")
    .map((x) => ({ fileName: x.fileName!, url: x.url! }));
}
import { notificationService } from "@/services/notification.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireCompanyAccess((await params).id);
    const { id } = await params;

    const comments = await prisma.companyComment.findMany({
      where: { companyId: id },
      include: {
        author: {
          select: { id: true, name: true, image: true, role: true },
        },
        mentions: {
          include: {
            mentionedUser: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "CompanyNotFound") {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }
    console.error("Erro ao buscar comentários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar comentários" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireCompanyAccess((await params).id);
    const session = await getSession();
    const { id: companyId } = await params;
    const body = await request.json();

    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json(
        { error: "Conteúdo é obrigatório" },
        { status: 400 }
      );
    }

    const mentionIds: string[] = Array.isArray(body.mentions) ? body.mentions : [];
    const authorId = (session?.user as { id: string }).id;
    const uniqueMentionIds = [...new Set(mentionIds)];
    const attachments = normalizeAttachments(body.attachments);

    const comment = await prisma.companyComment.create({
      data: {
        content: body.content.trim(),
        companyId,
        authorId,
        attachments,
        mentions: {
          create: uniqueMentionIds.map((mentionedUserId) => ({
            mentionedUserId,
          })),
        },
      },
      include: {
        author: {
          select: { id: true, name: true, image: true, role: true },
        },
        mentions: {
          include: {
            mentionedUser: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    notificationService
      .notifyCompanyCommentMention(comment, companyId)
      .catch(console.error);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "CompanyNotFound") {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }
    console.error("Erro ao criar comentário:", error);
    return NextResponse.json(
      { error: "Erro ao criar comentário" },
      { status: 500 }
    );
  }
}
