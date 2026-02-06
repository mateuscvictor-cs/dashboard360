import { NextRequest, NextResponse } from "next/server";
import { requireDemandAccess, getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireDemandAccess(id);

    const comments = await prisma.demandComment.findMany({
      where: { demandId: id },
      include: {
        author: {
          select: { id: true, name: true, image: true, role: true },
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
    if (error instanceof Error && error.message === "DemandNotFound") {
      return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });
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
    const { id: demandId } = await params;
    await requireDemandAccess(demandId);
    const session = await getSession();
    const body = await request.json();

    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json(
        { error: "Conteúdo é obrigatório" },
        { status: 400 }
      );
    }

    const authorId = (session?.user as { id: string }).id;

    const comment = await prisma.demandComment.create({
      data: {
        content: body.content.trim(),
        demandId,
        authorId,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "DemandNotFound") {
      return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });
    }
    console.error("Erro ao criar comentário:", error);
    return NextResponse.json(
      { error: "Erro ao criar comentário" },
      { status: 500 }
    );
  }
}
