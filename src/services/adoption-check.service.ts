import { prisma } from "@/lib/db"

export const adoptionCheckService = {
  async getPendingChecks(companyId?: string) {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    return prisma.survey.findMany({
      where: {
        type: "ADOPTION_CHECK",
        status: "PENDING",
        ...(companyId && { companyId }),
        createdAt: { lte: sevenDaysAgo },
      },
      include: {
        company: { select: { id: true, name: true } },
        delivery: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "asc" },
    })
  },

  async getReadyForResponse(companyId: string) {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    return prisma.survey.findMany({
      where: {
        type: "ADOPTION_CHECK",
        status: "PENDING",
        companyId,
        createdAt: { lte: sevenDaysAgo },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      include: {
        delivery: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "asc" },
    })
  },

  async processAdoptionScore(surveyId: string, score: number) {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        delivery: true,
        company: true,
      },
    })

    if (!survey || survey.type !== "ADOPTION_CHECK") {
      throw new Error("Survey de adoção não encontrada")
    }

    const adoptionLevel = this.getAdoptionLevel(score)

    if (survey.delivery && score >= 7) {
      await prisma.timelineEvent.create({
        data: {
          companyId: survey.companyId,
          type: "MILESTONE",
          title: `Adoção confirmada: ${survey.delivery.title}`,
          description: `Funcionalidade em uso na rotina (${score}/10)`,
          date: new Date(),
          sentiment: "POSITIVE",
        },
      })
    }

    if (score <= 4 && survey.delivery) {
      await prisma.alert.create({
        data: {
          companyId: survey.companyId,
          type: "ACTIVITY_DROP",
          severity: score <= 2 ? "URGENT" : "HIGH",
          title: `Baixa adoção: ${survey.delivery.title}`,
          description: `Cliente avaliou adoção em ${score}/10. Requer acompanhamento.`,
          action: "Agendar call para entender barreiras de adoção",
        },
      })
    }

    return { adoptionLevel, score }
  },

  getAdoptionLevel(score: number): "FULL" | "PARTIAL" | "LOW" | "NONE" {
    if (score >= 8) return "FULL"
    if (score >= 5) return "PARTIAL"
    if (score >= 2) return "LOW"
    return "NONE"
  },

  async getAdoptionMetrics(companyId: string) {
    const responses = await prisma.surveyResponse.findMany({
      where: {
        survey: {
          companyId,
          type: "ADOPTION_CHECK",
          status: "COMPLETED",
        },
        adoptionScore: { not: null },
      },
      include: {
        survey: {
          include: {
            delivery: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    if (responses.length === 0) {
      return {
        averageScore: null,
        totalChecks: 0,
        fullAdoption: 0,
        partialAdoption: 0,
        lowAdoption: 0,
        history: [],
      }
    }

    const scores = responses.map((r) => r.adoptionScore!)
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length

    return {
      averageScore: Math.round(averageScore * 10) / 10,
      totalChecks: responses.length,
      fullAdoption: scores.filter((s) => s >= 8).length,
      partialAdoption: scores.filter((s) => s >= 5 && s < 8).length,
      lowAdoption: scores.filter((s) => s < 5).length,
      history: responses.map((r) => ({
        score: r.adoptionScore,
        deliveryTitle: r.survey.delivery?.title,
        date: r.createdAt,
      })),
    }
  },

  async updateCompanyAdoptionScore(companyId: string) {
    const metrics = await this.getAdoptionMetrics(companyId)

    if (metrics.averageScore !== null) {
      const adoptionScore = Math.round(metrics.averageScore * 10)

      await prisma.company.update({
        where: { id: companyId },
        data: { adoptionScore },
      })

      return adoptionScore
    }

    return null
  },
}
