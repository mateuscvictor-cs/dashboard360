import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { calendlyService } from "@/services/calendly.service";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const maxBookings = limit ? parseInt(limit) : 10;

    if (session.user.role === "CS_OWNER") {
      const csOwner = await prisma.cSOwner.findUnique({
        where: { email: session.user.email! },
      });
      if (!csOwner) {
        return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
      }

      const bookings = await calendlyService.getUpcomingBookings(csOwner.id, maxBookings);
      return NextResponse.json(bookings);
    }

    if (session.user.role === "CLIENT") {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { company: true },
      });
      if (!user?.companyId) {
        return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
      }

      const bookings = await prisma.calendlyBooking.findMany({
        where: {
          companyId: user.companyId,
          status: "SCHEDULED",
          startTime: { gte: new Date() },
        },
        include: {
          csOwner: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { startTime: "asc" },
        take: maxBookings,
      });
      return NextResponse.json(bookings);
    }

    if (session.user.role === "ADMIN") {
      const bookings = await prisma.calendlyBooking.findMany({
        where: {
          status: "SCHEDULED",
          startTime: { gte: new Date() },
        },
        include: {
          csOwner: { select: { id: true, name: true, avatar: true } },
          company: { select: { id: true, name: true, logo: true } },
        },
        orderBy: { startTime: "asc" },
        take: maxBookings,
      });
      return NextResponse.json(bookings);
    }

    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  } catch (error) {
    console.error("[API Upcoming] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar agendamentos" }, { status: 500 });
  }
}
