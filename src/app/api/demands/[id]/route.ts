import { NextRequest, NextResponse } from "next/server";
import { demandService } from "@/services";
import { requireDemandAccess } from "@/lib/auth-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireDemandAccess(id);
    const demand = await demandService.getById(id);
    if (!demand) {
      return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });
    }
    return NextResponse.json(demand);
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
    throw error;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireDemandAccess(id);
    const body = await request.json();
    const demand = await demandService.update(id, {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    });
    return NextResponse.json(demand);
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden" || error.message === "DemandNotFound")) {
      const status = error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 404;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireDemandAccess(id);
    await demandService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden" || error.message === "DemandNotFound")) {
      const status = error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 404;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
