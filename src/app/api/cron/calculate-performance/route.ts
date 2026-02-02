import { NextResponse } from "next/server";
import { csPerformanceService } from "@/services";

export const runtime = "nodejs";
export const maxDuration = 120;

function validateApiKey(request: Request): boolean {
  const cronApiKey = process.env.CRONAPI;

  if (!cronApiKey) return true;

  const url = new URL(request.url);
  const queryKey = url.searchParams.get("key") || url.searchParams.get("api_key");

  const authHeader = request.headers.get("authorization");
  const headerKey = authHeader?.replace("Bearer ", "");

  const xApiKey = request.headers.get("x-api-key");

  return queryKey === cronApiKey || headerKey === cronApiKey || xApiKey === cronApiKey;
}

export async function GET(request: Request) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const snapshots = await csPerformanceService.calculateAllSnapshots();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      snapshotsCreated: snapshots.length,
      topPerformers: snapshots.slice(0, 3).map(s => ({
        csOwnerId: s.csOwnerId,
        score: s.performanceScore,
        ranking: s.ranking,
      })),
    });
  } catch (error) {
    console.error("Erro no cron calculate-performance:", error);
    return NextResponse.json(
      { error: "Erro interno no cron job" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
