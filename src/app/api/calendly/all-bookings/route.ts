import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const csOwnerId = searchParams.get("csOwnerId");
    const status = searchParams.get("status") as "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW" | null;
    const limit = searchParams.get("limit");

    const bookings = await prisma.calendlyBooking.findMany({
      where: {
        ...(csOwnerId && { csOwnerId }),
        ...(status && { status }),
      },
      include: {
        csOwner: { select: { id: true, name: true, avatar: true, email: true } },
        company: { select: { id: true, name: true, logo: true } },
        delivery: { select: { id: true, title: true } },
      },
      orderBy: { startTime: "desc" },
      take: limit ? parseInt(limit) : 100,
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("[API All Bookings] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar agendamentos" }, { status: 500 });
  }
}
