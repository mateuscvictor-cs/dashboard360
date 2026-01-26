import { prisma } from "@/lib/db";

export type SquadCreateInput = {
  name: string;
  capacity?: number;
};

export const squadService = {
  async findById(id: string) {
    return prisma.squad.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            csOwner: true,
          },
        },
        companies: {
          select: {
            id: true,
            name: true,
            healthStatus: true,
          },
        },
      },
    });
  },

  async findAll() {
    return prisma.squad.findMany({
      include: {
        members: {
          include: {
            csOwner: {
              select: {
                id: true,
                name: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            companies: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async findAllWithMetrics() {
    const squads = await prisma.squad.findMany({
      include: {
        members: {
          include: {
            csOwner: {
              include: {
                pendings: {
                  where: { status: { not: "COMPLETED" } },
                },
              },
            },
          },
        },
        companies: {
          select: {
            healthStatus: true,
          },
        },
      },
    });

    return squads.map((squad) => {
      const blockedItems = squad.members.reduce(
        (acc, m) => acc + m.csOwner.pendings.filter((p) => p.status === "OVERDUE").length,
        0
      );

      return {
        ...squad,
        accountsCount: squad.companies.length,
        blockedItems,
        currentLoad: Math.round(
          (squad.companies.length / (squad.capacity || 100)) * 100
        ),
      };
    });
  },

  async create(data: SquadCreateInput) {
    return prisma.squad.create({
      data: {
        name: data.name,
        capacity: data.capacity || 100,
      },
    });
  },

  async update(id: string, data: Partial<SquadCreateInput>) {
    return prisma.squad.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.squad.delete({
      where: { id },
    });
  },

  async addMember(squadId: string, csOwnerId: string) {
    return prisma.squadMember.create({
      data: {
        squadId,
        csOwnerId,
      },
    });
  },

  async removeMember(squadId: string, csOwnerId: string) {
    return prisma.squadMember.delete({
      where: {
        squadId_csOwnerId: {
          squadId,
          csOwnerId,
        },
      },
    });
  },
};
