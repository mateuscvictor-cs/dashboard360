import { prisma } from "@/lib/db";
import type { ClientResourceType } from "@prisma/client";

export type ClientResourceCreateInput = {
  title: string;
  description?: string;
  url?: string;
  type: ClientResourceType;
  category?: string;
  icon?: string;
  isActive?: boolean;
  order?: number;
  companyId: string;
  createdById?: string;
};

export type ClientResourceUpdateInput = Partial<Omit<ClientResourceCreateInput, "companyId" | "createdById">>;

export const clientResourceService = {
  async findById(id: string) {
    return prisma.clientResource.findUnique({
      where: { id },
      include: {
        company: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  async findByCompany(companyId: string, options?: { type?: ClientResourceType; isActive?: boolean }) {
    return prisma.clientResource.findMany({
      where: {
        companyId,
        ...(options?.type && { type: options.type }),
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
  },

  async create(data: ClientResourceCreateInput) {
    return prisma.clientResource.create({
      data: {
        title: data.title,
        description: data.description,
        url: data.url,
        type: data.type,
        category: data.category,
        icon: data.icon,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
        companyId: data.companyId,
        createdById: data.createdById,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });
  },

  async update(id: string, data: ClientResourceUpdateInput) {
    return prisma.clientResource.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });
  },

  async delete(id: string) {
    return prisma.clientResource.delete({
      where: { id },
    });
  },

  async reorder(companyId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      prisma.clientResource.update({
        where: { id },
        data: { order: index },
      })
    );

    return prisma.$transaction(updates);
  },

  async getGroupedByType(companyId: string) {
    const resources = await this.findByCompany(companyId, { isActive: true });

    return {
      automations: resources.filter((r) => r.type === "AUTOMATION"),
      ipcs: resources.filter((r) => r.type === "IPC"),
      links: resources.filter((r) => r.type === "LINK"),
      documents: resources.filter((r) => r.type === "DOCUMENT"),
      videos: resources.filter((r) => r.type === "VIDEO"),
    };
  },
};
