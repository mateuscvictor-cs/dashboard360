import { NextResponse } from "next/server";
import { csPerformanceService } from "@/services";

export async function GET() {
  try {
    const csWithSnapshots = await csPerformanceService.getAllWithLatestSnapshot();
    const teamAverages = await csPerformanceService.getTeamAverages();

    return NextResponse.json({
      csOwners: csWithSnapshots,
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

export async function POST() {
  try {
    const snapshots = await csPerformanceService.calculateAllSnapshots();
    return NextResponse.json({
      message: "Snapshots calculados com sucesso",
      count: snapshots.length,
    });
  } catch (error) {
    console.error("Error calculating snapshots:", error);
    return NextResponse.json(
      { error: "Erro ao calcular snapshots" },
      { status: 500 }
    );
  }
}
