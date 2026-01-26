import { prisma } from "@/lib/db";
import { emailService } from "./email.service";
import type { InviteType, InviteStatus, Invite } from "@prisma/client";
import { randomBytes } from "crypto";

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function getExpirationDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

export type CreateInviteData = {
  email: string;
  type: InviteType;
  companyId?: string;
  invitedById: string;
};

export type InviteWithRelations = Invite & {
  company: { id: string; name: string } | null;
  invitedBy: { id: string; name: string; email: string };
};

export const inviteService = {
  async create(data: CreateInviteData): Promise<Invite> {
    const existingPending = await prisma.invite.findFirst({
      where: {
        email: data.email,
        status: "PENDING",
      },
    });

    if (existingPending) {
      throw new Error("Já existe um convite pendente para este email");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("Já existe um usuário cadastrado com este email");
    }

    const token = generateToken();
    const expiresAt = getExpirationDate();

    const invite = await prisma.invite.create({
      data: {
        email: data.email,
        type: data.type,
        token,
        expiresAt,
        companyId: data.companyId || null,
        invitedById: data.invitedById,
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    await emailService.sendInvite(
      data.email,
      token,
      data.type,
      invite.company?.name
    );

    return invite;
  },

  async findAll(filters?: {
    status?: InviteStatus;
    type?: InviteType;
  }): Promise<InviteWithRelations[]> {
    return prisma.invite.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.type && { type: filters.type }),
      },
      include: {
        company: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findByToken(token: string): Promise<InviteWithRelations | null> {
    return prisma.invite.findUnique({
      where: { token },
      include: {
        company: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async findById(id: string): Promise<InviteWithRelations | null> {
    return prisma.invite.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async validateToken(token: string): Promise<{
    valid: boolean;
    invite?: InviteWithRelations;
    error?: string;
  }> {
    const invite = await this.findByToken(token);

    if (!invite) {
      return { valid: false, error: "Convite não encontrado" };
    }

    if (invite.status !== "PENDING") {
      return { valid: false, error: "Este convite já foi utilizado ou cancelado" };
    }

    if (new Date() > invite.expiresAt) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
      return { valid: false, error: "Este convite expirou" };
    }

    return { valid: true, invite };
  },

  async accept(
    token: string,
    userData: { name: string; passwordHash: string; image?: string | null }
  ): Promise<{ success: boolean; error?: string }> {
    const validation = await this.validateToken(token);

    if (!validation.valid || !validation.invite) {
      return { success: false, error: validation.error };
    }

    const invite = validation.invite;

    const roleMap: Record<InviteType, "CLIENT" | "ADMIN" | "CS_OWNER"> = {
      COMPANY_ADMIN: "CLIENT",
      MEMBER_ADMIN: "ADMIN",
      MEMBER_CS: "CS_OWNER",
    };

    const role = roleMap[invite.type];

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: invite.email,
          name: userData.name,
          role,
          emailVerified: true,
          image: userData.image || null,
          companyId: invite.type === "COMPANY_ADMIN" ? invite.companyId : null,
        },
      });

      await tx.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: userData.passwordHash,
        },
      });

      if (invite.type === "MEMBER_CS") {
        const csOwner = await tx.cSOwner.create({
          data: {
            name: userData.name,
            email: invite.email,
            avatar: userData.image || null,
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: { csOwnerId: csOwner.id },
        });
      }

      await tx.invite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED" },
      });
    });

    return { success: true };
  },

  async cancel(id: string): Promise<Invite> {
    return prisma.invite.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  },

  async resend(id: string): Promise<{ success: boolean; error?: string }> {
    const invite = await this.findById(id);

    if (!invite) {
      return { success: false, error: "Convite não encontrado" };
    }

    if (invite.status !== "PENDING") {
      return { success: false, error: "Apenas convites pendentes podem ser reenviados" };
    }

    const newToken = generateToken();
    const newExpiresAt = getExpirationDate();

    await prisma.invite.update({
      where: { id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
      },
    });

    await emailService.sendInvite(
      invite.email,
      newToken,
      invite.type,
      invite.company?.name
    );

    return { success: true };
  },

  async getStats(): Promise<{
    total: number;
    pending: number;
    accepted: number;
    expired: number;
    cancelled: number;
  }> {
    const [total, pending, accepted, expired, cancelled] = await Promise.all([
      prisma.invite.count(),
      prisma.invite.count({ where: { status: "PENDING" } }),
      prisma.invite.count({ where: { status: "ACCEPTED" } }),
      prisma.invite.count({ where: { status: "EXPIRED" } }),
      prisma.invite.count({ where: { status: "CANCELLED" } }),
    ]);

    return { total, pending, accepted, expired, cancelled };
  },
};
