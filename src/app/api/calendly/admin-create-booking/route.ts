import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { calendlyService } from "@/services/calendly.service";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      csOwnerId,
      eventTypeUri,
      eventTypeId,
      start,
      attendeeName,
      attendeeEmail,
      companyId,
      deliveryId,
      eventType,
      lengthInMinutes,
      additionalInvitees,
      schedulingUrl,
    } = body;

    const hostId = csOwnerId;
    if (!hostId) {
      return NextResponse.json({ error: "Responsável é obrigatório" }, { status: 400 });
    }

    if (!start || !attendeeName || !attendeeEmail) {
      return NextResponse.json(
        { error: "start, attendeeName e attendeeEmail são obrigatórios" },
        { status: 400 }
      );
    }

    const finalEventTypeUri = eventTypeUri || eventTypeId;
    if (!finalEventTypeUri) {
      return NextResponse.json(
        { error: "eventTypeUri é obrigatório" },
        { status: 400 }
      );
    }

    const host = await prisma.user.findUnique({
      where: { id: hostId },
      select: { id: true, role: true },
    });

    if (!host) {
      return NextResponse.json({ error: "Responsável não encontrado" }, { status: 404 });
    }

    if (host.role !== "ADMIN" && host.role !== "CS_OWNER") {
      return NextResponse.json({ error: "Responsável deve ser Admin ou CS Owner" }, { status: 400 });
    }

    let csOwnerIdToUse = hostId;

    if (host.role === "CS_OWNER") {
      const csOwner = await prisma.cSOwner.findFirst({
        where: { email: { equals: (await prisma.user.findUnique({ where: { id: hostId } }))?.email || "" } },
      });
      if (csOwner) {
        csOwnerIdToUse = csOwner.id;
      }
    } else {
      const firstCsOwner = await prisma.cSOwner.findFirst();
      if (firstCsOwner) {
        csOwnerIdToUse = firstCsOwner.id;
      }
    }

    const result = await calendlyService.createAndSaveBooking({
      csOwnerId: csOwnerIdToUse,
      eventTypeUri: finalEventTypeUri,
      start,
      attendeeName,
      attendeeEmail,
      companyId,
      deliveryId,
      eventType,
      lengthInMinutes,
      additionalInvitees,
      schedulingUrl,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao criar booking (admin):", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar agendamento" },
      { status: 500 }
    );
  }
}
