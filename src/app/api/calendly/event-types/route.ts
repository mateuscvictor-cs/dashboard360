import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { calendlyService } from "@/services/calendly.service";

export async function GET() {
  try {
    await requireAuth();
    const eventTypes = await calendlyService.getEventTypes();
    return NextResponse.json(eventTypes);
  } catch (error) {
    console.error("[API Event Types] Error:", error);
    const message = error instanceof Error ? error.message : "Erro ao buscar tipos de evento";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
