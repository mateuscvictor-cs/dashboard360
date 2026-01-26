import { prisma } from "@/lib/db";
import type { ActivityType, PendingType, Priority, DemandType } from "@prisma/client";

export type ActivityCreateInput = {
  csOwnerId: string;
  companyId?: string;
  type: ActivityType;
  description: string;
  duration?: number;
  outcome?: string;
};

export type PendingCreateInput = {
  csOwnerId: string;
  companyId?: string;
  type: PendingType;
  title: string;
  dueDate: Date;
  priority?: Priority;
};

export type DemandCreateInput = {
  title: string;
  description?: string;
  type?: DemandType;
  priority?: Priority;
  companyId?: string;
  assignedToId?: string;
  dueDate?: Date;
  createdBy?: string;
};

export const activityService = {
  async createActivity(data: ActivityCreateInput) {
    return prisma.teamActivity.create({
      data: {
        csOwnerId: data.csOwnerId,
        companyId: data.companyId,
        type: data.type,
        description: data.description,
        duration: data.duration,
        outcome: data.outcome,
      },
      include: {
        csOwner: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });
  },

  async getActivities(options?: {
    csOwnerId?: string;
    companyId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return prisma.teamActivity.findMany({
      where: {
        ...(options?.csOwnerId && { csOwnerId: options.csOwnerId }),
        ...(options?.companyId && { companyId: options.companyId }),
        ...(options?.startDate && {
          timestamp: {
            gte: options.startDate,
            ...(options?.endDate && { lte: options.endDate }),
          },
        }),
      },
      include: {
        csOwner: { select: { id: true, name: true, avatar: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { timestamp: "desc" },
      take: options?.limit,
    });
  },

  async getTodayActivities(csOwnerId?: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.getActivities({
      csOwnerId,
      startDate: startOfDay,
    });
  },

  async createPending(data: PendingCreateInput) {
    return prisma.pending.create({
      data: {
        csOwnerId: data.csOwnerId,
        companyId: data.companyId,
        type: data.type,
        title: data.title,
        dueDate: data.dueDate,
        priority: data.priority || "MEDIUM",
      },
      include: {
        csOwner: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });
  },

  async getPendings(options?: {
    csOwnerId?: string;
    status?: "PENDING" | "OVERDUE" | "COMPLETED";
  }) {
    return prisma.pending.findMany({
      where: {
        ...(options?.csOwnerId && { csOwnerId: options.csOwnerId }),
        ...(options?.status && { status: options.status }),
      },
      include: {
        csOwner: { select: { id: true, name: true, avatar: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });
  },

  async completePending(id: string) {
    return prisma.pending.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
  },

  async createDemand(data: DemandCreateInput) {
    return prisma.demand.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type || "REQUEST",
        priority: data.priority || "MEDIUM",
        companyId: data.companyId,
        assignedToId: data.assignedToId,
        dueDate: data.dueDate,
        createdBy: data.createdBy,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });
  },

  async getDemands(options?: {
    assignedToId?: string;
    status?: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  }) {
    return prisma.demand.findMany({
      where: {
        ...(options?.assignedToId && { assignedToId: options.assignedToId }),
        ...(options?.status && { status: options.status }),
      },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });
  },

  async updateDemandStatus(id: string, status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED") {
    return prisma.demand.update({
      where: { id },
      data: { status },
    });
  },

  async createChecklistItem(csOwnerId: string, data: {
    title: string;
    description?: string;
    priority?: Priority;
  }) {
    return prisma.checklistItem.create({
      data: {
        csOwnerId,
        title: data.title,
        description: data.description,
        priority: data.priority || "MEDIUM",
      },
    });
  },

  async toggleChecklistItem(id: string) {
    const item = await prisma.checklistItem.findUnique({
      where: { id },
    });

    if (!item) throw new Error("Item not found");

    return prisma.checklistItem.update({
      where: { id },
      data: { completed: !item.completed },
    });
  },
};
