import { NextResponse } from "next/server";
import { requireCompanyAccess } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; hotseatId: string }> }
) {
  try {
    const { id: companyId, hotseatId } = await params;
    await requireCompanyAccess(companyId);
    const body = await request.json();

    const existing = await prisma.hotseat.findFirst({
      where: { id: hotseatId, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Hotseat não encontrado" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.duration !== undefined) data.duration = body.duration ? parseInt(body.duration) : null;
    if (body.participants !== undefined) data.participants = parseInt(String(body.participants), 10) || 0;
    if (body.cadence !== undefined) data.cadence = body.cadence || null;

    const hotseat = await prisma.hotseat.update({
      where: { id: hotseatId },
      data,
    });
    return NextResponse.json(hotseat);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      if (error.message === "CompanyNotFound") {
        return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
      }
    }
    console.error("Erro ao atualizar hotseat:", error);
    return NextResponse.json({ error: "Erro ao atualizar hotseat" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; hotseatId: string }> }
) {
  try {
    const { id: companyId, hotseatId } = await params;
    await requireCompanyAccess(companyId);

    const existing = await prisma.hotseat.findFirst({
      where: { id: hotseatId, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Hotseat não encontrado" }, { status: 404 });
    }

    await prisma.hotseat.delete({ where: { id: hotseatId } });
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
    console.error("Erro ao remover hotseat:", error);
    return NextResponse.json({ error: "Erro ao remover hotseat" }, { status: 500 });
  }
}
