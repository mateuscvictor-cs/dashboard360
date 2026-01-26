import { prisma } from "@/lib/db";
import type { InsightScope, InsightStatus, InsightType } from "@prisma/client";

export type InsightFilters = {
  scope?: InsightScope;
  status?: InsightStatus;
  type?: InsightType;
  companyId?: string;
  csOwnerId?: string;
  squadId?: string;
  limit?: number;
  offset?: number;
};

const confidenceMap: Record<string, string> = {
  URGENT: "high",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

const typeMap: Record<string, string> = {
  RECOMMENDATION: "recommendation",
  ALERT: "alert",
  OPPORTUNITY: "opportunity",
  TREND: "trend",
  WARNING: "warning",
};

const statusMap: Record<string, string> = {
  ACTIVE: "active",
  READ: "read",
  ACTIONED: "actioned",
  DISMISSED: "dismissed",
  EXPIRED: "expired",
};

const scopeMap: Record<string, string> = {
  COMPANY: "company",
  CS_OWNER: "cs_owner",
  PORTFOLIO: "portfolio",
  SQUAD: "squad",
};

export function formatInsight(insight: {
  id: string;
  insight: string;
  evidence: string[];
  source: string | null;
  confidence: string;
  actionSuggested: string | null;
  expectedOutcome: string | null;
  riskIfIgnored: string | null;
  type: string;
  status: string;
  scope: string;
  feedback: string | null;
  actionTaken: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  companyId: string | null;
  csOwnerId: string | null;
  squadId: string | null;
  company?: { name: string } | null;
  csOwner?: { name: string } | null;
  squad?: { name: string } | null;
}) {
  return {
    id: insight.id,
    insight: insight.insight,
    evidence: insight.evidence,
    source: insight.source || "",
    confidence: confidenceMap[insight.confidence] || "medium",
    actionSuggested: insight.actionSuggested || "",
    expectedOutcome: insight.expectedOutcome || "",
    riskIfIgnored: insight.riskIfIgnored || "",
    type: typeMap[insight.type] || "recommendation",
    status: statusMap[insight.status] || "active",
    scope: scopeMap[insight.scope] || "company",
    feedback: insight.feedback,
    actionTaken: insight.actionTaken,
    expiresAt: insight.expiresAt?.toISOString(),
    createdAt: insight.createdAt.toISOString(),
    accountId: insight.companyId,
    accountName: insight.company?.name,
    csOwnerId: insight.csOwnerId,
    csOwnerName: insight.csOwner?.name,
    squadId: insight.squadId,
    squadName: insight.squad?.name,
  };
}

export async function getInsights(filters: InsightFilters = {}) {
  const where: Record<string, unknown> = {};

  if (filters.scope) where.scope = filters.scope;
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.companyId) where.companyId = filters.companyId;
  if (filters.csOwnerId) where.csOwnerId = filters.csOwnerId;
  if (filters.squadId) where.squadId = filters.squadId;

  const insights = await prisma.aIInsight.findMany({
    where,
    include: {
      company: { select: { name: true } },
      csOwner: { select: { name: true } },
      squad: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit || 50,
    skip: filters.offset || 0,
  });

  return insights.map(formatInsight);
}

export async function getInsightById(id: string) {
  const insight = await prisma.aIInsight.findUnique({
    where: { id },
    include: {
      company: { select: { name: true } },
      csOwner: { select: { name: true } },
      squad: { select: { name: true } },
    },
  });

  if (!insight) return null;
  return formatInsight(insight);
}

export async function updateInsight(
  id: string,
  data: {
    status?: InsightStatus;
    feedback?: string;
    actionTaken?: boolean;
  }
) {
  const insight = await prisma.aIInsight.update({
    where: { id },
    data,
    include: {
      company: { select: { name: true } },
      csOwner: { select: { name: true } },
      squad: { select: { name: true } },
    },
  });

  return formatInsight(insight);
}

export async function deleteInsight(id: string) {
  await prisma.aIInsight.delete({
    where: { id },
  });
}

export async function markAsRead(id: string) {
  return updateInsight(id, { status: "READ" });
}

export async function markAsActioned(id: string) {
  return updateInsight(id, { status: "ACTIONED", actionTaken: true });
}

export async function dismissInsight(id: string) {
  return updateInsight(id, { status: "DISMISSED" });
}

export async function addFeedback(id: string, feedback: "positive" | "negative") {
  return updateInsight(id, { feedback });
}

export async function getActiveInsightsCount() {
  return prisma.aIInsight.count({
    where: { status: "ACTIVE" },
  });
}

export async function getInsightStats() {
  const [total, byStatus, byType, byScope] = await Promise.all([
    prisma.aIInsight.count(),
    prisma.aIInsight.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.aIInsight.groupBy({
      by: ["type"],
      _count: { id: true },
    }),
    prisma.aIInsight.groupBy({
      by: ["scope"],
      _count: { id: true },
    }),
  ]);

  return {
    total,
    byStatus: byStatus.reduce((acc, item) => {
      acc[statusMap[item.status] || item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>),
    byType: byType.reduce((acc, item) => {
      acc[typeMap[item.type] || item.type] = item._count.id;
      return acc;
    }, {} as Record<string, number>),
    byScope: byScope.reduce((acc, item) => {
      acc[scopeMap[item.scope] || item.scope] = item._count.id;
      return acc;
    }, {} as Record<string, number>),
  };
}

export async function cleanupExpiredInsights() {
  const result = await prisma.aIInsight.updateMany({
    where: {
      expiresAt: { lt: new Date() },
      status: { not: "EXPIRED" },
    },
    data: { status: "EXPIRED" },
  });

  return result.count;
}
