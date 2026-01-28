import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { calendlyService } from "@/services/calendly.service";

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

function hasSlots(slots: Record<string, Slot[]>): boolean {
  return Object.values(slots).some(daySlots => daySlots.length > 0);
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const eventTypeUri = searchParams.get("eventTypeUri") || searchParams.get("eventTypeId");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const limit = searchParams.get("limit");
    const findNext = searchParams.get("findNext") === "true";

    if (!eventTypeUri) {
      return NextResponse.json(
        { error: "eventTypeUri é obrigatório" },
        { status: 400 }
      );
    }

    if (findNext) {
      const maxDaysToSearch = 60;
      let currentDate = new Date();
      
      for (let i = 0; i < maxDaysToSearch; i += 7) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setDate(dayEnd.getDate() + 7);
        dayEnd.setHours(23, 59, 59, 999);

        try {
          const slots = await calendlyService.getAvailableSlots({
            eventTypeUri,
            startTime: dayStart.toISOString(),
            endTime: dayEnd.toISOString(),
          });

          if (hasSlots(slots || {})) {
            const maxSlots = limit ? parseInt(limit) : 6;
            const limitedSlots = limitSlots(slots || {}, maxSlots);
            return NextResponse.json({
              slots: limitedSlots,
              nextAvailableDate: currentDate.toISOString().split("T")[0],
            });
          }
        } catch {
          // Continue to next week on error
        }

        currentDate.setDate(currentDate.getDate() + 7);
      }

      return NextResponse.json({
        slots: {},
        nextAvailableDate: null,
        message: "Nenhuma disponibilidade encontrada nos próximos 60 dias",
      });
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "startTime e endTime são obrigatórios" },
        { status: 400 }
      );
    }

    const slots = await calendlyService.getAvailableSlots({
      eventTypeUri,
      startTime,
      endTime,
    });

    const maxSlots = limit ? parseInt(limit) : 6;
    const limitedSlots = limitSlots(slots || {}, maxSlots);

    return NextResponse.json(limitedSlots);
  } catch (error) {
    console.error("[API Slots] Error:", error);
    const message = error instanceof Error ? error.message : "Erro ao buscar horários";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
