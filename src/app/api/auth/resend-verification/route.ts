import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { emailService } from "@/services/email.service";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ success: true });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email já verificado" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        },
      },
      update: {
        token,
        expires,
      },
      create: {
        identifier: email,
        token,
        expires,
      },
    });

    const verifyUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/verificar-email?token=${token}&email=${encodeURIComponent(email)}`;
    
    await emailService.sendVerification(email, verifyUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao reenviar verificação:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
