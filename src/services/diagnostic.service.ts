import { prisma } from "@/lib/db";
import type { DiagnosticStatus, DiagnosticForm, DiagnosticResponse, DiagnosticAnalysis, DiagnosticAudience, Prisma } from "@prisma/client";
import { randomBytes } from "crypto";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

function generatePublicToken(companySlug: string): string {
  const randomPart = randomBytes(8).toString("hex");
  return `${companySlug}-${randomPart}`;
}

export type TaskDetail = {
  taskName: string;
  stepByStep: string;
  frequency: string;
  timePerExecution: string;
  peopleDoingSame: string;
  whereStarts: string;
  whereEnds: string;
  hasClearPattern: string;
  hasProcessOwner: string;
  canContinueIfOtherPerson: string;
  mainProblem: string;
  mainGainIfImproved: string;
  timeSavedPerWeek: string;
};

export type SystemsData = {
  dailyTools: string[];
  indispensableSystems: string[];
  mainDataLocation: string[];
  hasIntegration: string;
  integrationDetails?: string;
  itBlocksAccess: string;
  itBlocksDetails?: string;
};

export type PriorityData = {
  taskToEliminate: string;
  willingToTest: string;
  bestTimeForTest?: string;
  finalObservation?: string;
};

export type CreateDiagnosticData = {
  companyId: string;
  sentById: string;
  expiresAt?: Date;
  targetAudience?: DiagnosticAudience;
};

export type CreateDiagnosticResponseData = {
  diagnosticId: string;
  userId?: string;
  email?: string;
  fullName: string;
  position: string;
  area: string;
  timeInCompany: string;
  directlyInvolved: string;
  directManager?: string;
  topFiveTasks: string[];
  topTwoTimeTasks: string[];
  copyPasteTask?: string;
  reworkArea?: string;
  humanErrorArea?: string;
  dependencyArea?: string;
  frustration?: string;
  taskDetails: TaskDetail[];
  systemsData: SystemsData;
  priorityData: PriorityData;
};

export type DiagnosticFormWithRelations = DiagnosticForm & {
  company: { id: string; name: string; slug: string | null; logo: string | null };
  sentBy: { id: string; name: string | null; email: string };
  responses: (DiagnosticResponse & { user: { id: string; name: string | null; email: string } | null })[];
  aiAnalysis: DiagnosticAnalysis | null;
  _count: { responses: number };
};

export type DiagnosticResponseWithRelations = DiagnosticResponse & {
  user: { id: string; name: string | null; email: string } | null;
  diagnostic: { id: string; companyId: string; company: { name: string } };
};

export const diagnosticService = {
  async create(data: CreateDiagnosticData): Promise<DiagnosticForm & { company: { slug: string | null; name: string } }> {
    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
      select: { id: true, name: true, slug: true },
    });

    if (!company) {
      throw new Error("Empresa não encontrada");
    }

    let companySlug = company.slug;
    if (!companySlug) {
      companySlug = generateSlug(company.name);
      const existingSlug = await prisma.company.findUnique({
        where: { slug: companySlug },
      });
      if (!existingSlug) {
        await prisma.company.update({
          where: { id: company.id },
          data: { slug: companySlug },
        });
      } else {
        companySlug = `${companySlug}-${company.id.slice(0, 8)}`;
        await prisma.company.update({
          where: { id: company.id },
          data: { slug: companySlug },
        });
      }
    }

    const publicToken = generatePublicToken(companySlug);
    const expiresAt = data.expiresAt || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    const diagnostic = await prisma.diagnosticForm.create({
      data: {
        companyId: data.companyId,
        sentById: data.sentById,
        expiresAt,
        status: "PENDING",
        publicToken,
        targetAudience: data.targetAudience || "ALL",
      },
      include: {
        company: { select: { slug: true, name: true } },
      },
    });

    return diagnostic;
  },

  async findById(id: string): Promise<DiagnosticFormWithRelations | null> {
    return prisma.diagnosticForm.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, slug: true, logo: true } },
        sentBy: { select: { id: true, name: true, email: true } },
        responses: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        aiAnalysis: true,
        _count: { select: { responses: true } },
      },
    });
  },

  async findByPublicToken(token: string): Promise<DiagnosticFormWithRelations | null> {
    return prisma.diagnosticForm.findUnique({
      where: { publicToken: token },
      include: {
        company: { select: { id: true, name: true, slug: true, logo: true } },
        sentBy: { select: { id: true, name: true, email: true } },
        responses: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        aiAnalysis: true,
        _count: { select: { responses: true } },
      },
    });
  },

  async findByCompany(companyId: string): Promise<DiagnosticFormWithRelations[]> {
    return prisma.diagnosticForm.findMany({
      where: { companyId },
      include: {
        company: { select: { id: true, name: true, slug: true, logo: true } },
        sentBy: { select: { id: true, name: true, email: true } },
        responses: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        aiAnalysis: true,
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findPendingForUser(userId: string, companyId: string, userRole?: string): Promise<DiagnosticFormWithRelations[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const respondedIds = await prisma.diagnosticResponse.findMany({
      where: {
        OR: [
          { userId },
          ...(user?.email ? [{ email: user.email.toLowerCase() }] : []),
        ],
      },
      select: { diagnosticId: true },
    });

    const respondedDiagnosticIds = [...new Set(respondedIds.map(r => r.diagnosticId))];

    const audienceFilter = userRole === "CLIENT_MEMBER" 
      ? { targetAudience: { in: ["ALL", "MEMBER_ONLY"] as DiagnosticAudience[] } }
      : userRole === "CLIENT"
      ? { targetAudience: { in: ["ALL", "CLIENT_ONLY"] as DiagnosticAudience[] } }
      : {};

    return prisma.diagnosticForm.findMany({
      where: {
        companyId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        id: { notIn: respondedDiagnosticIds },
        ...audienceFilter,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        company: { select: { id: true, name: true, slug: true, logo: true } },
        sentBy: { select: { id: true, name: true, email: true } },
        responses: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        aiAnalysis: true,
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async updateStatus(id: string, status: DiagnosticStatus): Promise<DiagnosticForm> {
    return prisma.diagnosticForm.update({
      where: { id },
      data: { status },
    });
  },

  async generateTokenForExisting(id: string): Promise<string> {
    const diagnostic = await prisma.diagnosticForm.findUnique({
      where: { id },
      include: { company: { select: { id: true, name: true, slug: true } } },
    });

    if (!diagnostic) {
      throw new Error("Diagnóstico não encontrado");
    }

    if (diagnostic.publicToken) {
      return diagnostic.publicToken;
    }

    let companySlug = diagnostic.company.slug;
    if (!companySlug) {
      companySlug = generateSlug(diagnostic.company.name);
      const existingSlug = await prisma.company.findUnique({
        where: { slug: companySlug },
      });
      if (!existingSlug) {
        await prisma.company.update({
          where: { id: diagnostic.company.id },
          data: { slug: companySlug },
        });
      } else {
        companySlug = `${companySlug}-${diagnostic.company.id.slice(0, 8)}`;
        await prisma.company.update({
          where: { id: diagnostic.company.id },
          data: { slug: companySlug },
        });
      }
    }

    const publicToken = generatePublicToken(companySlug);

    await prisma.diagnosticForm.update({
      where: { id },
      data: { publicToken },
    });

    return publicToken;
  },

  async createResponse(data: CreateDiagnosticResponseData): Promise<DiagnosticResponse> {
    const response = await prisma.diagnosticResponse.create({
      data: {
        diagnosticId: data.diagnosticId,
        userId: data.userId || null,
        email: data.email || null,
        fullName: data.fullName,
        position: data.position,
        area: data.area,
        timeInCompany: data.timeInCompany,
        directlyInvolved: data.directlyInvolved,
        directManager: data.directManager,
        topFiveTasks: data.topFiveTasks,
        topTwoTimeTasks: data.topTwoTimeTasks,
        copyPasteTask: data.copyPasteTask,
        reworkArea: data.reworkArea,
        humanErrorArea: data.humanErrorArea,
        dependencyArea: data.dependencyArea,
        frustration: data.frustration,
        taskDetails: data.taskDetails as Prisma.InputJsonValue,
        systemsData: data.systemsData as Prisma.InputJsonValue,
        priorityData: data.priorityData as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    const diagnostic = await prisma.diagnosticForm.findUnique({
      where: { id: data.diagnosticId },
      include: { _count: { select: { responses: true } } },
    });

    if (diagnostic && diagnostic.status === "PENDING") {
      await prisma.diagnosticForm.update({
        where: { id: data.diagnosticId },
        data: { status: "IN_PROGRESS" },
      });
    }

    return response;
  },

  async hasEmailResponded(diagnosticId: string, email: string): Promise<boolean> {
    const response = await prisma.diagnosticResponse.findFirst({
      where: {
        diagnosticId,
        email: email.toLowerCase(),
      },
    });
    return !!response;
  },

  async markInviteSent(responseId: string): Promise<void> {
    await prisma.diagnosticResponse.update({
      where: { id: responseId },
      data: { inviteSent: true },
    });
  },

  getPublicDiagnosticUrl(token: string): string {
    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
    return `${baseUrl}/diagnostico/${token}`;
  },

  async findResponseById(id: string): Promise<DiagnosticResponseWithRelations | null> {
    return prisma.diagnosticResponse.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        diagnostic: {
          select: {
            id: true,
            companyId: true,
            company: { select: { name: true } },
          },
        },
      },
    });
  },

  async findResponsesByDiagnostic(diagnosticId: string): Promise<DiagnosticResponseWithRelations[]> {
    return prisma.diagnosticResponse.findMany({
      where: { diagnosticId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        diagnostic: {
          select: {
            id: true,
            companyId: true,
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async hasUserResponded(diagnosticId: string, userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const response = await prisma.diagnosticResponse.findFirst({
      where: {
        diagnosticId,
        OR: [
          { userId },
          ...(user?.email ? [{ email: user.email.toLowerCase() }] : []),
        ],
      },
    });
    return !!response;
  },

  async saveAnalysis(
    diagnosticId: string,
    analysis: {
      summary: string;
      suggestedIPCs: Prisma.InputJsonValue;
      suggestedAutomations: Prisma.InputJsonValue;
      priorityTasks: Prisma.InputJsonValue;
      estimatedSavings: Prisma.InputJsonValue;
      presentationPrompt: string;
      rawAnalysis: string;
    }
  ): Promise<DiagnosticAnalysis> {
    return prisma.diagnosticAnalysis.upsert({
      where: { diagnosticId },
      create: {
        diagnosticId,
        summary: analysis.summary,
        suggestedIPCs: analysis.suggestedIPCs,
        suggestedAutomations: analysis.suggestedAutomations,
        priorityTasks: analysis.priorityTasks,
        estimatedSavings: analysis.estimatedSavings,
        presentationPrompt: analysis.presentationPrompt,
        rawAnalysis: analysis.rawAnalysis,
      },
      update: {
        summary: analysis.summary,
        suggestedIPCs: analysis.suggestedIPCs,
        suggestedAutomations: analysis.suggestedAutomations,
        priorityTasks: analysis.priorityTasks,
        estimatedSavings: analysis.estimatedSavings,
        presentationPrompt: analysis.presentationPrompt,
        rawAnalysis: analysis.rawAnalysis,
      },
    });
  },

  async markAsAnalyzed(id: string): Promise<DiagnosticForm> {
    return prisma.diagnosticForm.update({
      where: { id },
      data: { status: "ANALYZED" },
    });
  },

  async getStats(companyId?: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    analyzed: number;
    totalResponses: number;
  }> {
    const where = companyId ? { companyId } : {};

    const [total, pending, inProgress, completed, analyzed, totalResponses] = await Promise.all([
      prisma.diagnosticForm.count({ where }),
      prisma.diagnosticForm.count({ where: { ...where, status: "PENDING" } }),
      prisma.diagnosticForm.count({ where: { ...where, status: "IN_PROGRESS" } }),
      prisma.diagnosticForm.count({ where: { ...where, status: "COMPLETED" } }),
      prisma.diagnosticForm.count({ where: { ...where, status: "ANALYZED" } }),
      prisma.diagnosticResponse.count({
        where: companyId ? { diagnostic: { companyId } } : {},
      }),
    ]);

    return { total, pending, inProgress, completed, analyzed, totalResponses };
  },

  async delete(id: string): Promise<void> {
    await prisma.diagnosticForm.delete({
      where: { id },
    });
  },
};
