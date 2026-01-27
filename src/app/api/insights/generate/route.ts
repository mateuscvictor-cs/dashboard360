import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateInsights } from "@/services/ai.service";
import { formatInsight } from "@/services/insight.service";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { scope, targetId } = body as {
      scope: "company" | "cs_owner" | "portfolio";
      targetId?: string;
    };

    if (!scope) {
      return NextResponse.json(
        { error: "Parâmetro 'scope' é obrigatório" },
        { status: 400 }
      );
    }

    if ((scope === "company" || scope === "cs_owner") && !targetId) {
      return NextResponse.json(
        { error: `Parâmetro 'targetId' é obrigatório para escopo '${scope}'` },
        { status: 400 }
      );
    }

    const rawInsights = await generateInsights(scope, targetId);

    const insightIds = rawInsights.map((i) => i.id);
    const insightsWithRelations = await prisma.aIInsight.findMany({
      where: { id: { in: insightIds } },
      include: {
        company: { select: { name: true } },
        csOwner: { select: { name: true } },
        squad: { select: { name: true } },
      },
    });

    const formattedInsights = insightsWithRelations.map(formatInsight);

    return NextResponse.json({
      success: true,
      count: formattedInsights.length,
      insights: formattedInsights,
    });
  } catch (error) {
    console.error("Erro ao gerar insights:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
