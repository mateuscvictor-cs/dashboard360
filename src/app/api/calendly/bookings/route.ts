import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { calendlyService } from "@/services/calendly.service";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW" | null;
    const companyId = searchParams.get("companyId");
    const limit = searchParams.get("limit");

    if (session.user.role === "CS_OWNER") {
      const csOwner = await prisma.cSOwner.findUnique({
        where: { email: session.user.email! },
      });
      if (!csOwner) {
        return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
      }

      const bookings = await calendlyService.getBookings(csOwner.id, {
        status: status || undefined,
        companyId: companyId || undefined,
      });

      return NextResponse.json(limit ? bookings.slice(0, parseInt(limit)) : bookings);
    }

    if (session.user.role === "CLIENT") {
      const client = await prisma.client.findUnique({
        where: { email: session.user.email! },
        include: { company: true },
      });
      if (!client?.companyId) {
        return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
      }

      const bookings = await calendlyService.getBookingsByCompany(client.companyId);
      return NextResponse.json(limit ? bookings.slice(0, parseInt(limit)) : bookings);
    }

    if (session.user.role === "ADMIN") {
      const bookings = await prisma.calendlyBooking.findMany({
        where: {
          ...(status && { status }),
          ...(companyId && { companyId }),
        },
        include: {
          csOwner: { select: { id: true, name: true, avatar: true } },
          company: { select: { id: true, name: true, logo: true } },
          delivery: { select: { id: true, title: true } },
        },
        orderBy: { startTime: "desc" },
        take: limit ? parseInt(limit) : undefined,
      });
      return NextResponse.json(bookings);
    }

    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  } catch (error) {
    console.error("[API Bookings] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar agendamentos" }, { status: 500 });
  }
}
