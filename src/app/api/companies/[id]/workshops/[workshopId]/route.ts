import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireCompanyAccess } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; workshopId: string }> }
) {
  try {
    const { id: companyId, workshopId } = await params;
    const session = await auth();
    await requireCompanyAccess(companyId);
    const body = await request.json();

    const existing = await prisma.workshop.findFirst({
      where: { id: workshopId, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Workshop não encontrado" }, { status: 404 });
    }

    const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.date !== undefined) {
      const dateValue = body.date != null && body.date !== "" ? new Date(body.date) : null;
      if (!dateValue && !isAdmin) {
        return NextResponse.json({ error: "Data é obrigatória" }, { status: 400 });
      }
      data.date = dateValue;
    }
    if (body.duration !== undefined) data.duration = body.duration ? parseInt(body.duration) : null;
    if (body.participants !== undefined) data.participants = parseInt(String(body.participants), 10) || 0;
    if (body.cadence !== undefined) data.cadence = body.cadence || null;

    const workshop = await prisma.workshop.update({
      where: { id: workshopId },
      data,
    });
    return NextResponse.json(workshop);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      if (error.message === "CompanyNotFound") {
        return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
      }
    }
    console.error("Erro ao atualizar workshop:", error);
    return NextResponse.json({ error: "Erro ao atualizar workshop" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; workshopId: string }> }
) {
  try {
    const { id: companyId, workshopId } = await params;
    await requireCompanyAccess(companyId);

    const existing = await prisma.workshop.findFirst({
      where: { id: workshopId, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Workshop não encontrado" }, { status: 404 });
    }

    await prisma.workshop.delete({ where: { id: workshopId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      if (error.message === "CompanyNotFound") {
        return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
      }
    }
    console.error("Erro ao remover workshop:", error);
    return NextResponse.json({ error: "Erro ao remover workshop" }, { status: 500 });
  }
}
