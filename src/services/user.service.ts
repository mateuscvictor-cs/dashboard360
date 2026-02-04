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

  async update(id: string, data: { role?: UserRole; isActive?: boolean }) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  async setActive(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
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
    return prisma.$transaction(async (tx) => {
      await tx.surveyResponse.deleteMany({ where: { respondentId: id } });
      await tx.delivery.updateMany({
        where: { clientApprovedById: id },
        data: { clientApprovedById: null },
      });
      await tx.deliveryComment.deleteMany({ where: { authorId: id } });
      await tx.invite.deleteMany({ where: { invitedById: id } });
      await tx.clientResource.updateMany({
        where: { createdById: id },
        data: { createdById: null },
      });
      await tx.notification.updateMany({
        where: { senderId: id },
        data: { senderId: null },
      });
      await tx.diagnosticResponse.updateMany(
        { where: { userId: id }, data: { userId: null } }
      );
      const forms = await tx.diagnosticForm.findMany({
        where: { sentById: id },
        select: { id: true },
      });
      const formIds = forms.map((f) => f.id);
      if (formIds.length > 0) {
        await tx.diagnosticResponse.deleteMany({
          where: { diagnosticId: { in: formIds } },
        });
        await tx.diagnosticForm.deleteMany({ where: { sentById: id } });
      }
      return tx.user.delete({ where: { id } });
    });
  },
};
