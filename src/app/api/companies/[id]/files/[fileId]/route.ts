import { NextResponse } from "next/server";
import { requireCompanyAccess } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id, fileId } = await params;
    await requireCompanyAccess(id);

    const file = await prisma.companyFile.findFirst({
      where: { id: fileId, companyId: id },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    await prisma.companyFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "CompanyNotFound") {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    console.error("Erro ao remover arquivo:", error);
    return NextResponse.json(
      { error: "Erro ao remover arquivo" },
      { status: 500 }
    );
  }
}
