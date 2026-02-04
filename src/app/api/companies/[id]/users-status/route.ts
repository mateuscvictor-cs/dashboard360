import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"]);
    const { id: companyId } = await params;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;
    if (isActive === undefined) {
      return NextResponse.json(
        { error: "isActive (boolean) é obrigatório" },
        { status: 400 }
      );
    }

    const result = await prisma.user.updateMany({
      where: { companyId },
      data: { isActive },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao atualizar status dos usuários da empresa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar acessos" },
      { status: 500 }
    );
  }
}
