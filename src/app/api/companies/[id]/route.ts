import { NextResponse } from "next/server";
import { requireRole, getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const session = await getSession();
    const user = session?.user as { role?: string; csOwnerId?: string } | undefined;
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contacts: true,
        deliveries: {
          orderBy: { dueDate: "asc" },
        },
        workshops: {
          orderBy: { date: "asc" },
        },
        hotseats: {
          orderBy: { date: "asc" },
        },
        meetings: {
          orderBy: { date: "asc" },
        },
        ipcs: true,
        timelineEvents: {
          orderBy: { date: "desc" },
          take: 50,
        },
        csOwner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        squad: {
          select: {
            id: true,
            name: true,
          },
        },
        aiInsights: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    if (user?.role === "CS_OWNER" && company.csOwnerId !== user.csOwnerId) {
      return NextResponse.json({ error: "Sem permissão para acessar esta empresa" }, { status: 403 });
    }

    return NextResponse.json(company);
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao buscar empresa:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro ao buscar empresa", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const session = await getSession();
    const user = session?.user as { role?: string; csOwnerId?: string } | undefined;
    const { id } = await params;

    const existing = await prisma.company.findUnique({
      where: { id },
      select: { csOwnerId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }
    if (user?.role === "CS_OWNER" && existing.csOwnerId !== user.csOwnerId) {
      return NextResponse.json({ error: "Sem permissão para editar esta empresa" }, { status: 403 });
    }

    const body = await request.json();

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: body.name,
        cnpj: body.cnpj,
        segment: body.segment,
        plan: body.plan,
        framework: body.framework,
        billedAmount: body.billedAmount ? parseFloat(body.billedAmount) : undefined,
        cashIn: body.cashIn ? parseFloat(body.cashIn) : undefined,
        mrr: body.mrr ? parseFloat(body.mrr) : undefined,
        tags: body.tags,
        csOwnerId: body.csOwnerId,
        squadId: body.squadId,
        contractStart: body.contractStart ? new Date(body.contractStart) : undefined,
        contractEnd: body.contractEnd ? new Date(body.contractEnd) : undefined,
        docsLink: body.docsLink,
        fathomLink: body.fathomLink,
      },
      include: {
        contacts: true,
        deliveries: true,
        workshops: true,
        hotseats: true,
        csOwner: true,
        squad: true,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar empresa" },
      { status: 500 }
    );
  }
}
