import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { csOwnerId?: string; role?: string };
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contacts: {
          orderBy: { name: "asc" },
        },
        deliveries: {
          orderBy: { createdAt: "desc" },
        },
        csOwner: {
          select: { id: true, name: true },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const canAccess = user.role === "ADMIN" || company.csOwnerId === user.csOwnerId;
    if (!canAccess) {
      return NextResponse.json({ error: "Sem permissão para acessar esta empresa" }, { status: 403 });
    }

    const isOwner = company.csOwnerId === user.csOwnerId;

    return NextResponse.json({
      ...company,
      canEdit: isOwner,
    });
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { csOwnerId?: string; role?: string };
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      select: { csOwnerId: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && company.csOwnerId !== user.csOwnerId) {
      return NextResponse.json({ error: "Sem permissão para editar esta empresa" }, { status: 403 });
    }

    const body = await request.json();
    const { workshopsCount, hotseatsCount, lastInteraction, ...rest } = body;

    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...(workshopsCount !== undefined && { workshopsCount }),
        ...(hotseatsCount !== undefined && { hotseatsCount }),
        ...(lastInteraction && { lastInteraction: new Date(lastInteraction) }),
        ...rest,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
