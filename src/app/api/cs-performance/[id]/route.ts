import { NextRequest, NextResponse } from "next/server";
import { csPerformanceService } from "@/services";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const [latestSnapshot, history, teamAverages] = await Promise.all([
      csPerformanceService.getLatestSnapshot(id),
      csPerformanceService.getSnapshotHistory(id, days),
      csPerformanceService.getTeamAverages(),
    ]);

    const trend = csPerformanceService.getTrend(history);

    return NextResponse.json({
      latestSnapshot,
      history,
      trend,
      teamAverages,
    });
  } catch (error) {
    console.error("Error fetching CS performance:", error);
    return NextResponse.json(
      { error: "Erro ao buscar performance" },
      { status: 500 }
    );
  }
}
