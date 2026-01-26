import { prisma } from "@/lib/db";
import type { User, UserRole } from "@prisma/client";

export const userService = {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        csOwner: true,
        company: true,
      },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        csOwner: true,
        company: true,
      },
    });
  },

  async findAll() {
    return prisma.user.findMany({
      include: {
        csOwner: true,
        company: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findByRole(role: UserRole) {
    return prisma.user.findMany({
      where: { role },
      include: {
        csOwner: true,
        company: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async updateRole(id: string, role: UserRole) {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  },

  async linkToCSOwner(userId: string, csOwnerId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { csOwnerId, role: "CS_OWNER" },
    });
  },

  async linkToCompany(userId: string, companyId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { companyId, role: "CLIENT" },
    });
  },

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  },
};
