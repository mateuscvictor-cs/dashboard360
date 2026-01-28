import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole(["ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const variables = body.variables || {};

    let preview = template.htmlContent;
    let subjectPreview = template.subject;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      preview = preview.replace(regex, String(value));
      subjectPreview = subjectPreview.replace(regex, String(value));
    });

    template.variables.forEach((varName) => {
      if (!variables[varName]) {
        const regex = new RegExp(`{{${varName}}}`, "g");
        preview = preview.replace(regex, `[${varName}]`);
        subjectPreview = subjectPreview.replace(regex, `[${varName}]`);
      }
    });

    return NextResponse.json({
      subject: subjectPreview,
      html: preview,
    });
  } catch (error) {
    console.error("Erro ao gerar preview:", error);
    return NextResponse.json({ error: "Erro ao gerar preview" }, { status: 500 });
  }
}
