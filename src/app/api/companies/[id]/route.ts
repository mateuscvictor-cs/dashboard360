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

    const parseNum = (v: unknown): number | undefined => {
      if (v === undefined || v === null || v === "") return undefined;
      const n = typeof v === "number" ? v : parseFloat(String(v));
      return Number.isNaN(n) ? undefined : n;
    };

    const csOwnerId = body.csOwnerId === "" || body.csOwnerId === undefined ? null : body.csOwnerId;
    const squadId = body.squadId === "" || body.squadId === undefined ? null : body.squadId;

    const data: Parameters<typeof prisma.company.update>[0]["data"] = {
      name: body.name,
      segment: body.segment ?? undefined,
      plan: body.plan ?? undefined,
      framework: body.framework ?? undefined,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      docsLink: body.docsLink ?? undefined,
      fathomLink: body.fathomLink ?? undefined,
      csOwner: csOwnerId ? { connect: { id: csOwnerId } } : { disconnect: true },
      squad: squadId ? { connect: { id: squadId } } : { disconnect: true },
    };
    const billedAmount = parseNum(body.billedAmount);
    if (billedAmount !== undefined) data.billedAmount = billedAmount;
    const cashIn = parseNum(body.cashIn);
    if (cashIn !== undefined) data.cashIn = cashIn;
    const mrr = parseNum(body.mrr);
    if (mrr !== undefined) data.mrr = mrr;
    if (body.contractStart) data.contractStart = new Date(body.contractStart);
    if (body.contractEnd) data.contractEnd = new Date(body.contractEnd);
    if (body.projectStatus === null || body.projectStatus === "") {
      data.projectStatus = null;
    } else if (body.projectStatus !== undefined && ["IN_PROGRESS", "PAUSED", "CONCLUDED"].includes(body.projectStatus)) {
      data.projectStatus = body.projectStatus;
    }

    const company = await prisma.company.update({
      where: { id },
      data,
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    await prisma.company.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao excluir empresa:", error);
    return NextResponse.json(
      { error: "Erro ao excluir empresa" },
      { status: 500 }
    );
  }
}
