import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { encrypt, decrypt, maskApiKey } from "@/lib/encryption";
import { fathomService } from "@/services/fathom.service";

export async function GET() {
  const session = await requireAuth();

  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider: "fathom",
      },
    },
  });

  if (!integration) {
    return NextResponse.json({ configured: false });
  }

  let apiKey: string;
  try {
    apiKey = decrypt(integration.encryptedKey, integration.keyIv);
  } catch {
    return NextResponse.json({
      configured: true,
      isActive: false,
      error: "Erro ao descriptografar chave",
    });
  }

  const isValid = await fathomService.testConnection(apiKey);

  return NextResponse.json({
    configured: true,
    isActive: integration.isActive && isValid,
    maskedKey: maskApiKey(apiKey),
    createdAt: integration.createdAt,
  });
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();

  const body = await request.json();
  const { apiKey } = body;

  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
    return NextResponse.json(
      { error: "API key é obrigatória" },
      { status: 400 }
    );
  }

  const isValid = await fathomService.testConnection(apiKey.trim());
  if (!isValid) {
    return NextResponse.json(
      { error: "API key inválida ou sem permissão" },
      { status: 400 }
    );
  }

  const { encrypted, iv } = encrypt(apiKey.trim());

  const integration = await prisma.userIntegration.upsert({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider: "fathom",
      },
    },
    update: {
      encryptedKey: encrypted,
      keyIv: iv,
      isActive: true,
    },
    create: {
      userId: session.user.id,
      provider: "fathom",
      encryptedKey: encrypted,
      keyIv: iv,
      isActive: true,
    },
  });

  return NextResponse.json({
    success: true,
    maskedKey: maskApiKey(apiKey.trim()),
    createdAt: integration.createdAt,
  });
}

export async function DELETE() {
  const session = await requireAuth();

  await prisma.userIntegration.deleteMany({
    where: {
      userId: session.user.id,
      provider: "fathom",
    },
  });

  return NextResponse.json({ success: true });
}
