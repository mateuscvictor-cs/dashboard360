import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

export async function GET() {
  const session = await requireRole(["ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { type: "asc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Erro ao buscar templates:", error);
    return NextResponse.json({ error: "Erro ao buscar templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireRole(["ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, name, subject, htmlContent, variables } = body;

    if (!type || !name || !subject || !htmlContent) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        type,
        name,
        subject,
        htmlContent,
        variables: variables || [],
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar template:", error);
    return NextResponse.json({ error: "Erro ao criar template" }, { status: 500 });
  }
}
