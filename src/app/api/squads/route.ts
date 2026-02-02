import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { squadService } from "@/services";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const squads = await squadService.findAllWithMetrics();
    return NextResponse.json(squads);
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const body = await request.json();
    const squad = await squadService.create(body);
    return NextResponse.json(squad, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    throw error;
  }
}
