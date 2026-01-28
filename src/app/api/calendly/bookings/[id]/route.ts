import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();

  const { id } = await params;

  const booking = await prisma.calendlyBooking.findUnique({
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
      delivery: {
        select: { id: true, title: true },
      },
    },
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
  } else if (role === "CLIENT") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });
    if (!user?.companyId || booking.companyId !== user.companyId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
  }

  return NextResponse.json(booking);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();

  const { id } = await params;
  const body = await request.json();

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

  const allowedFields = ["notes", "fathomUrl", "fathomRecordingId"];
  const updateData: Record<string, string> = {};

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  const updatedBooking = await prisma.calendlyBooking.update({
    where: { id },
    data: updateData,
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
      delivery: {
        select: { id: true, title: true },
      },
    },
  });

  return NextResponse.json(updatedBooking);
}
