import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { maskApiKey } from "@/lib/encryption";

export async function GET() {
  const session = await requireAuth();

  const integrations = await prisma.userIntegration.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      provider: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      encryptedKey: true,
    },
  });

  const result = integrations.map((integration) => ({
    id: integration.id,
    provider: integration.provider,
    isActive: integration.isActive,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
    maskedKey: maskApiKey(integration.encryptedKey.slice(0, 20)),
  }));

  return NextResponse.json(result);
}
