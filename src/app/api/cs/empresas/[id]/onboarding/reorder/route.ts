import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { onboardingService } from "@/services/onboarding.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { role?: string; csOwnerId?: string };
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      select: { csOwnerId: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && company.csOwnerId !== user.csOwnerId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds deve ser um array" }, { status: 400 });
    }

    await onboardingService.reorder(id, orderedIds);
    const steps = await onboardingService.getByCompany(id);

    return NextResponse.json({ steps });
  } catch (error) {
    console.error("Erro ao reordenar etapas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
