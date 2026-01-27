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

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/redefinir-senha?token=${token}&email=${encodeURIComponent(email)}`;
    
    await emailService.sendPasswordReset(email, resetUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao solicitar reset de senha:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
