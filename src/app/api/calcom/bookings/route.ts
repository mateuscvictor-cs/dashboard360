import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { calComService } from "@/services/calcom.service";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as "SCHEDULED" | "COMPLETED" | "CANCELLED" | null;
    const companyId = searchParams.get("companyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (session.user.role === "CS_OWNER") {
      const csOwner = await prisma.cSOwner.findUnique({ where: { email: session.user.email! } });
      if (!csOwner) {
        return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
      }

      const bookings = await calComService.getBookings(csOwner.id, {
        status: status || undefined,
        companyId: companyId || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

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

      const bookings = await calComService.getBookingsByCompany(user.companyId);
      return NextResponse.json(bookings);
    }

    if (session.user.role === "ADMIN") {
      const bookings = await prisma.calComBooking.findMany({
        where: {
          ...(status && { status }),
          ...(companyId && { companyId }),
          ...(startDate && { startTime: { gte: new Date(startDate) } }),
          ...(endDate && { startTime: { lte: new Date(endDate) } }),
        },
        include: {
          csOwner: { select: { id: true, name: true, avatar: true } },
          company: { select: { id: true, name: true, logo: true } },
          delivery: { select: { id: true, title: true } },
        },
        orderBy: { startTime: "desc" },
      });

      return NextResponse.json(bookings);
    }

    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
