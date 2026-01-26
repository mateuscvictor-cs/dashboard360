import { prisma } from "@/lib/db";
import { Priority } from "@prisma/client";

export const checklistService = {
  async getByCSOwner(csOwnerId: string) {
    return prisma.checklistItem.findMany({
      where: { csOwnerId },
      orderBy: [{ completed: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
    });
  },

  async create(data: {
    title: string;
    description?: string;
    priority: Priority;
    csOwnerId: string;
    date?: Date;
  }) {
    return prisma.checklistItem.create({ data });
  },

  async update(id: string, data: {
    title?: string;
    description?: string;
    priority?: Priority;
    completed?: boolean;
  }) {
    return prisma.checklistItem.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.checklistItem.delete({ where: { id } });
  },

  async toggleCompleted(id: string) {
    const item = await prisma.checklistItem.findUnique({ where: { id } });
    if (!item) throw new Error("Item not found");
    return prisma.checklistItem.update({
      where: { id },
      data: { completed: !item.completed },
    });
  },
};
