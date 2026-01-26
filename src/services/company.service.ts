import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type CompanyCreateInput = {
  name: string;
  logo?: string;
  segment?: string;
  plan?: string;
  mrr?: number;
  csOwnerId?: string;
  squadId?: string;
  framework?: string;
  workshopsCount?: number;
  hotseatsCount?: number;
  docsLink?: string;
  fathomLink?: string;
  contractStart?: Date;
  contractEnd?: Date;
  onboardingStatus?: string;
  tags?: string[];
};

export type CompanyUpdateInput = Partial<CompanyCreateInput> & {
  healthScore?: number;
  healthStatus?: "CRITICAL" | "RISK" | "ATTENTION" | "HEALTHY";
  riskScore?: number;
  expansionScore?: number;
  adoptionScore?: number;
  lastInteraction?: Date;
  nextDelivery?: Date;
};

export const companyService = {
  async findById(id: string) {
    return prisma.company.findUnique({
      where: { id },
      include: {
        csOwner: true,
        squad: true,
        contacts: true,
        deliveries: {
          orderBy: { dueDate: "asc" },
        },
      },
    });
  },

  async findAll(options?: {
    csOwnerId?: string;
    squadId?: string;
    healthStatus?: string;
    search?: string;
  }) {
    const where: Prisma.CompanyWhereInput = {};

    if (options?.csOwnerId) {
      where.csOwnerId = options.csOwnerId;
    }

    if (options?.squadId) {
      where.squadId = options.squadId;
    }

    if (options?.healthStatus) {
      where.healthStatus = options.healthStatus as "CRITICAL" | "RISK" | "ATTENTION" | "HEALTHY";
    }

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { segment: { contains: options.search, mode: "insensitive" } },
      ];
    }

    return prisma.company.findMany({
      where,
      include: {
        csOwner: true,
        squad: true,
        _count: {
          select: {
            contacts: true,
            deliveries: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async findByCSOwner(csOwnerId: string) {
    return prisma.company.findMany({
      where: { csOwnerId },
      include: {
        csOwner: true,
        squad: true,
        contacts: true,
        deliveries: {
          where: {
            status: { not: "COMPLETED" },
          },
          orderBy: { dueDate: "asc" },
          take: 5,
        },
      },
      orderBy: { healthScore: "asc" },
    });
  },

  async create(data: CompanyCreateInput) {
    return prisma.company.create({
      data: {
        name: data.name,
        logo: data.logo,
        segment: data.segment,
        plan: data.plan,
        mrr: data.mrr || 0,
        csOwnerId: data.csOwnerId,
        squadId: data.squadId,
        framework: data.framework,
        workshopsCount: data.workshopsCount || 0,
        hotseatsCount: data.hotseatsCount || 0,
        docsLink: data.docsLink,
        fathomLink: data.fathomLink,
        contractStart: data.contractStart,
        contractEnd: data.contractEnd,
        onboardingStatus: data.onboardingStatus,
        tags: data.tags || [],
      },
      include: {
        csOwner: true,
        squad: true,
      },
    });
  },

  async update(id: string, data: CompanyUpdateInput) {
    return prisma.company.update({
      where: { id },
      data,
      include: {
        csOwner: true,
        squad: true,
      },
    });
  },

  async delete(id: string) {
    return prisma.company.delete({
      where: { id },
    });
  },

  async getPortfolioHealth() {
    const companies = await prisma.company.groupBy({
      by: ["healthStatus"],
      _count: true,
    });

    const result = {
      total: 0,
      healthy: 0,
      attention: 0,
      risk: 0,
      critical: 0,
    };

    companies.forEach((c) => {
      result.total += c._count;
      switch (c.healthStatus) {
        case "HEALTHY":
          result.healthy = c._count;
          break;
        case "ATTENTION":
          result.attention = c._count;
          break;
        case "RISK":
          result.risk = c._count;
          break;
        case "CRITICAL":
          result.critical = c._count;
          break;
      }
    });

    return result;
  },

  async addContact(companyId: string, data: {
    name: string;
    email: string;
    role?: string;
    phone?: string;
    isDecisionMaker?: boolean;
  }) {
    return prisma.contact.create({
      data: {
        ...data,
        companyId,
      },
    });
  },

  async addDelivery(companyId: string, data: {
    title: string;
    dueDate?: Date;
    assignee?: string;
    impact?: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  }) {
    return prisma.delivery.create({
      data: {
        ...data,
        companyId,
      },
    });
  },
};
