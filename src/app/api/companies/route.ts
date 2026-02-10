import { NextResponse } from "next/server";
import { requireRole, getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const session = await getSession();
    const user = session?.user as { role?: string; csOwnerId?: string } | undefined;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const projectStatus = searchParams.get("projectStatus");
    const limit = searchParams.get("limit");

    const where: Record<string, unknown> = {};
    if (user?.role === "CS_OWNER" && user.csOwnerId) {
      where.csOwnerId = user.csOwnerId;
    }
    if (status) {
      const statuses = status.split(",").map((s) => s.trim().toUpperCase());
      where.healthStatus = { in: statuses };
    }
    if (projectStatus) {
      const valid = ["IN_PROGRESS", "PAUSED", "CONCLUDED"];
      const values = projectStatus.split(",").map((s) => s.trim().toUpperCase()).filter((s) => valid.includes(s));
      if (values.length > 0) {
        where.projectStatus = values.length === 1 ? values[0] : { in: values };
      }
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        csOwner: {
          select: {
            id: true,
            name: true,
          },
        },
        squad: {
          select: {
            id: true,
            name: true,
          },
        },
        users: { select: { id: true } },
      },
      orderBy: [
        { healthScore: "asc" },
        { name: "asc" },
      ],
      take: limit ? parseInt(limit) : undefined,
    });
    
    return NextResponse.json(companies);
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao buscar empresas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar empresas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const body = await request.json();

    const company = await prisma.company.create({
      data: {
        name: body.name,
        cnpj: body.cnpj,
        segment: body.segment,
        plan: body.plan,
        framework: body.framework,
        billedAmount: body.billedAmount ? parseFloat(body.billedAmount) : 0,
        cashIn: body.cashIn ? parseFloat(body.cashIn) : 0,
        mrr: body.mrr ? parseFloat(body.mrr) : 0,
        tags: body.tags || [],
        csOwnerId: body.csOwnerId,
        squadId: body.squadId,
        contractStart: body.contractStart ? new Date(body.contractStart) : null,
        contractEnd: body.contractEnd ? new Date(body.contractEnd) : null,
        docsLink: body.docsLink,
        fathomLink: body.fathomLink,
        onboardingStatus: "NOVO",
      },
      include: {
        csOwner: true,
        squad: true,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao criar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao criar empresa" },
      { status: 500 }
    );
  }
}
