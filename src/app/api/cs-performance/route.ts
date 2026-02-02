import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { csPerformanceService } from "@/services";

export async function GET() {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const csWithSnapshots = await csPerformanceService.getAllWithLatestSnapshot();
    const teamAverages = await csPerformanceService.getTeamAverages();

    return NextResponse.json({
      csOwners: csWithSnapshots,
      teamAverages,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("Error fetching CS performance:", error);
    return NextResponse.json(
      { error: "Erro ao buscar performance" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const snapshots = await csPerformanceService.calculateAllSnapshots();
    return NextResponse.json({
      message: "Snapshots calculados com sucesso",
      count: snapshots.length,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("Error calculating snapshots:", error);
    return NextResponse.json(
      { error: "Erro ao calcular snapshots" },
      { status: 500 }
    );
  }
}
