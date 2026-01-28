import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { calendlyService } from "@/services/calendly.service";

export async function GET() {
  try {
    const session = await requireAuth();
    if (session.user.role !== "CS_OWNER") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const csOwner = await prisma.cSOwner.findUnique({
      where: { email: session.user.email! },
    });
    if (!csOwner) {
      return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
    }

    const config = await calendlyService.getCSOwnerConfig(csOwner.id);
    return NextResponse.json(config || { configured: false });
  } catch (error) {
    console.error("[API Config] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar configuração" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.user.role !== "CS_OWNER") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const csOwner = await prisma.cSOwner.findUnique({
      where: { email: session.user.email! },
    });
    if (!csOwner) {
      return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { calendlyUsername, calendlyUserUri, defaultEventTypeUri } = body;

    if (!calendlyUsername) {
      return NextResponse.json({ error: "calendlyUsername é obrigatório" }, { status: 400 });
    }

    const config = await calendlyService.saveCSOwnerConfig(csOwner.id, {
      calendlyUsername,
      calendlyUserUri,
      defaultEventTypeUri,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("[API Config] Error:", error);
    return NextResponse.json({ error: "Erro ao salvar configuração" }, { status: 500 });
  }
}
