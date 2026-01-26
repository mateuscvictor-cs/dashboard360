import { prisma } from "@/lib/db";
import type { TemplateCategory, Priority } from "@prisma/client";

export type TemplateCreateInput = {
  name: string;
  description?: string;
  category?: TemplateCategory;
  isDefault?: boolean;
  createdBy?: string;
  tasks: {
    title: string;
    description?: string;
    priority?: Priority;
    estimatedMinutes?: number;
  }[];
};

export type ApplyTemplateInput = {
  templateId: string;
  assignedToId?: string;
  assignedToSquadId?: string;
  dueDate?: Date;
  appliedBy?: string;
};

export const templateService = {
  async findById(id: string) {
    return prisma.activityTemplate.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });
  },

  async findAll(options?: { category?: TemplateCategory; isDefault?: boolean }) {
    return prisma.activityTemplate.findMany({
      where: {
        ...(options?.category && { category: options.category }),
        ...(options?.isDefault !== undefined && { isDefault: options.isDefault }),
      },
      include: {
        tasks: {
          orderBy: { orderIndex: "asc" },
        },
        _count: {
          select: { appliedTemplates: true },
        },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  },

  async create(data: TemplateCreateInput) {
    return prisma.activityTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category || "CUSTOM",
        isDefault: data.isDefault || false,
        createdBy: data.createdBy,
        tasks: {
          create: data.tasks.map((task, index) => ({
            title: task.title,
            description: task.description,
            priority: task.priority || "MEDIUM",
            estimatedMinutes: task.estimatedMinutes,
            orderIndex: index,
          })),
        },
      },
      include: {
        tasks: true,
      },
    });
  },

  async update(id: string, data: Partial<Omit<TemplateCreateInput, "tasks">>) {
    return prisma.activityTemplate.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.activityTemplate.delete({
      where: { id },
    });
  },

  async addTask(templateId: string, data: {
    title: string;
    description?: string;
    priority?: Priority;
    estimatedMinutes?: number;
  }) {
    const lastTask = await prisma.templateTask.findFirst({
      where: { templateId },
      orderBy: { orderIndex: "desc" },
    });

    return prisma.templateTask.create({
      data: {
        templateId,
        title: data.title,
        description: data.description,
        priority: data.priority || "MEDIUM",
        estimatedMinutes: data.estimatedMinutes,
        orderIndex: (lastTask?.orderIndex || 0) + 1,
      },
    });
  },

  async removeTask(taskId: string) {
    return prisma.templateTask.delete({
      where: { id: taskId },
    });
  },

  async applyTemplate(data: ApplyTemplateInput) {
    const template = await prisma.activityTemplate.findUnique({
      where: { id: data.templateId },
      include: { tasks: true },
    });

    if (!template) throw new Error("Template not found");

    return prisma.appliedTemplate.create({
      data: {
        templateId: data.templateId,
        assignedToId: data.assignedToId,
        assignedToSquadId: data.assignedToSquadId,
        dueDate: data.dueDate,
        appliedBy: data.appliedBy,
      },
      include: {
        template: {
          include: { tasks: true },
        },
        assignedTo: { select: { id: true, name: true } },
        assignedToSquad: { select: { id: true, name: true } },
      },
    });
  },

  async getAppliedTemplates(options?: {
    assignedToId?: string;
    assignedToSquadId?: string;
    status?: "ACTIVE" | "COMPLETED" | "CANCELLED";
  }) {
    return prisma.appliedTemplate.findMany({
      where: {
        ...(options?.assignedToId && { assignedToId: options.assignedToId }),
        ...(options?.assignedToSquadId && { assignedToSquadId: options.assignedToSquadId }),
        ...(options?.status && { status: options.status }),
      },
      include: {
        template: {
          include: {
            tasks: { orderBy: { orderIndex: "asc" } },
          },
        },
        assignedTo: { select: { id: true, name: true, avatar: true } },
        assignedToSquad: { select: { id: true, name: true } },
      },
      orderBy: { appliedAt: "desc" },
    });
  },

  async updateAppliedTemplateProgress(id: string, completedTasks: number) {
    const applied = await prisma.appliedTemplate.findUnique({
      where: { id },
      include: { template: { include: { tasks: true } } },
    });

    if (!applied) throw new Error("Applied template not found");

    const totalTasks = applied.template.tasks.length;
    const status = completedTasks >= totalTasks ? "COMPLETED" : "ACTIVE";

    return prisma.appliedTemplate.update({
      where: { id },
      data: { completedTasks, status },
    });
  },

  async cancelAppliedTemplate(id: string) {
    return prisma.appliedTemplate.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  },
};
