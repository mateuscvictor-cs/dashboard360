import { prisma } from "@/lib/db";
import { OnboardingStepType, OnboardingStepStatus, Prisma } from "@prisma/client";

export type CreateOnboardingStepInput = {
  type: OnboardingStepType;
  title: string;
  description?: string;
  order: number;
  dueDate?: Date;
  metadata?: Prisma.InputJsonValue;
  companyId: string;
};

export type UpdateOnboardingStepInput = {
  title?: string;
  description?: string;
  status?: OnboardingStepStatus;
  order?: number;
  dueDate?: Date;
  completedAt?: Date | null;
  metadata?: Prisma.InputJsonValue;
};

export const onboardingService = {
  async getByCompany(companyId: string) {
    return prisma.onboardingStep.findMany({
      where: { companyId },
      orderBy: { order: "asc" },
    });
  },

  async getById(id: string) {
    return prisma.onboardingStep.findUnique({ where: { id } });
  },

  async create(data: CreateOnboardingStepInput) {
    return prisma.onboardingStep.create({ data });
  },

  async update(id: string, data: UpdateOnboardingStepInput) {
    const updateData: UpdateOnboardingStepInput & { completedAt?: Date | null } = { ...data };
    
    if (data.status === "COMPLETED" && !data.completedAt) {
      updateData.completedAt = new Date();
    } else if (data.status && data.status !== "COMPLETED") {
      updateData.completedAt = null;
    }

    return prisma.onboardingStep.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(id: string) {
    return prisma.onboardingStep.delete({ where: { id } });
  },

  async reorder(companyId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      prisma.onboardingStep.update({
        where: { id },
        data: { order: index },
      })
    );
    return prisma.$transaction(updates);
  },

  async createDefaultSteps(companyId: string) {
    const defaultSteps: Omit<CreateOnboardingStepInput, "companyId">[] = [
      {
        type: "GROUP_CREATION",
        title: "Criação do Grupo",
        description: "Criar grupo de comunicação com o cliente",
        order: 0,
      },
      {
        type: "DIAGNOSTIC_FORM",
        title: "Formulário de Diagnóstico",
        description: "Aplicar formulário de diagnóstico inicial",
        order: 1,
      },
      {
        type: "ONBOARDING_MEETING",
        title: "Reunião de Onboarding",
        description: "Agendar e realizar reunião de onboarding",
        order: 2,
      },
    ];

    return prisma.onboardingStep.createMany({
      data: defaultSteps.map((step) => ({ ...step, companyId })),
    });
  },

  async getProgress(companyId: string) {
    const steps = await this.getByCompany(companyId);
    const total = steps.length;
    const completed = steps.filter((s) => s.status === "COMPLETED").length;
    const inProgress = steps.filter((s) => s.status === "IN_PROGRESS").length;
    
    return {
      total,
      completed,
      inProgress,
      pending: total - completed - inProgress,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },

  async updateStatus(id: string, status: OnboardingStepStatus) {
    return this.update(id, { status });
  },
};
