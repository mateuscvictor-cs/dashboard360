import { prisma } from "@/lib/db"
import { healthScoreService } from "./health-score.service"
import { surveyService } from "./survey.service"

export const recoveryService = {
  async checkTriggers(companyId: string): Promise<{
    needsRecovery: boolean
    reasons: string[]
  }> {
    const reasons: string[] = []

    const [company, lastNPS] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: { healthScore: true, healthStatus: true, name: true },
      }),
      surveyService.getLastNPS(companyId),
    ])

    if (!company) {
      return { needsRecovery: false, reasons: [] }
    }

    const npsScore = lastNPS?.response?.npsScore
    if (npsScore !== undefined && npsScore !== null && npsScore <= 6) {
      reasons.push(`NPS baixo (${npsScore}/10)`)
    }

    if (company.healthScore < 60) {
      reasons.push(`Health Score crítico (${company.healthScore}/100)`)
    }

    return {
      needsRecovery: reasons.length > 0,
      reasons,
    }
  },

  async triggerRecovery(companyId: string, reasons: string[]): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, csOwnerId: true },
    })

    if (!company) return

    const existingAlert = await prisma.alert.findFirst({
      where: {
        companyId,
        type: "CHURN_RISK",
        isRead: false,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })

    if (existingAlert) return

    await prisma.$transaction([
      prisma.alert.create({
        data: {
          companyId,
          type: "CHURN_RISK",
          severity: "URGENT",
          title: `Recovery necessário: ${company.name}`,
          description: `Gatilhos disparados: ${reasons.join(", ")}. Ação imediata requerida em até 24h úteis.`,
          action: "Criar plano de ação de 30 dias",
        },
      }),
      prisma.timelineEvent.create({
        data: {
          companyId,
          type: "INCIDENT",
          title: "Processo de Recovery iniciado",
          description: `Motivos: ${reasons.join(", ")}`,
          date: new Date(),
          sentiment: "NEGATIVE",
        },
      }),
      prisma.company.update({
        where: { id: companyId },
        data: {
          healthStatus: "CRITICAL",
        },
      }),
    ])
  },

  async processCompany(companyId: string): Promise<{
    companyId: string
    healthScore: number
    needsRecovery: boolean
    reasons: string[]
  }> {
    const breakdown = await healthScoreService.updateCompanyHealthScore(companyId)
    const { needsRecovery, reasons } = await this.checkTriggers(companyId)

    if (needsRecovery) {
      await this.triggerRecovery(companyId, reasons)
    }

    return {
      companyId,
      healthScore: breakdown.total,
      needsRecovery,
      reasons,
    }
  },

  async processAll(): Promise<{
    processed: number
    recoveryTriggered: number
    errors: number
  }> {
    const companies = await prisma.company.findMany({
      select: { id: true },
    })

    let processed = 0
    let recoveryTriggered = 0
    let errors = 0

    for (const company of companies) {
      try {
        const result = await this.processCompany(company.id)
        processed++
        if (result.needsRecovery) {
          recoveryTriggered++
        }
      } catch (error) {
        console.error(`Erro ao processar ${company.id}:`, error)
        errors++
      }
    }

    return { processed, recoveryTriggered, errors }
  },

  async getRecoveryStatus(companyId: string) {
    const recentAlerts = await prisma.alert.findMany({
      where: {
        companyId,
        type: "CHURN_RISK",
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    })

    const isInRecovery = recentAlerts.some((a) => !a.isRead)

    return {
      isInRecovery,
      alerts: recentAlerts,
      startedAt: recentAlerts[0]?.createdAt,
    }
  },
}
