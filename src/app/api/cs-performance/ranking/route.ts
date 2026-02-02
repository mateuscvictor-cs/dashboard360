import { NextRequest, NextResponse } from "next/server";
import { csPerformanceService } from "@/services";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const limit = searchParams.get("limit");

    const date = dateParam ? new Date(dateParam) : undefined;
    const ranking = await csPerformanceService.getRanking(
      date,
      limit ? parseInt(limit) : undefined
    );

    return NextResponse.json(ranking);
  } catch (error) {
    console.error("Error fetching ranking:", error);
    return NextResponse.json(
      { error: "Erro ao buscar ranking" },
      { status: 500 }
    );
  }
}
