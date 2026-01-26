import { NextRequest, NextResponse } from "next/server";
import { squadService } from "@/services";

export async function GET() {
  const squads = await squadService.findAllWithMetrics();
  return NextResponse.json(squads);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const squad = await squadService.create(body);
  return NextResponse.json(squad, { status: 201 });
}
