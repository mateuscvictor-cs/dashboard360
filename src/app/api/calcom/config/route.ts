import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { calComService } from "@/services/calcom.service";

export async function GET() {
  try {
    const session = await requireAuth();
    if (session.user.role !== "CS_OWNER") {
      return NextResponse.json({ error: "Apenas CS Owners podem acessar" }, { status: 403 });
    }

    const csOwner = await prisma.cSOwner.findUnique({ where: { email: session.user.email! } });
    if (!csOwner) {
      return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
    }

    const config = await calComService.getCSOwnerConfig(csOwner.id);
    return NextResponse.json(config || { configured: false });
  } catch (error) {
    console.error("Erro ao buscar configuração:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.user.role !== "CS_OWNER") {
      return NextResponse.json({ error: "Apenas CS Owners podem configurar" }, { status: 403 });
    }

    const csOwner = await prisma.cSOwner.findUnique({ where: { email: session.user.email! } });
    if (!csOwner) {
      return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { calComUsername, calComUserId, defaultScheduleId } = body;

    if (!calComUsername) {
      return NextResponse.json({ error: "calComUsername é obrigatório" }, { status: 400 });
    }

    const config = await calComService.saveCSOwnerConfig(csOwner.id, {
      calComUsername,
      calComUserId,
      defaultScheduleId,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao salvar configuração:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
