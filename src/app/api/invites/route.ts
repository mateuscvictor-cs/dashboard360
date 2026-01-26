import { NextResponse } from "next/server";
import { inviteService } from "@/services";
import { requireRole } from "@/lib/auth-server";
import type { InviteStatus, InviteType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN"]);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as InviteStatus | null;
    const type = searchParams.get("type") as InviteType | null;

    const invites = await inviteService.findAll({
      ...(status && { status }),
      ...(type && { type }),
    });

    return NextResponse.json(invites);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
    }
    console.error("Erro ao buscar convites:", error);
    return NextResponse.json(
      { error: "Erro ao buscar convites" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["ADMIN"]);

    const body = await request.json();
    const { email, type, companyId } = body;

    if (!email || !type) {
      return NextResponse.json(
        { error: "Email e tipo são obrigatórios" },
        { status: 400 }
      );
    }

    if (type === "COMPANY_ADMIN" && !companyId) {
      return NextResponse.json(
        { error: "Empresa é obrigatória para convites de cliente" },
        { status: 400 }
      );
    }

    const invite = await inviteService.create({
      email,
      type,
      companyId: companyId || undefined,
      invitedById: session.user.id,
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
      if (
        error.message.includes("convite pendente") ||
        error.message.includes("usuário cadastrado")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    console.error("Erro ao criar convite:", error);
    return NextResponse.json(
      { error: "Erro ao criar convite" },
      { status: 500 }
    );
  }
}
