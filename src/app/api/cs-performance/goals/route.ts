import { NextRequest, NextResponse } from "next/server";
import { csPerformanceService } from "@/services";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const csOwnerId = searchParams.get("csOwnerId") || undefined;

    const goals = await csPerformanceService.getGoals(csOwnerId);
    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Erro ao buscar metas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { metric, targetValue, period, startDate, endDate, csOwnerId } = body;

    if (!metric || !targetValue || !period || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Campos obrigatórios: metric, targetValue, period, startDate, endDate" },
        { status: 400 }
      );
    }

    const goal = await csPerformanceService.createGoal({
      csOwnerId: csOwnerId || undefined,
      metric,
      targetValue: parseFloat(targetValue),
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: "Erro ao criar meta" },
      { status: 500 }
    );
  }
}
