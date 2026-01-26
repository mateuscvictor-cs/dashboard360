import { prisma } from "@/lib/db"
import { surveyService } from "./survey.service"

export interface NPSSuggestion {
  shouldSend: boolean
  reason: string
  confidence: "HIGH" | "MEDIUM" | "LOW"
  factors: {
    daysSinceLastNPS: number
    recentDeliveriesCompleted: number
    healthScoreTrend: "UP" | "STABLE" | "DOWN"
    engagementLevel: string
  }
}

export const npsSuggestionService = {
  async analyze(companyId: string): Promise<NPSSuggestion> {
    const [company, lastNPS, recentDeliveries, previousHealthScores] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        include: {
          contacts: { where: { isDecisionMaker: true }, take: 1 },
          timelineEvents: {
            where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
            orderBy: { date: "desc" },
          },
        },
      }),
      surveyService.getLastNPS(companyId),
      prisma.delivery.findMany({
        where: {
          companyId,
          status: "COMPLETED",
          updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.timelineEvent.findMany({
        where: {
          companyId,
          type: "MILESTONE",
          date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { date: "desc" },
        take: 3,
      }),
    ])

    if (!company) {
      return {
        shouldSend: false,
        reason: "Empresa não encontrada",
        confidence: "LOW",
        factors: {
          daysSinceLastNPS: 0,
          recentDeliveriesCompleted: 0,
          healthScoreTrend: "STABLE",
          engagementLevel: "UNKNOWN",
        },
      }
    }

    const daysSinceLastNPS = lastNPS
      ? Math.floor((Date.now() - new Date(lastNPS.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    const hasPendingNPS = await surveyService.hasPendingNPS(companyId)

    const recentDeliveriesCompleted = recentDeliveries.length

    const healthScoreTrend = this.calculateHealthTrend(company.healthScore, previousHealthScores)

    const engagementLevel = company.contacts[0]?.engagementLevel || "UNKNOWN"

    const positiveInteractions = company.timelineEvents.filter(
      (e) => e.sentiment === "POSITIVE"
    ).length
    const negativeInteractions = company.timelineEvents.filter(
      (e) => e.sentiment === "NEGATIVE"
    ).length

    const factors = {
      daysSinceLastNPS,
      recentDeliveriesCompleted,
      healthScoreTrend,
      engagementLevel,
    }

    if (hasPendingNPS) {
      return {
        shouldSend: false,
        reason: "Já existe uma pesquisa NPS pendente para este cliente",
        confidence: "HIGH",
        factors,
      }
    }

    if (daysSinceLastNPS < 30) {
      return {
        shouldSend: false,
        reason: `NPS enviado recentemente (${daysSinceLastNPS} dias atrás)`,
        confidence: "HIGH",
        factors,
      }
    }

    let score = 0
    const reasons: string[] = []

    if (daysSinceLastNPS >= 30) {
      score += 2
      reasons.push(`${daysSinceLastNPS} dias desde o último NPS`)
    }

    if (recentDeliveriesCompleted >= 2) {
      score += 3
      reasons.push(`${recentDeliveriesCompleted} entregas concluídas recentemente`)
    }

    if (healthScoreTrend === "UP") {
      score += 2
      reasons.push("Health Score em tendência de alta")
    }

    if (engagementLevel === "HIGH") {
      score += 2
      reasons.push("Alto engajamento do decisor")
    }

    if (positiveInteractions > negativeInteractions && positiveInteractions >= 3) {
      score += 2
      reasons.push("Interações recentes positivas")
    }

    if (company.healthScore >= 70) {
      score += 1
      reasons.push("Cliente saudável")
    }

    const shouldSend = score >= 5
    const confidence = score >= 7 ? "HIGH" : score >= 5 ? "MEDIUM" : "LOW"

    return {
      shouldSend,
      reason: shouldSend
        ? `Momento ideal para NPS: ${reasons.join("; ")}`
        : `Aguarde momento mais oportuno (score: ${score}/10)`,
      confidence,
      factors,
    }
  },

  calculateHealthTrend(
    currentScore: number,
    previousEvents: Array<{ date: Date }>
  ): "UP" | "STABLE" | "DOWN" {
    if (previousEvents.length < 2) return "STABLE"
    if (currentScore >= 80) return "UP"
    if (currentScore <= 50) return "DOWN"
    return "STABLE"
  },

  async analyzePortfolio(csOwnerId: string): Promise<Array<{
    companyId: string
    companyName: string
    suggestion: NPSSuggestion
  }>> {
    const companies = await prisma.company.findMany({
      where: { csOwnerId },
      select: { id: true, name: true },
    })

    const results = await Promise.all(
      companies.map(async (company) => ({
        companyId: company.id,
        companyName: company.name,
        suggestion: await this.analyze(company.id),
      }))
    )

    return results
      .filter((r) => r.suggestion.shouldSend)
      .sort((a, b) => {
        const confidenceOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
        return confidenceOrder[b.suggestion.confidence] - confidenceOrder[a.suggestion.confidence]
      })
  },

  async createNPSSuggestionInsight(companyId: string) {
    const suggestion = await this.analyze(companyId)

    if (!suggestion.shouldSend) {
      return null
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    })

    if (!company) return null

    const existingInsight = await prisma.aIInsight.findFirst({
      where: {
        companyId,
        insight: { contains: "NPS" },
        status: { in: ["ACTIVE", "READ"] },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    })

    if (existingInsight) return existingInsight

    return prisma.aIInsight.create({
      data: {
        companyId,
        insight: `Momento ideal para enviar NPS para ${company.name}`,
        evidence: [
          `${suggestion.factors.daysSinceLastNPS} dias desde último NPS`,
          `${suggestion.factors.recentDeliveriesCompleted} entregas concluídas recentemente`,
          `Tendência de Health Score: ${suggestion.factors.healthScoreTrend}`,
          `Engajamento do decisor: ${suggestion.factors.engagementLevel}`,
        ],
        actionSuggested: "Enviar pesquisa NPS agora",
        expectedOutcome: "Capturar feedback positivo e fortalecer relacionamento",
        riskIfIgnored: "Perder momento ideal de coleta de feedback",
        confidence: suggestion.confidence,
        type: "OPPORTUNITY",
        scope: "COMPANY",
        source: "NPS Suggestion Engine",
      },
    })
  },
}
