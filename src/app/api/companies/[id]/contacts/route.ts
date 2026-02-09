import { NextResponse } from "next/server";
import { requireCompanyAccess } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireCompanyAccess(id);
    const body = await request.json();
    const list = Array.isArray(body.contacts) ? body.contacts : [];

    const existing = await prisma.contact.findMany({
      where: { companyId: id },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((c) => c.id));
    const incomingIds = new Set(list.filter((c: { id?: string }) => c.id).map((c: { id?: string }) => c.id));

    const toDelete = existing.filter((c) => !incomingIds.has(c.id));
    await prisma.contact.deleteMany({
      where: { id: { in: toDelete.map((c) => c.id) } },
    });

    for (const c of list) {
      const data = {
        name: String(c.name ?? "").trim(),
        role: c.role ? String(c.role).trim() : null,
        email: String(c.email ?? "").trim(),
        phone: c.phone ? String(c.phone).trim() : null,
        isDecisionMaker: Boolean(c.isDecisionMaker),
      };
      if (!data.name || !data.email) continue;
      if (c.id && existingIds.has(c.id)) {
        await prisma.contact.update({
          where: { id: c.id },
          data,
        });
      } else if (!c.id) {
        await prisma.contact.create({
          data: { ...data, companyId: id },
        });
      }
    }

    const contacts = await prisma.contact.findMany({
      where: { companyId: id },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(contacts);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      if (error.message === "CompanyNotFound") {
        return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
      }
    }
    console.error("Erro ao sincronizar contatos:", error);
    return NextResponse.json(
      { error: "Erro ao sincronizar contatos" },
      { status: 500 }
    );
  }
}
