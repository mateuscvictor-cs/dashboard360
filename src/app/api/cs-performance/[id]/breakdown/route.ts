import { NextRequest, NextResponse } from "next/server";
import { csPerformanceService } from "@/services";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await csPerformanceService.calculateMetricsForCS(id, startDate, endDate);
    const breakdown = csPerformanceService.calculateScore(metrics);

    return NextResponse.json({
      metrics,
      breakdown,
    });
  } catch (error) {
    console.error("Error fetching performance breakdown:", error);
    return NextResponse.json(
      { error: "Erro ao buscar breakdown de performance" },
      { status: 500 }
    );
  }
}
