import { prisma } from "@/lib/db";
import { DemandType, DemandStatus, Priority } from "@prisma/client";

export const demandService = {
  async getByCSOwner(csOwnerId: string) {
    return prisma.demand.findMany({
      where: { assignedToId: csOwnerId },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(data: {
    title: string;
    description?: string;
    type: DemandType;
    priority: Priority;
    dueDate?: Date;
    assignedToId: string;
    companyId?: string;
    createdBy?: string;
  }) {
    return prisma.demand.create({
      data,
      include: { company: true, assignedTo: true },
    });
  },

  async update(id: string, data: {
    title?: string;
    description?: string;
    type?: DemandType;
    priority?: Priority;
    status?: DemandStatus;
    dueDate?: Date;
  }) {
    return prisma.demand.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.demand.delete({ where: { id } });
  },

  async markCompleted(id: string) {
    return prisma.demand.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
  },
};
