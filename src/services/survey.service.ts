import { prisma } from "@/lib/db"
import type { SurveyType, SurveyStatus } from "@prisma/client"
import type { CreateSurveyInput, RespondSurveyInput, CompleteDeliveryInput } from "@/types/survey.types"

export const surveyService = {
  async findById(id: string) {
    return prisma.survey.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        delivery: { select: { id: true, title: true } },
        workshop: { select: { id: true, title: true } },
        response: true,
        requestedBy: { select: { id: true, name: true } },
      },
    })
  },

  async findPendingByCompany(companyId: string) {
    return prisma.survey.findMany({
      where: {
        companyId,
        status: "PENDING",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        delivery: { select: { id: true, title: true } },
        workshop: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  },

  async findByCompany(companyId: string, options?: { type?: SurveyType; status?: SurveyStatus }) {
    return prisma.survey.findMany({
      where: {
        companyId,
        ...(options?.type && { type: options.type }),
        ...(options?.status && { status: options.status }),
      },
      include: {
        delivery: { select: { id: true, title: true } },
        workshop: { select: { id: true, title: true } },
        response: true,
      },
      orderBy: { createdAt: "desc" },
    })
  },

  async create(data: CreateSurveyInput) {
    const expiresAt = data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    return prisma.survey.create({
      data: {
        type: data.type,
        companyId: data.companyId,
        deliveryId: data.deliveryId,
        workshopId: data.workshopId,
        requestedById: data.requestedById,
        aiSuggested: data.aiSuggested || false,
        aiReason: data.aiReason,
        expiresAt,
      },
      include: {
        company: { select: { id: true, name: true } },
        delivery: { select: { id: true, title: true } },
        workshop: { select: { id: true, title: true } },
      },
    })
  },

  async respond(data: RespondSurveyInput) {
    const [response] = await prisma.$transaction([
      prisma.surveyResponse.create({
        data: {
          surveyId: data.surveyId,
          respondentId: data.respondentId,
          npsScore: data.npsScore,
          atendimentoScore: data.atendimentoScore,
          prazosScore: data.prazosScore,
          qualidadeScore: data.qualidadeScore,
          treinamentoScore: data.treinamentoScore,
          clarezaScore: data.clarezaScore,
          csatScore: data.csatScore,
          adoptionScore: data.adoptionScore,
          comment: data.comment,
        },
      }),
      prisma.survey.update({
        where: { id: data.surveyId },
        data: { status: "COMPLETED" },
      }),
    ])

    return response
  },

  async completeDelivery(data: CompleteDeliveryInput) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: data.deliveryId },
      select: { companyId: true, title: true },
    })

    if (!delivery) {
      throw new Error("Entrega não encontrada")
    }

    const [completion, updatedDelivery, csatSurvey, adoptionSurvey] = await prisma.$transaction([
      prisma.deliveryCompletion.create({
        data: {
          deliveryId: data.deliveryId,
          completedById: data.completedById,
          feedback: data.feedback,
        },
      }),
      prisma.delivery.update({
        where: { id: data.deliveryId },
        data: {
          status: "COMPLETED",
          progress: 100,
        },
      }),
      prisma.survey.create({
        data: {
          type: "CSAT",
          companyId: delivery.companyId,
          deliveryId: data.deliveryId,
          requestedById: data.completedById,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.survey.create({
        data: {
          type: "ADOPTION_CHECK",
          companyId: delivery.companyId,
          deliveryId: data.deliveryId,
          requestedById: data.completedById,
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      }),
    ])

    await prisma.timelineEvent.create({
      data: {
        companyId: delivery.companyId,
        type: "DELIVERY",
        title: `Entrega concluída: ${delivery.title}`,
        description: data.feedback,
        date: new Date(),
        sentiment: "POSITIVE",
      },
    })

    return { completion, delivery: updatedDelivery, csatSurvey, adoptionSurvey }
  },

  async hasPendingNPS(companyId: string) {
    const pending = await prisma.survey.findFirst({
      where: {
        companyId,
        type: "NPS",
        status: "PENDING",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })

    return !!pending
  },

  async getLastNPS(companyId: string) {
    return prisma.survey.findFirst({
      where: {
        companyId,
        type: "NPS",
        status: "COMPLETED",
      },
      include: {
        response: true,
      },
      orderBy: { createdAt: "desc" },
    })
  },

  async getAverageNPS(companyId: string, months: number = 3) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const responses = await prisma.surveyResponse.findMany({
      where: {
        survey: {
          companyId,
          type: "NPS",
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
        npsScore: { not: null },
      },
      select: { npsScore: true },
    })

    if (responses.length === 0) return null

    const sum = responses.reduce((acc, r) => acc + (r.npsScore || 0), 0)
    return sum / responses.length
  },

  async getAverageCSAT(companyId: string, months: number = 3) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const responses = await prisma.surveyResponse.findMany({
      where: {
        survey: {
          companyId,
          type: "CSAT",
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
        csatScore: { not: null },
      },
      select: { csatScore: true },
    })

    if (responses.length === 0) return null

    const sum = responses.reduce((acc, r) => acc + (r.csatScore || 0), 0)
    return sum / responses.length
  },

  async expireSurveys() {
    return prisma.survey.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    })
  },
}
