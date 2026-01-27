import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { calComService } from "@/services/calcom.service";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.user.role !== "CS_OWNER") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const csOwner = await prisma.cSOwner.findUnique({
      where: { email: session.user.email! },
    });
    if (!csOwner) {
      return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const {
      eventTypeId,
      eventTypeSlug,
      start,
      attendeeName,
      attendeeEmail,
      companyId,
      deliveryId,
      eventType,
      lengthInMinutes,
    } = body;

    if (!start || !attendeeName || !attendeeEmail) {
      return NextResponse.json(
        { error: "start, attendeeName e attendeeEmail são obrigatórios" },
        { status: 400 }
      );
    }

    if (!eventTypeId && !eventTypeSlug) {
      return NextResponse.json(
        { error: "eventTypeId ou eventTypeSlug é obrigatório" },
        { status: 400 }
      );
    }

    const result = await calComService.createAndSaveBooking({
      csOwnerId: csOwner.id,
      eventTypeId,
      eventTypeSlug,
      start,
      attendeeName,
      attendeeEmail,
      companyId,
      deliveryId,
      eventType,
      lengthInMinutes,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao criar booking:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar agendamento" },
      { status: 500 }
    );
  }
}
