import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { fathomService } from "@/services/fathom.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();

  const { id } = await params;

  const booking = await prisma.calendlyBooking.findUnique({
    where: { id },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Agendamento não encontrado" },
      { status: 404 }
    );
  }

  const role = session.user.role;

  if (role === "CS_OWNER") {
    const csOwner = await prisma.cSOwner.findFirst({
      where: { user: { id: session.user.id } },
    });
    if (!csOwner || booking.csOwnerId !== csOwner.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
  } else if (role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  let fathomUrlOverride: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.fathomUrl === "string" && body.fathomUrl.trim()) {
      fathomUrlOverride = body.fathomUrl.trim();
    }
  } catch {
    fathomUrlOverride = undefined;
  }

  const result = await fathomService.syncMeetingWithBooking(
    session.user.id,
    id,
    fathomUrlOverride
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.message },
      { status: 400 }
    );
  }

  const updatedBooking = await prisma.calendlyBooking.findUnique({
    where: { id },
    include: {
      csOwner: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      company: {
        select: { id: true, name: true, logo: true },
      },
    },
  });

  return NextResponse.json({
    success: true,
    message: result.message,
    booking: updatedBooking,
  });
}
