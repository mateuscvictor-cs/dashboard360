import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { onboardingService } from "@/services/onboarding.service";
import { OnboardingStepStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { role?: string; csOwnerId?: string };
    const { id, stepId } = await params;

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

    const step = await onboardingService.getById(stepId);
    if (!step || step.companyId !== id) {
      return NextResponse.json({ error: "Etapa não encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, status, dueDate, metadata } = body;

    const updated = await onboardingService.update(stepId, {
      title,
      description,
      status: status as OnboardingStepStatus | undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      metadata,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar etapa:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { role?: string; csOwnerId?: string };
    const { id, stepId } = await params;

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

    const step = await onboardingService.getById(stepId);
    if (!step || step.companyId !== id) {
      return NextResponse.json({ error: "Etapa não encontrada" }, { status: 404 });
    }

    await onboardingService.delete(stepId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover etapa:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
