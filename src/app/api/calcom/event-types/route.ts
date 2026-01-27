import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { calComService } from "@/services/calcom.service";

export async function GET() {
  try {
    await requireAuth();
    console.log("[API] Fetching Cal.com event types...");
    const eventTypes = await calComService.getEventTypes();
    console.log("[API] Event types found:", eventTypes?.length || 0);
    return NextResponse.json(eventTypes || []);
  } catch (error) {
    console.error("Erro ao buscar event types:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar tipos de evento" },
      { status: 500 }
    );
  }
}
