import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { calendlyService } from "@/services/calendly.service";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    let csOwnerId: string;

    if (session.user.role === "CS_OWNER") {
      const csOwner = await prisma.cSOwner.findUnique({
        where: { email: session.user.email! },
      });
      if (!csOwner) {
        return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
      }
      csOwnerId = csOwner.id;
    } else if (session.user.role === "CLIENT") {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { company: { include: { csOwner: true } } },
      });
      if (!user?.company?.csOwner) {
        return NextResponse.json({ error: "CS Owner não encontrado para este cliente" }, { status: 404 });
      }
      csOwnerId = user.company.csOwner.id;
    } else {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { eventType, companyId, deliveryId, prefillName, prefillEmail } = body;

    const link = await calendlyService.createBookingLink({
      csOwnerId,
      eventType: eventType || "GENERAL",
      companyId,
      deliveryId,
      prefillName,
      prefillEmail,
    });

    return NextResponse.json({ link });
  } catch (error) {
    console.error("[API Booking Link] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar link" },
      { status: 500 }
    );
  }
}
