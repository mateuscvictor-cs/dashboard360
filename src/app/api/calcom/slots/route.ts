import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { calComService } from "@/services/calcom.service";

type Slot = { time: string };

function limitSlots(slots: Record<string, Slot[]>, maxTotal = 6): Record<string, Slot[]> {
  const allSlots: Slot[] = [];
  for (const daySlots of Object.values(slots)) {
    allSlots.push(...daySlots);
  }

  if (allSlots.length <= maxTotal) return slots;

  const morning: Slot[] = [];
  const afternoon: Slot[] = [];
  const evening: Slot[] = [];

  for (const slot of allSlots) {
    const hour = new Date(slot.time).getHours();
    if (hour < 12) morning.push(slot);
    else if (hour < 18) afternoon.push(slot);
    else evening.push(slot);
  }

  const pickDistributed = (arr: Slot[], count: number): Slot[] => {
    if (arr.length <= count) return arr;
    const result: Slot[] = [];
    const step = (arr.length - 1) / (count - 1);
    for (let i = 0; i < count; i++) {
      result.push(arr[Math.round(i * step)]);
    }
    return result;
  };

  const limited = [
    ...pickDistributed(morning, 2),
    ...pickDistributed(afternoon, 2),
    ...pickDistributed(evening, 2),
  ];

  const result: Record<string, Slot[]> = {};
  for (const slot of limited) {
    const date = slot.time.split("T")[0];
    if (!result[date]) result[date] = [];
    result[date].push(slot);
  }

  return result;
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const eventTypeId = searchParams.get("eventTypeId");
    const eventTypeSlug = searchParams.get("eventTypeSlug");
    const username = searchParams.get("username");
    const teamSlug = searchParams.get("teamSlug");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const limit = searchParams.get("limit");

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "startTime e endTime são obrigatórios" },
        { status: 400 }
      );
    }

    if (!eventTypeId && !eventTypeSlug) {
      return NextResponse.json(
        { error: "eventTypeId ou eventTypeSlug é obrigatório" },
        { status: 400 }
      );
    }

    const slots = await calComService.getAvailableSlots({
      eventTypeId: eventTypeId ? parseInt(eventTypeId) : undefined,
      eventTypeSlug: eventTypeSlug || undefined,
      username: username || undefined,
      teamSlug: teamSlug || undefined,
      startTime,
      endTime,
    });

    const maxSlots = limit ? parseInt(limit) : 6;
    const limitedSlots = limitSlots(slots || {}, maxSlots);

    return NextResponse.json(limitedSlots);
  } catch (error) {
    console.error("[API Slots] Error:", error);
    const message = error instanceof Error ? error.message : "Erro ao buscar horários";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
