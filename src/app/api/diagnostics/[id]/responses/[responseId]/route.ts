import { NextResponse } from "next/server";
import { diagnosticService } from "@/services/diagnostic.service";
import { requireRole } from "@/lib/auth-server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    await requireRole(["ADMIN"]);

    const { id: diagnosticId, responseId } = await params;

    const response = await diagnosticService.findResponseById(responseId);

    if (!response) {
      return NextResponse.json(
        { error: "Resposta não encontrada" },
        { status: 404 }
      );
    }

    if (response.diagnosticId !== diagnosticId) {
      return NextResponse.json(
        { error: "Resposta não pertence a este diagnóstico" },
        { status: 400 }
      );
    }

    await diagnosticService.deleteResponse(responseId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("Error deleting diagnostic response:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir resposta" },
      { status: 500 }
    );
  }
}
