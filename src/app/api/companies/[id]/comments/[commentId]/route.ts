import { NextResponse } from "next/server";
import { requireCompanyAccess, getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    await requireCompanyAccess((await params).id);
    const session = await getSession();
    const { id: companyId, commentId } = await params;

    const comment = await prisma.companyComment.findFirst({
      where: { id: commentId, companyId },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 });
    }

    const user = session?.user as { id: string; role: string };
    const isAdmin = user.role === "ADMIN";
    const isOwnComment = comment.authorId === user.id;

    if (!isAdmin && !isOwnComment) {
      return NextResponse.json(
        { error: "Você só pode excluir seus próprios comentários" },
        { status: 403 }
      );
    }

    await prisma.companyComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
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
    console.error("Erro ao excluir comentário:", error);
    return NextResponse.json(
      { error: "Erro ao excluir comentário" },
      { status: 500 }
    );
  }
}
