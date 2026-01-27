import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { csOwnerId?: string };
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      select: { csOwnerId: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    if (company.csOwnerId !== user.csOwnerId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { name, role, email, phone, isDecisionMaker } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        role,
        email,
        phone,
        isDecisionMaker: isDecisionMaker || false,
        companyId: id,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar contato:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
