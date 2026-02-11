import { NextResponse } from "next/server";
import { requireCompanyAccess, getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireCompanyAccess((await params).id);
    const { id } = await params;

    const files = await prisma.companyFile.findMany({
      where: { companyId: id },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(files);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "CompanyNotFound") {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    console.error("Erro ao listar arquivos:", error);
    return NextResponse.json(
      { error: "Erro ao listar arquivos" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireCompanyAccess((await params).id);
    const session = await getSession();
    const { id: companyId } = await params;
    const body = await request.json();

    const { key, name, url, size, mimeType } = body as {
      key?: string;
      name?: string;
      url?: string;
      size?: number;
      mimeType?: string;
    };

    if (!key || !name || !url) {
      return NextResponse.json(
        { error: "key, name e url são obrigatórios" },
        { status: 400 }
      );
    }

    const authorId = (session?.user as { id: string } | undefined)?.id;

    const file = await prisma.companyFile.create({
      data: {
        companyId,
        key,
        name,
        url,
        size: size ?? undefined,
        mimeType: mimeType ?? undefined,
        uploadedById: authorId,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "CompanyNotFound") {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    console.error("Erro ao registrar arquivo:", error);
    return NextResponse.json(
      { error: "Erro ao registrar arquivo" },
      { status: 500 }
    );
  }
}
