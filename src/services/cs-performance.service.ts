import { prisma } from "@/lib/db";
import type { PerformanceMetric, PerformancePeriod, Prisma } from "@prisma/client";

export type PerformanceBreakdown = {
  execution: {
    deliveriesOnTime: number;
    deliveriesCompletion: number;
    checklistCompletion: number;
    demandsResolved: number;
    subtotal: number;
  };
  portfolio: {
    healthScoreAvg: number;
    accountsHealthy: number;
    riskReduction: number;
    subtotal: number;
  };
  engagement: {
    activitiesCount: number;
    meetingsCount: number;
    responseTime: number;
    subtotal: number;
  };
  satisfaction: {
    npsAverage: number;
    csatAverage: number;
    subtotal: number;
  };
  total: number;
};

export type CreateGoalInput = {
  csOwnerId?: string;
  metric: PerformanceMetric;
  targetValue: number;
  period: PerformancePeriod;
  startDate: Date;
  endDate: Date;
};

const WEIGHTS = {
  execution: {
    deliveriesOnTime: 15,
    deliveriesCompletion: 10,
    checklistCompletion: 10,
    demandsResolved: 5,
  },
  portfolio: {
    healthScoreAvg: 15,
    accountsHealthy: 10,
    riskReduction: 5,
  },
  engagement: {
    activitiesCount: 8,
    meetingsCount: 7,
    responseTime: 5,
  },
  satisfaction: {
    npsAverage: 5,
    csatAverage: 5,
  },
};

export const csPerformanceService = {
  async calculateMetricsForCS(csOwnerId: string, startDate: Date, endDate: Date) {
    const [
      companies,
      deliveries,
      activities,
      checklistItems,
      demands,
      surveys,
      calendlyBookings,
    ] = await Promise.all([
      prisma.company.findMany({
        where: { csOwnerId },
        select: {
          id: true,
          healthScore: true,
          healthStatus: true,
        },
      }),
      prisma.delivery.findMany({
        where: {
          company: { csOwnerId },
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          status: true,
          dueDate: true,
          updatedAt: true,
        },
      }),
      prisma.teamActivity.findMany({
        where: {
          csOwnerId,
          timestamp: { gte: startDate, lte: endDate },
        },
        select: { id: true, type: true },
      }),
      prisma.checklistItem.findMany({
        where: {
          csOwnerId,
          date: { gte: startDate, lte: endDate },
        },
        select: { id: true, completed: true },
      }),
      prisma.demand.findMany({
        where: {
          assignedToId: csOwnerId,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { id: true, status: true },
      }),
      prisma.survey.findMany({
        where: {
          company: { csOwnerId },
          status: "COMPLETED",
          updatedAt: { gte: startDate, lte: endDate },
        },
        include: { response: true },
      }),
      prisma.calendlyBooking.findMany({
        where: {
          csOwnerId,
          startTime: { gte: startDate, lte: endDate },
          status: { in: ["COMPLETED", "SCHEDULED"] },
        },
        select: { id: true },
      }),
    ]);

    const deliveriesCompleted = deliveries.filter(d => d.status === "COMPLETED");
    const deliveriesOnTime = deliveriesCompleted.filter(d => {
      if (!d.dueDate) return true;
      return d.updatedAt <= d.dueDate;
    });
    const deliveriesDelayed = deliveries.filter(d => d.status === "DELAYED");

    const accountsTotal = companies.length;
    const accountsHealthy = companies.filter(c => c.healthStatus === "HEALTHY").length;
    const accountsAtRisk = companies.filter(
      c => c.healthStatus === "CRITICAL" || c.healthStatus === "RISK"
    ).length;
    const avgHealthScore = accountsTotal > 0
      ? companies.reduce((sum, c) => sum + c.healthScore, 0) / accountsTotal
      : 0;

    const checklistCompleted = checklistItems.filter(c => c.completed).length;
    const checklistTotal = checklistItems.length;

    const demandsCompleted = demands.filter(d => d.status === "COMPLETED").length;
    const demandsTotal = demands.length;

    const activitiesCount = activities.length;
    const meetingsCount = calendlyBookings.length + activities.filter(a => a.type === "MEETING").length;

    const npsResponses = surveys
      .filter(s => s.type === "NPS" && s.response?.npsScore != null)
      .map(s => s.response!.npsScore!);
    const npsAverage = npsResponses.length > 0
      ? npsResponses.reduce((sum, n) => sum + n, 0) / npsResponses.length
      : 0;

    const csatResponses = surveys
      .filter(s => s.type === "CSAT" && s.response?.csatScore != null)
      .map(s => s.response!.csatScore!);
    const csatAverage = csatResponses.length > 0
      ? csatResponses.reduce((sum, n) => sum + n, 0) / csatResponses.length
      : 0;

    return {
      deliveriesTotal: deliveries.length,
      deliveriesOnTime: deliveriesOnTime.length,
      deliveriesDelayed: deliveriesDelayed.length,
      deliveriesCompleted: deliveriesCompleted.length,
      avgHealthScore,
      accountsTotal,
      accountsAtRisk,
      accountsHealthy,
      riskReduction: 0,
      activitiesCount,
      meetingsCount,
      checklistTotal,
      checklistCompleted,
      demandsTotal,
      demandsCompleted,
      npsAverage,
      csatAverage,
    };
  },

  calculateScore(metrics: Awaited<ReturnType<typeof this.calculateMetricsForCS>>): PerformanceBreakdown {
    const normalize = (value: number, max: number) => Math.min(100, (value / max) * 100);
    const percentOrZero = (num: number, denom: number) => denom > 0 ? (num / denom) * 100 : 100;

    const deliveriesOnTimeRate = percentOrZero(metrics.deliveriesOnTime, metrics.deliveriesTotal);
    const deliveriesCompletionRate = percentOrZero(metrics.deliveriesCompleted, metrics.deliveriesTotal);
    const checklistRate = percentOrZero(metrics.checklistCompleted, metrics.checklistTotal);
    const demandsRate = percentOrZero(metrics.demandsCompleted, metrics.demandsTotal);

    const executionScore = {
      deliveriesOnTime: (deliveriesOnTimeRate / 100) * WEIGHTS.execution.deliveriesOnTime,
      deliveriesCompletion: (deliveriesCompletionRate / 100) * WEIGHTS.execution.deliveriesCompletion,
      checklistCompletion: (checklistRate / 100) * WEIGHTS.execution.checklistCompletion,
      demandsResolved: (demandsRate / 100) * WEIGHTS.execution.demandsResolved,
      subtotal: 0,
    };
    executionScore.subtotal =
      executionScore.deliveriesOnTime +
      executionScore.deliveriesCompletion +
      executionScore.checklistCompletion +
      executionScore.demandsResolved;

    const healthScoreNorm = metrics.avgHealthScore;
    const accountsHealthyRate = percentOrZero(metrics.accountsHealthy, metrics.accountsTotal);
    const riskReductionNorm = normalize(metrics.riskReduction, 5);

    const portfolioScore = {
      healthScoreAvg: (healthScoreNorm / 100) * WEIGHTS.portfolio.healthScoreAvg,
      accountsHealthy: (accountsHealthyRate / 100) * WEIGHTS.portfolio.accountsHealthy,
      riskReduction: (riskReductionNorm / 100) * WEIGHTS.portfolio.riskReduction,
      subtotal: 0,
    };
    portfolioScore.subtotal =
      portfolioScore.healthScoreAvg +
      portfolioScore.accountsHealthy +
      portfolioScore.riskReduction;

    const activitiesNorm = normalize(metrics.activitiesCount, 50);
    const meetingsNorm = normalize(metrics.meetingsCount, 20);
    const responseTimeScore = 100;

    const engagementScore = {
      activitiesCount: (activitiesNorm / 100) * WEIGHTS.engagement.activitiesCount,
      meetingsCount: (meetingsNorm / 100) * WEIGHTS.engagement.meetingsCount,
      responseTime: (responseTimeScore / 100) * WEIGHTS.engagement.responseTime,
      subtotal: 0,
    };
    engagementScore.subtotal =
      engagementScore.activitiesCount +
      engagementScore.meetingsCount +
      engagementScore.responseTime;

    const npsNorm = normalize(metrics.npsAverage, 10);
    const csatNorm = normalize(metrics.csatAverage, 5);

    const satisfactionScore = {
      npsAverage: (npsNorm / 100) * WEIGHTS.satisfaction.npsAverage,
      csatAverage: (csatNorm / 100) * WEIGHTS.satisfaction.csatAverage,
      subtotal: 0,
    };
    satisfactionScore.subtotal =
      satisfactionScore.npsAverage +
      satisfactionScore.csatAverage;

    const total =
      executionScore.subtotal +
      portfolioScore.subtotal +
      engagementScore.subtotal +
      satisfactionScore.subtotal;

    return {
      execution: executionScore,
      portfolio: portfolioScore,
      engagement: engagementScore,
      satisfaction: satisfactionScore,
      total,
    };
  },

  async createSnapshot(csOwnerId: string, date: Date) {
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date(date);

    const metrics = await this.calculateMetricsForCS(csOwnerId, startDate, endDate);
    const scores = this.calculateScore(metrics);

    const dateOnly = new Date(date.toISOString().split("T")[0]);

    return prisma.cSPerformanceSnapshot.upsert({
      where: {
        csOwnerId_date: {
          csOwnerId,
          date: dateOnly,
        },
      },
      update: {
        ...metrics,
        scoreExecution: scores.execution.subtotal,
        scorePortfolio: scores.portfolio.subtotal,
        scoreEngagement: scores.engagement.subtotal,
        scoreSatisfaction: scores.satisfaction.subtotal,
        performanceScore: scores.total,
      },
      create: {
        csOwnerId,
        date: dateOnly,
        ...metrics,
        scoreExecution: scores.execution.subtotal,
        scorePortfolio: scores.portfolio.subtotal,
        scoreEngagement: scores.engagement.subtotal,
        scoreSatisfaction: scores.satisfaction.subtotal,
        performanceScore: scores.total,
      },
    });
  },

  async calculateAllSnapshots(date?: Date) {
    const targetDate = date || new Date();
    const csOwners = await prisma.cSOwner.findMany({
      select: { id: true },
    });

    const snapshots = await Promise.all(
      csOwners.map(cs => this.createSnapshot(cs.id, targetDate))
    );

    const sorted = [...snapshots].sort((a, b) => b.performanceScore - a.performanceScore);
    await Promise.all(
      sorted.map((snapshot, index) =>
        prisma.cSPerformanceSnapshot.update({
          where: { id: snapshot.id },
          data: { ranking: index + 1 },
        })
      )
    );

    return sorted;
  },

  async getLatestSnapshot(csOwnerId: string) {
    return prisma.cSPerformanceSnapshot.findFirst({
      where: { csOwnerId },
      orderBy: { date: "desc" },
    });
  },

  async getSnapshotHistory(csOwnerId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return prisma.cSPerformanceSnapshot.findMany({
      where: {
        csOwnerId,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });
  },

  async getRanking(date?: Date, limit?: number) {
    const targetDate = date || new Date();
    const dateOnly = new Date(targetDate.toISOString().split("T")[0]);

    return prisma.cSPerformanceSnapshot.findMany({
      where: { date: dateOnly },
      include: {
        csOwner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
          },
        },
      },
      orderBy: { ranking: "asc" },
      take: limit,
    });
  },

  async getTeamAverages(date?: Date) {
    const targetDate = date || new Date();
    const dateOnly = new Date(targetDate.toISOString().split("T")[0]);

    const snapshots = await prisma.cSPerformanceSnapshot.findMany({
      where: { date: dateOnly },
    });

    if (snapshots.length === 0) return null;

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      performanceScore: avg(snapshots.map(s => s.performanceScore)),
      scoreExecution: avg(snapshots.map(s => s.scoreExecution)),
      scorePortfolio: avg(snapshots.map(s => s.scorePortfolio)),
      scoreEngagement: avg(snapshots.map(s => s.scoreEngagement)),
      scoreSatisfaction: avg(snapshots.map(s => s.scoreSatisfaction)),
      avgHealthScore: avg(snapshots.map(s => s.avgHealthScore)),
      npsAverage: avg(snapshots.map(s => s.npsAverage)),
      csatAverage: avg(snapshots.map(s => s.csatAverage)),
      totalCS: snapshots.length,
    };
  },

  async getAllWithLatestSnapshot() {
    const csOwners = await prisma.cSOwner.findMany({
      include: {
        companies: {
          select: { id: true },
        },
        performanceSnapshots: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    return csOwners.map(cs => ({
      id: cs.id,
      name: cs.name,
      email: cs.email,
      avatar: cs.avatar,
      accountsCount: cs.companies.length,
      latestSnapshot: cs.performanceSnapshots[0] || null,
    }));
  },

  async createGoal(data: CreateGoalInput) {
    return prisma.cSPerformanceGoal.create({
      data: {
        csOwnerId: data.csOwnerId,
        metric: data.metric,
        targetValue: data.targetValue,
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
  },

  async updateGoal(id: string, data: Partial<CreateGoalInput> & { isActive?: boolean }) {
    return prisma.cSPerformanceGoal.update({
      where: { id },
      data,
    });
  },

  async deleteGoal(id: string) {
    return prisma.cSPerformanceGoal.delete({
      where: { id },
    });
  },

  async getGoals(csOwnerId?: string) {
    const where: Prisma.CSPerformanceGoalWhereInput = {
      isActive: true,
    };

    if (csOwnerId) {
      where.OR = [
        { csOwnerId },
        { csOwnerId: null },
      ];
    }

    return prisma.cSPerformanceGoal.findMany({
      where,
      include: {
        csOwner: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getGoalProgress(goalId: string) {
    const goal = await prisma.cSPerformanceGoal.findUnique({
      where: { id: goalId },
      include: {
        csOwner: true,
      },
    });

    if (!goal) return null;

    let currentValue = 0;

    if (goal.csOwnerId) {
      const snapshot = await this.getLatestSnapshot(goal.csOwnerId);
      if (snapshot) {
        currentValue = this.getMetricValue(snapshot, goal.metric);
      }
    } else {
      const averages = await this.getTeamAverages();
      if (averages) {
        currentValue = this.getMetricValueFromAverages(averages, goal.metric);
      }
    }

    const progress = Math.min(100, (currentValue / goal.targetValue) * 100);

    return {
      goal,
      currentValue,
      progress,
      remaining: Math.max(0, goal.targetValue - currentValue),
    };
  },

  getMetricValue(
    snapshot: Awaited<ReturnType<typeof this.getLatestSnapshot>>,
    metric: PerformanceMetric
  ): number {
    if (!snapshot) return 0;

    const metricMap: Record<PerformanceMetric, number> = {
      DELIVERIES_ON_TIME: snapshot.deliveriesTotal > 0
        ? (snapshot.deliveriesOnTime / snapshot.deliveriesTotal) * 100
        : 100,
      DELIVERIES_COMPLETION: snapshot.deliveriesTotal > 0
        ? (snapshot.deliveriesCompleted / snapshot.deliveriesTotal) * 100
        : 100,
      CHECKLIST_COMPLETION: snapshot.checklistTotal > 0
        ? (snapshot.checklistCompleted / snapshot.checklistTotal) * 100
        : 100,
      DEMANDS_RESOLVED: snapshot.demandsTotal > 0
        ? (snapshot.demandsCompleted / snapshot.demandsTotal) * 100
        : 100,
      HEALTH_SCORE_AVG: snapshot.avgHealthScore,
      ACCOUNTS_HEALTHY: snapshot.accountsTotal > 0
        ? (snapshot.accountsHealthy / snapshot.accountsTotal) * 100
        : 100,
      RISK_REDUCTION: snapshot.riskReduction,
      ACTIVITIES_COUNT: snapshot.activitiesCount,
      MEETINGS_COUNT: snapshot.meetingsCount,
      RESPONSE_TIME: 0,
      NPS_AVERAGE: snapshot.npsAverage,
      CSAT_AVERAGE: snapshot.csatAverage,
    };

    return metricMap[metric];
  },

  getMetricValueFromAverages(
    averages: NonNullable<Awaited<ReturnType<typeof this.getTeamAverages>>>,
    metric: PerformanceMetric
  ): number {
    const metricMap: Record<PerformanceMetric, number> = {
      DELIVERIES_ON_TIME: averages.scoreExecution,
      DELIVERIES_COMPLETION: averages.scoreExecution,
      CHECKLIST_COMPLETION: averages.scoreExecution,
      DEMANDS_RESOLVED: averages.scoreExecution,
      HEALTH_SCORE_AVG: averages.avgHealthScore,
      ACCOUNTS_HEALTHY: averages.scorePortfolio,
      RISK_REDUCTION: 0,
      ACTIVITIES_COUNT: averages.scoreEngagement,
      MEETINGS_COUNT: averages.scoreEngagement,
      RESPONSE_TIME: 0,
      NPS_AVERAGE: averages.npsAverage,
      CSAT_AVERAGE: averages.csatAverage,
    };

    return metricMap[metric];
  },

  getTrend(history: { performanceScore: number }[]): "up" | "down" | "stable" {
    if (history.length < 2) return "stable";

    const recent = history.slice(-7);
    const first = recent[0].performanceScore;
    const last = recent[recent.length - 1].performanceScore;
    const diff = last - first;

    if (diff > 2) return "up";
    if (diff < -2) return "down";
    return "stable";
  },
};
