import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { calComService } from "@/services/calcom.service";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10");

    if (session.user.role === "CS_OWNER") {
      const csOwner = await prisma.cSOwner.findUnique({ where: { email: session.user.email! } });
      if (!csOwner) {
        return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
      }

      const bookings = await calComService.getUpcomingBookings(csOwner.id, limit);
      return NextResponse.json(bookings);
    }

    if (session.user.role === "CLIENT") {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { companyId: true },
      });

      if (!user?.companyId) {
        return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
      }

      const bookings = await prisma.calComBooking.findMany({
        where: {
          companyId: user.companyId,
          status: "SCHEDULED",
          startTime: { gte: new Date() },
        },
        include: {
          csOwner: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { startTime: "asc" },
        take: limit,
      });

      return NextResponse.json(bookings);
    }

    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  } catch (error) {
    console.error("Erro ao buscar próximas reuniões:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
