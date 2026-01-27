import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { calComService } from "@/services/calcom.service";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
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

    let csOwnerId: string | undefined;
    
    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { csOwnerId: true },
      });
      csOwnerId = company?.csOwnerId || undefined;
    }

    if (!csOwnerId) {
      const firstCsOwner = await prisma.cSOwner.findFirst({
        select: { id: true },
      });
      csOwnerId = firstCsOwner?.id;
    }

    if (!csOwnerId) {
      return NextResponse.json(
        { error: "Nenhum CS Owner encontrado" },
        { status: 400 }
      );
    }

    const metadata: Record<string, string> = {
      csOwnerId,
      eventType: "GENERAL",
      createdByAdmin: "true",
    };
    if (companyId) metadata.companyId = companyId;
    if (deliveryId) metadata.deliveryId = deliveryId;

    const calBooking = await calComService.createBooking({
      eventTypeId,
      eventTypeSlug,
      start,
      attendee: {
        name: attendeeName,
        email: attendeeEmail,
        timeZone: "America/Sao_Paulo",
      },
      metadata,
      lengthInMinutes,
    });

    const booking = await prisma.calComBooking.create({
      data: {
        calComBookingId: calBooking.id,
        calComUid: calBooking.uid,
        eventType: "GENERAL",
        eventTypeSlug: eventTypeSlug || "meeting",
        title: calBooking.title,
        startTime: new Date(calBooking.start),
        endTime: new Date(calBooking.end),
        meetingUrl: calBooking.meetingUrl,
        csOwnerId,
        companyId,
        deliveryId,
        attendeeEmail,
        attendeeName,
        metadata,
      },
    });

    if (companyId) {
      await prisma.timelineEvent.create({
        data: {
          companyId,
          type: "MEETING",
          title: `Reunião agendada: ${calBooking.title}`,
          description: `Reunião com ${attendeeName} em ${new Date(calBooking.start).toLocaleDateString("pt-BR")} (criada pelo Admin)`,
          date: new Date(),
        },
      });
    }

    return NextResponse.json({ calBooking, booking });
  } catch (error) {
    console.error("Erro ao criar booking:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar agendamento" },
      { status: 500 }
    );
  }
}
