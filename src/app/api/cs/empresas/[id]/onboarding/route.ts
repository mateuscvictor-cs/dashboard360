import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { onboardingService } from "@/services/onboarding.service";
import { OnboardingStepType } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const steps = await onboardingService.getByCompany(id);
    const progress = await onboardingService.getProgress(id);

    return NextResponse.json({ steps, progress });
  } catch (error) {
    console.error("Erro ao buscar onboarding:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { csOwnerId?: string };
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      select: { csOwnerId: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    if (company.csOwnerId !== user.csOwnerId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();

    if (body.createDefaults) {
      await onboardingService.createDefaultSteps(id);
      const steps = await onboardingService.getByCompany(id);
      return NextResponse.json({ steps });
    }

    const { type, title, description, dueDate, metadata } = body;

    if (!type || !title) {
      return NextResponse.json({ error: "Tipo e título são obrigatórios" }, { status: 400 });
    }

    const existingSteps = await onboardingService.getByCompany(id);
    const nextOrder = existingSteps.length;

    const step = await onboardingService.create({
      type: type as OnboardingStepType,
      title,
      description,
      order: nextOrder,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      metadata,
      companyId: id,
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar etapa de onboarding:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
