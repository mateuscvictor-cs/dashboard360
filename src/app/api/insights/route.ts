import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInsights, getInsightStats } from "@/services/insight.service";
import { prisma } from "@/lib/db";
import type { InsightScope, InsightStatus, InsightType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const scope = searchParams.get("scope") as InsightScope | null;
    const status = searchParams.get("status") as InsightStatus | null;
    const type = searchParams.get("type") as InsightType | null;
    const companyId = searchParams.get("companyId");
    const csOwnerId = searchParams.get("csOwnerId");
    const squadId = searchParams.get("squadId");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const includeStats = searchParams.get("includeStats") === "true";

    const filters = {
      scope: scope || undefined,
      status: status || undefined,
      type: type || undefined,
      companyId: companyId || undefined,
      csOwnerId: csOwnerId || undefined,
      squadId: squadId || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    const insights = await getInsights(filters);

    if (includeStats) {
      const stats = await getInsightStats();
      return NextResponse.json({ insights, stats });
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Erro ao buscar insights:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clearOrphans = searchParams.get("clearOrphans") === "true";

    if (clearOrphans) {
      const result = await prisma.aIInsight.deleteMany({
        where: { companyId: null },
      });
      return NextResponse.json({ deleted: result.count });
    }

    return NextResponse.json({ error: "Operação não especificada" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao deletar insights:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
