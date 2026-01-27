import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { calComService } from "@/services/calcom.service";

type CalComEventType = "ONBOARDING" | "DELIVERY" | "CHECKIN" | "GENERAL";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.user.role !== "CS_OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Apenas CS Owners podem gerar links" }, { status: 403 });
    }

    const body = await request.json();
    const { eventType, companyId, deliveryId, prefillName, prefillEmail, csOwnerId } = body;

    let targetCsOwnerId = csOwnerId;

    if (!targetCsOwnerId && session.user.role === "CS_OWNER") {
      const csOwner = await prisma.cSOwner.findUnique({ where: { email: session.user.email! } });
      if (!csOwner) {
        return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
      }
      targetCsOwnerId = csOwner.id;
    }

    if (!targetCsOwnerId) {
      return NextResponse.json({ error: "csOwnerId é obrigatório" }, { status: 400 });
    }

    const link = await calComService.createBookingLink({
      csOwnerId: targetCsOwnerId,
      eventType: (eventType as CalComEventType) || "GENERAL",
      companyId,
      deliveryId,
      prefillName,
      prefillEmail,
    });

    return NextResponse.json({ link });
  } catch (error) {
    console.error("Erro ao gerar link:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 });
  }
}
