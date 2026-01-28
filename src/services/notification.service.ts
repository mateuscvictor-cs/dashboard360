import { prisma } from "@/lib/db";
import { sseBroadcaster } from "@/lib/sse";
import { emailService } from "./email.service";
import {
  NotificationType,
  Notification,
  User,
  Delivery,
  DeliveryDependency,
  DeliveryComment,
  Company,
} from "@prisma/client";

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  recipientId: string;
  senderId?: string;
  deliveryId?: string;
  companyId?: string;
}

interface ManualNotificationInput {
  title: string;
  message: string;
  link?: string;
  recipientIds: string[];
}

interface BroadcastInput {
  title: string;
  message: string;
  link?: string;
  targetRole?: "CLIENT" | "CS_OWNER" | "ADMIN" | "ALL";
  companyId?: string;
}

type UserWithPreferences = User & {
  notifyInApp: boolean;
  notifyEmail: boolean;
  notifyDeliveries: boolean;
  notifyProgress: boolean;
  notifyDeadlines: boolean;
};

type DeliveryWithCompany = Delivery & {
  company: Company & {
    users: User[];
    csOwner: { id: string; user: User | null } | null;
  };
};

type DependencyWithDelivery = DeliveryDependency & {
  delivery: DeliveryWithCompany;
};

type CommentWithRelations = DeliveryComment & {
  delivery: DeliveryWithCompany;
  author: User;
};

class NotificationService {
  private shouldNotifyByType(type: NotificationType, user: UserWithPreferences): boolean {
    const deliveryTypes: NotificationType[] = [
      "DEPENDENCY_ADDED",
      "DELIVERY_COMPLETED",
      "DELIVERY_APPROVED",
      "DEPENDENCY_PROVIDED",
    ];

    const progressTypes: NotificationType[] = [
      "DELIVERY_PROGRESS",
    ];

    const deadlineTypes: NotificationType[] = [
      "DEPENDENCY_OVERDUE",
    ];

    if (deliveryTypes.includes(type) && !user.notifyDeliveries) return false;
    if (progressTypes.includes(type) && !user.notifyProgress) return false;
    if (deadlineTypes.includes(type) && !user.notifyDeadlines) return false;

    return true;
  }

  private async sendNotification(
    notification: Notification,
    user: UserWithPreferences
  ): Promise<void> {
    if (!this.shouldNotifyByType(notification.type, user)) return;

    if (user.notifyInApp) {
      sseBroadcaster.send(user.id, {
        type: "notification",
        data: notification,
      });
    }

    if (user.notifyEmail) {
      const emailSent = await emailService.sendNotificationEmail(
        user.email,
        notification.title,
        notification.message,
        notification.link || undefined,
        user.name || undefined
      );

      if (emailSent) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { emailSent: true },
        });
      }
    }
  }

  async create(data: CreateNotificationInput): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        recipientId: data.recipientId,
        senderId: data.senderId,
        deliveryId: data.deliveryId,
        companyId: data.companyId,
      },
      include: {
        recipient: true,
        sender: true,
        delivery: true,
        company: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: data.recipientId },
    });

    if (user) {
      await this.sendNotification(notification, user as UserWithPreferences);
    }

    return notification;
  }

  async getForUser(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number }
  ): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        recipientId: userId,
        ...(options?.unreadOnly ? { isRead: false } : {}),
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
        delivery: {
          select: { id: true, title: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const notification = await prisma.notification.findFirst({
      where: { id, recipientId: userId },
    });

    if (!notification) return null;

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return result.count;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const notification = await prisma.notification.findFirst({
      where: { id, recipientId: userId },
    });

    if (!notification) return false;

    await prisma.notification.delete({ where: { id } });
    return true;
  }

  async sendManual(senderId: string, data: ManualNotificationInput): Promise<number> {
    let count = 0;

    for (const recipientId of data.recipientIds) {
      await this.create({
        type: "MANUAL_MESSAGE",
        title: data.title,
        message: data.message,
        link: data.link,
        recipientId,
        senderId,
      });
      count++;
    }

    return count;
  }

  async sendBroadcast(senderId: string, data: BroadcastInput): Promise<number> {
    const where: Record<string, unknown> = {};

    if (data.targetRole && data.targetRole !== "ALL") {
      where.role = data.targetRole;
    }

    if (data.companyId) {
      where.companyId = data.companyId;
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    let count = 0;

    for (const user of users) {
      await this.create({
        type: "BROADCAST",
        title: data.title,
        message: data.message,
        link: data.link,
        recipientId: user.id,
        senderId,
        companyId: data.companyId,
      });
      count++;
    }

    return count;
  }

  async notifyDependencyAdded(
    delivery: DeliveryWithCompany,
    dependency: DeliveryDependency
  ): Promise<void> {
    const clientUsers = delivery.company.users.filter((u) => u.role === "CLIENT");

    for (const user of clientUsers) {
      await this.create({
        type: "DEPENDENCY_ADDED",
        title: "Nova pendência adicionada",
        message: `A entrega "${delivery.title}" precisa de: ${dependency.title}`,
        link: `/cliente/entregas/${delivery.id}`,
        recipientId: user.id,
        deliveryId: delivery.id,
        companyId: delivery.companyId,
      });
    }
  }

  async notifyDependencyProvided(
    dependency: DependencyWithDelivery
  ): Promise<void> {
    const delivery = dependency.delivery;
    const csOwnerUser = delivery.company.csOwner?.user;

    if (csOwnerUser) {
      await this.create({
        type: "DEPENDENCY_PROVIDED",
        title: "Pendência fornecida",
        message: `Cliente forneceu: ${dependency.title} na entrega "${delivery.title}"`,
        link: `/cs/entregas/${delivery.id}`,
        recipientId: csOwnerUser.id,
        deliveryId: delivery.id,
        companyId: delivery.companyId,
      });
    }
  }

  async notifyDeliveryProgress(
    delivery: DeliveryWithCompany,
    oldProgress: number,
    newProgress: number
  ): Promise<void> {
    const clientUsers = delivery.company.users.filter((u) => u.role === "CLIENT");

    for (const user of clientUsers) {
      await this.create({
        type: "DELIVERY_PROGRESS",
        title: "Progresso atualizado",
        message: `A entrega "${delivery.title}" avançou de ${oldProgress}% para ${newProgress}%`,
        link: `/cliente/entregas/${delivery.id}`,
        recipientId: user.id,
        deliveryId: delivery.id,
        companyId: delivery.companyId,
      });
    }
  }

  async notifyDeliveryCompleted(delivery: DeliveryWithCompany): Promise<void> {
    const clientUsers = delivery.company.users.filter((u) => u.role === "CLIENT");

    for (const user of clientUsers) {
      await this.create({
        type: "DELIVERY_COMPLETED",
        title: "Entrega concluída",
        message: `A entrega "${delivery.title}" foi concluída e aguarda sua aprovação`,
        link: `/cliente/entregas/${delivery.id}`,
        recipientId: user.id,
        deliveryId: delivery.id,
        companyId: delivery.companyId,
      });
    }
  }

  async notifyDeliveryApproved(delivery: DeliveryWithCompany): Promise<void> {
    const csOwnerUser = delivery.company.csOwner?.user;

    if (csOwnerUser) {
      await this.create({
        type: "DELIVERY_APPROVED",
        title: "Entrega aprovada",
        message: `Cliente aprovou a entrega "${delivery.title}"`,
        link: `/cs/entregas/${delivery.id}`,
        recipientId: csOwnerUser.id,
        deliveryId: delivery.id,
        companyId: delivery.companyId,
      });
    }
  }

  async notifyClientComment(comment: CommentWithRelations): Promise<void> {
    const delivery = comment.delivery;
    const csOwnerUser = delivery.company.csOwner?.user;

    if (csOwnerUser) {
      const typeLabel = comment.type === "CHANGE_REQUEST" ? "solicitou alterações" : "comentou";

      await this.create({
        type: "CLIENT_COMMENT",
        title: `Cliente ${typeLabel}`,
        message: `${comment.author.name || "Cliente"} ${typeLabel} na entrega "${delivery.title}"`,
        link: `/cs/entregas/${delivery.id}`,
        recipientId: csOwnerUser.id,
        deliveryId: delivery.id,
        companyId: delivery.companyId,
      });
    }
  }

  async notifyCommentResponse(comment: CommentWithRelations): Promise<void> {
    const delivery = comment.delivery;
    const clientUsers = delivery.company.users.filter((u) => u.role === "CLIENT");

    for (const user of clientUsers) {
      await this.create({
        type: "COMMENT_RESPONSE",
        title: "Nova resposta",
        message: `${comment.author.name || "CS"} respondeu na entrega "${delivery.title}"`,
        link: `/cliente/entregas/${delivery.id}`,
        recipientId: user.id,
        deliveryId: delivery.id,
        companyId: delivery.companyId,
      });
    }
  }

  async notifyMeetingScheduled(
    companyId: string,
    meetingTitle: string,
    meetingDate: Date
  ): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { users: true },
    });

    if (!company) return;

    const clientUsers = company.users.filter((u) => u.role === "CLIENT");
    const formattedDate = meetingDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    for (const user of clientUsers) {
      await this.create({
        type: "MEETING_SCHEDULED",
        title: "Nova reunião agendada",
        message: `Reunião "${meetingTitle}" agendada para ${formattedDate}`,
        link: `/cliente/agenda`,
        recipientId: user.id,
        companyId,
      });
    }
  }

  async notifySurveyPending(
    companyId: string,
    surveyId: string,
    surveyType: string
  ): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { users: true },
    });

    if (!company) return;

    const clientUsers = company.users.filter((u) => u.role === "CLIENT");
    const surveyLabel = surveyType === "NPS" ? "NPS" : surveyType === "CSAT" ? "CSAT" : "Adoption Check";

    for (const user of clientUsers) {
      await this.create({
        type: "SURVEY_PENDING",
        title: "Pesquisa pendente",
        message: `Você tem uma pesquisa ${surveyLabel} pendente. Sua opinião é importante!`,
        link: `/cliente/pesquisas`,
        recipientId: user.id,
        companyId,
      });
    }
  }

  async notifySurveyCompleted(
    companyId: string,
    surveyType: string,
    score: number
  ): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        csOwner: {
          include: { user: true },
        },
      },
    });

    if (!company?.csOwner?.user) return;

    const surveyLabel = surveyType === "NPS" ? "NPS" : surveyType === "CSAT" ? "CSAT" : "Adoption Check";

    await this.create({
      type: "SURVEY_COMPLETED",
      title: "Pesquisa respondida",
      message: `${company.name} respondeu a pesquisa ${surveyLabel} com score ${score}`,
      link: `/cs/empresas/${companyId}`,
      recipientId: company.csOwner.user.id,
      companyId,
    });
  }

  async notifyLowScore(
    companyId: string,
    surveyType: string,
    score: number
  ): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        csOwner: {
          include: { user: true },
        },
      },
    });

    if (!company?.csOwner?.user) return;

    const surveyLabel = surveyType === "NPS" ? "NPS" : surveyType === "CSAT" ? "CSAT" : "Adoption Check";

    await this.create({
      type: "LOW_SCORE_ALERT",
      title: "Alerta: Score baixo",
      message: `${company.name} deu score ${score} na pesquisa ${surveyLabel}. Ação recomendada!`,
      link: `/cs/empresas/${companyId}`,
      recipientId: company.csOwner.user.id,
      companyId,
    });
  }

  async notifyDependencyOverdue(
    dependency: DependencyWithDelivery
  ): Promise<void> {
    const delivery = dependency.delivery;
    const clientUsers = delivery.company.users.filter((u) => u.role === "CLIENT");

    for (const user of clientUsers) {
      await this.create({
        type: "DEPENDENCY_OVERDUE",
        title: "Pendência atrasada",
        message: `A pendência "${dependency.title}" da entrega "${delivery.title}" está atrasada`,
        link: `/cliente/entregas/${delivery.id}`,
        recipientId: user.id,
        deliveryId: delivery.id,
        companyId: delivery.companyId,
      });
    }
  }
}

export const notificationService = new NotificationService();
