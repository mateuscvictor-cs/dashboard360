import { prisma } from "@/lib/db";
import type { UserStatus } from "@prisma/client";

export type CSOwnerCreateInput = {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
};

export const csOwnerService = {
  async findById(id: string) {
    return prisma.cSOwner.findUnique({
      where: { id },
      include: {
        user: true,
        companies: {
          select: { id: true, name: true },
        },
        squadMembers: {
          include: { squad: true },
        },
      },
    });
  },

  async getById(id: string) {
    return this.findById(id);
  },

  async findByEmail(email: string) {
    return prisma.cSOwner.findUnique({
      where: { email },
    });
  },

  async findAll() {
    return prisma.cSOwner.findMany({
      include: {
        user: true,
        _count: {
          select: {
            companies: true,
            activities: true,
            pendings: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async findAllWithMetrics() {
    const csOwners = await prisma.cSOwner.findMany({
      where: { user: { isActive: true } },
      include: {
        companies: {
          select: {
            id: true,
            healthStatus: true,
          },
        },
        activities: {
          where: {
            timestamp: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          include: { company: { select: { id: true, name: true } } },
        },
        pendings: {
          where: {
            status: { not: "COMPLETED" },
          },
          include: { company: { select: { id: true, name: true } } },
        },
        checklistItems: true,
        assignedDemands: {
          where: {
            status: { not: "COMPLETED" },
          },
          include: { company: { select: { id: true, name: true } } },
        },
      },
      orderBy: { name: "asc" },
    });

    return csOwners.map((cs) => {
      const completedChecklist = cs.checklistItems.filter((c) => c.completed).length;
      const totalChecklist = cs.checklistItems.length;
      const pendingChecklist = totalChecklist - completedChecklist;
      const pendingDemands = cs.assignedDemands.length;
      
      return {
        ...cs,
        accountsCount: cs.companies.length,
        completedToday: completedChecklist,
        pendingTasks: pendingChecklist + pendingDemands,
        totalTasks: totalChecklist,
        accountsAtRisk: cs.companies.filter(
          (c) => c.healthStatus === "CRITICAL" || c.healthStatus === "RISK"
        ).length,
      };
    });
  },

  async create(data: CSOwnerCreateInput) {
    return prisma.cSOwner.create({
      data: {
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        role: data.role || "CS Owner",
      },
    });
  },

  async update(id: string, data: Partial<CSOwnerCreateInput> & {
    status?: UserStatus;
    weeklyCompletion?: number;
    avgResponseTime?: number;
    npsScore?: number;
  }) {
    return prisma.cSOwner.update({
      where: { id },
      data,
    });
  },

  async updateStatus(id: string, status: UserStatus) {
    return prisma.cSOwner.update({
      where: { id },
      data: { status },
    });
  },

  async delete(id: string) {
    return prisma.cSOwner.delete({
      where: { id },
    });
  },

  async getActivities(csOwnerId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return prisma.teamActivity.findMany({
      where: {
        csOwnerId,
        ...(options?.startDate && {
          timestamp: {
            gte: options.startDate,
            ...(options.endDate && { lte: options.endDate }),
          },
        }),
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
      orderBy: { timestamp: "desc" },
      take: options?.limit,
    });
  },

  async getPendings(csOwnerId: string) {
    return prisma.pending.findMany({
      where: {
        csOwnerId,
        status: { not: "COMPLETED" },
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });
  },

  async getChecklist(csOwnerId: string, date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    return prisma.checklistItem.findMany({
      where: {
        csOwnerId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: [{ completed: "asc" }, { priority: "desc" }],
    });
  },

  async getWhatsAppGroups(csOwnerId: string) {
    return prisma.whatsAppGroup.findMany({
      where: { csOwnerId },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
      orderBy: { unreadCount: "desc" },
    });
  },
};
