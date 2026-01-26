import { prisma } from "@/lib/db"
import type { HealthScoreBreakdown } from "@/types/survey.types"
import { surveyService } from "./survey.service"

export const healthScoreService = {
  async calculate(companyId: string): Promise<HealthScoreBreakdown> {
    const [company, deliveries, lastNPS, avgCSAT] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        include: {
          contacts: true,
          timelineEvents: {
            where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
            orderBy: { date: "desc" },
          },
        },
      }),
      prisma.delivery.findMany({
        where: { companyId },
        include: { completion: true },
      }),
      surveyService.getLastNPS(companyId),
      surveyService.getAverageCSAT(companyId),
    ])

    if (!company) {
      throw new Error("Empresa não encontrada")
    }

    const execucao = this.calculateExecucao(deliveries, company.timelineEvents)
    const cliente = await this.calculateCliente(company, lastNPS, avgCSAT)
    const expansao = this.calculateExpansao(company)

    const total = execucao.subtotal + cliente.subtotal + expansao.subtotal

    const status = this.getStatus(total)

    return {
      total,
      execucao,
      cliente,
      expansao,
      status,
    }
  },

  calculateExecucao(
    deliveries: Array<{
      id: string
      status: string
      dueDate: Date | null
      completion: { completedAt: Date } | null
    }>,
    timelineEvents: Array<{ type: string }>
  ) {
    let pontualidade = 15
    let higieneOperacional = 10
    let cumprimentoGates = 10
    let gestaoDependencias = 5

    const completedDeliveries = deliveries.filter((d) => d.status === "COMPLETED")
    const delayedDeliveries = deliveries.filter((d) => d.status === "DELAYED")
    const blockedDeliveries = deliveries.filter((d) => d.status === "BLOCKED")

    if (deliveries.length > 0) {
      const delayedRatio = delayedDeliveries.length / deliveries.length
      if (delayedRatio > 0.3) {
        pontualidade = 0
      } else if (delayedRatio > 0.1) {
        pontualidade = 10
      }
    }

    const hasDocumentedMeetings = timelineEvents.some((e) => e.type === "MEETING")
    const hasFeedbackRecords = timelineEvents.some((e) => e.type === "FEEDBACK")

    if (!hasDocumentedMeetings && !hasFeedbackRecords) {
      higieneOperacional = 5
    } else if (!hasDocumentedMeetings || !hasFeedbackRecords) {
      higieneOperacional = 7
    }

    const completionRate = deliveries.length > 0
      ? completedDeliveries.filter((d) => d.completion).length / completedDeliveries.length
      : 1

    if (completionRate < 0.5) {
      cumprimentoGates = 0
    } else if (completionRate < 0.8) {
      cumprimentoGates = 5
    }

    if (blockedDeliveries.length > 2) {
      gestaoDependencias = 0
    } else if (blockedDeliveries.length > 0) {
      gestaoDependencias = 3
    }

    return {
      pontualidade,
      higieneOperacional,
      cumprimentoGates,
      gestaoDependencias,
      subtotal: pontualidade + higieneOperacional + cumprimentoGates + gestaoDependencias,
    }
  },

  async calculateCliente(
    company: {
      contacts: Array<{ engagementLevel: string; isDecisionMaker: boolean }>
      lastInteraction: Date | null
      adoptionScore: number
    },
    lastNPS: Awaited<ReturnType<typeof surveyService.getLastNPS>>,
    avgCSAT: number | null
  ) {
    let engajamento = 15
    let adocao = 15
    let sentimentoAlinhamento = 10

    const decisionMaker = company.contacts.find((c) => c.isDecisionMaker)
    if (!decisionMaker) {
      engajamento = 5
    } else if (decisionMaker.engagementLevel === "LOW" || decisionMaker.engagementLevel === "INACTIVE") {
      engajamento = 8
    } else if (decisionMaker.engagementLevel === "MEDIUM") {
      engajamento = 12
    }

    const daysSinceLastInteraction = company.lastInteraction
      ? Math.floor((Date.now() - new Date(company.lastInteraction).getTime()) / (1000 * 60 * 60 * 24))
      : 30

    if (daysSinceLastInteraction > 14) {
      engajamento = Math.max(0, engajamento - 5)
    }

    if (company.adoptionScore >= 80) {
      adocao = 15
    } else if (company.adoptionScore >= 50) {
      adocao = 8
    } else {
      adocao = Math.max(0, Math.floor(company.adoptionScore / 10))
    }

    const npsScore = lastNPS?.response?.npsScore
    if (npsScore !== undefined && npsScore !== null) {
      if (npsScore >= 9) {
        sentimentoAlinhamento = 10
      } else if (npsScore >= 7) {
        sentimentoAlinhamento = 7
      } else {
        sentimentoAlinhamento = Math.max(0, npsScore - 2)
      }
    } else if (avgCSAT !== null) {
      sentimentoAlinhamento = Math.min(10, Math.round(avgCSAT))
    } else {
      sentimentoAlinhamento = 5
    }

    return {
      engajamento,
      adocao,
      sentimentoAlinhamento,
      subtotal: engajamento + adocao + sentimentoAlinhamento,
    }
  },

  calculateExpansao(company: { expansionScore: number; mrr: number }) {
    let provaValor = 10
    let espacoExpansao = 5
    let momentoCompra = 5

    if (company.expansionScore < 30) {
      provaValor = 3
      espacoExpansao = 1
      momentoCompra = 1
    } else if (company.expansionScore < 60) {
      provaValor = 6
      espacoExpansao = 3
      momentoCompra = 3
    }

    return {
      provaValor,
      espacoExpansao,
      momentoCompra,
      subtotal: provaValor + espacoExpansao + momentoCompra,
    }
  },

  getStatus(score: number): "HEALTHY" | "ATTENTION" | "CRITICAL" {
    if (score >= 80) return "HEALTHY"
    if (score >= 60) return "ATTENTION"
    return "CRITICAL"
  },

  async updateCompanyHealthScore(companyId: string): Promise<HealthScoreBreakdown> {
    const breakdown = await this.calculate(companyId)

    await prisma.company.update({
      where: { id: companyId },
      data: {
        healthScore: breakdown.total,
        healthStatus: breakdown.status === "CRITICAL" ? "RISK" : breakdown.status,
      },
    })

    return breakdown
  },

  async recalculateAll(): Promise<{ updated: number; errors: number }> {
    const companies = await prisma.company.findMany({
      select: { id: true },
    })

    let updated = 0
    let errors = 0

    for (const company of companies) {
      try {
        await this.updateCompanyHealthScore(company.id)
        updated++
      } catch (error) {
        console.error(`Erro ao recalcular Health Score para ${company.id}:`, error)
        errors++
      }
    }

    return { updated, errors }
  },

  async getCompanyMetrics(companyId: string) {
    const [breakdown, lastNPS, avgCSAT, surveys] = await Promise.all([
      this.calculate(companyId),
      surveyService.getLastNPS(companyId),
      surveyService.getAverageCSAT(companyId),
      prisma.survey.findMany({
        where: {
          companyId,
          status: "COMPLETED",
        },
        include: { response: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ])

    const npsHistory = surveys
      .filter((s) => s.type === "NPS" && s.response?.npsScore !== null)
      .map((s) => ({
        date: s.createdAt,
        score: s.response!.npsScore!,
      }))

    const csatHistory = surveys
      .filter((s) => s.type === "CSAT" && s.response?.csatScore !== null)
      .map((s) => ({
        date: s.createdAt,
        score: s.response!.csatScore!,
        deliveryTitle: s.deliveryId ? "Entrega" : undefined,
      }))

    return {
      breakdown,
      currentNPS: lastNPS?.response?.npsScore ?? null,
      avgCSAT,
      npsHistory,
      csatHistory,
    }
  },
}
