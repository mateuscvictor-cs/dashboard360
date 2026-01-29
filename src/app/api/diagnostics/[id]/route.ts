import { NextRequest, NextResponse } from "next/server";
import { diagnosticService } from "@/services/diagnostic.service";
import { requireRole } from "@/lib/auth-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const { id } = await params;

    const diagnostic = await diagnosticService.findById(id);

    if (!diagnostic) {
      return NextResponse.json(
        { error: "Diagnóstico não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(diagnostic);
  } catch (error) {
    console.error("Error fetching diagnostic:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar diagnóstico" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const { id } = await params;

    const diagnostic = await diagnosticService.findById(id);

    if (!diagnostic) {
      return NextResponse.json(
        { error: "Diagnóstico não encontrado" },
        { status: 404 }
      );
    }

    await diagnosticService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting diagnostic:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir diagnóstico" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const { id } = await params;
    const body = await request.json();

    const diagnostic = await diagnosticService.findById(id);

    if (!diagnostic) {
      return NextResponse.json(
        { error: "Diagnóstico não encontrado" },
        { status: 404 }
      );
    }

    if (body.status) {
      const updated = await diagnosticService.updateStatus(id, body.status);
      return NextResponse.json(updated);
    }

    return NextResponse.json(diagnostic);
  } catch (error) {
    console.error("Error updating diagnostic:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar diagnóstico" },
      { status: 500 }
    );
  }
}
