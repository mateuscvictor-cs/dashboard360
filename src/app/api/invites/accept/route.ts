import { NextResponse } from "next/server";
import { inviteService } from "@/services";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, name, password, image } = body;

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: "Token, nome e senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 8 caracteres" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await inviteService.accept(token, {
      name,
      passwordHash,
      image: image || null,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);
    return NextResponse.json(
      { error: "Erro ao aceitar convite" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token é obrigatório" },
        { status: 400 }
      );
    }

    const validation = await inviteService.validateToken(token);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, error: validation.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      invite: {
        email: validation.invite!.email,
        type: validation.invite!.type,
        company: validation.invite!.company,
      },
    });
  } catch (error) {
    console.error("Erro ao validar convite:", error);
    return NextResponse.json(
      { error: "Erro ao validar convite" },
      { status: 500 }
    );
  }
}
