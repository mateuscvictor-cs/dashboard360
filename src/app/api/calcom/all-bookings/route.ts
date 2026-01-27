import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const csOwnerId = searchParams.get("csOwnerId");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");

    const where: Record<string, unknown> = {};
    
    if (csOwnerId) {
      where.csOwnerId = csOwnerId;
    }
    
    if (status) {
      where.status = status;
    } else {
      where.status = "SCHEDULED";
      where.startTime = { gte: new Date() };
    }

    const bookings = await prisma.calComBooking.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, logo: true } },
        delivery: { select: { id: true, title: true } },
        csOwner: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { startTime: "asc" },
      take: limit ? parseInt(limit) : 50,
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Erro ao buscar bookings:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
