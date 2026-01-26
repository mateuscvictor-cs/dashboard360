import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      companies,
      squads,
      deliveries,
      checklistItemsToday,
      priorityItems,
      alerts,
      aiInsights,
      csOwners,
    ] = await Promise.all([
      prisma.company.findMany({
        select: {
          id: true,
          name: true,
          healthScore: true,
          healthStatus: true,
          riskScore: true,
          mrr: true,
          lastInteraction: true,
          csOwner: { select: { name: true } },
        },
      }),
      prisma.squad.findMany({
        include: {
          members: {
            include: {
              csOwner: { select: { name: true, avatar: true } },
            },
          },
          companies: {
            select: { id: true },
          },
        },
      }),
      prisma.delivery.findMany({
        where: {
          status: { in: ["PENDING", "IN_PROGRESS", "BLOCKED", "DELAYED"] },
        },
        include: {
          company: { select: { name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
      prisma.checklistItem.findMany({
        where: {
          date: {
            gte: today,
            lte: endOfDay,
          },
        },
        include: {
          csOwner: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.priorityItem.findMany({
        include: {
          company: { select: { name: true } },
        },
        orderBy: { priority: "asc" },
        take: 10,
      }),
      prisma.alert.findMany({
        where: { isRead: false },
        include: {
          company: { select: { name: true } },
        },
        orderBy: { detectedAt: "desc" },
        take: 10,
      }),
      prisma.aIInsight.findMany({
        include: {
          company: { select: { name: true } },
          csOwner: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.cSOwner.findMany({
        include: {
          checklistItems: {
            where: {
              date: {
                gte: today,
                lte: endOfDay,
              },
            },
          },
          assignedDemands: {
            where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
          },
          companies: {
            select: { id: true, healthStatus: true },
          },
        },
      }),
    ]);

    const portfolioHealth = {
      total: companies.length,
      healthy: companies.filter((c) => c.healthStatus === "HEALTHY").length,
      attention: companies.filter((c) => c.healthStatus === "ATTENTION").length,
      risk: companies.filter((c) => c.healthStatus === "RISK").length,
      critical: companies.filter((c) => c.healthStatus === "CRITICAL").length,
      trend: "up" as const,
      trendValue: 0,
    };

    const totalMRR = companies.reduce((sum, c) => sum + c.mrr, 0);

    const formattedSquads = squads.map((squad) => ({
      id: squad.id,
      name: squad.name,
      members: squad.members.map((m) => m.csOwner.name),
      capacity: squad.capacity,
      currentLoad: squad.currentLoad,
      accountsCount: squad.companies.length,
      blockedItems: squad.blockedItems,
    }));

    const formattedDeliveries = deliveries.map((d) => ({
      id: d.id,
      account: d.company.name,
      title: d.title,
      dueDate: d.dueDate?.toISOString().split("T")[0] || "",
      status: d.status.toLowerCase(),
      risk: d.impact === "URGENT" || d.impact === "HIGH" ? "high" : d.impact === "MEDIUM" ? "medium" : "low",
    }));

    const completedToday = checklistItemsToday.filter((c) => c.completed);
    const dailyProgress = {
      completed: completedToday.length,
      total: checklistItemsToday.length,
      completedItems: completedToday.slice(0, 5).map((item) => ({
        id: item.id,
        accountName: "",
        action: item.title,
        completedAt: item.updatedAt.toISOString(),
        completedBy: item.csOwner.name,
      })),
    };

    const priorityMap: Record<string, string> = {
      URGENT: "critical",
      HIGH: "high",
      MEDIUM: "medium",
      LOW: "low",
    };

    const formattedPriorityItems = priorityItems.map((item) => ({
      id: item.id,
      accountId: item.companyId,
      accountName: item.company.name,
      reason: item.reason,
      reasonType: item.reasonType.toLowerCase(),
      priority: priorityMap[item.priority] || "medium",
      recommendedAction: item.recommendedAction || "",
      impact: item.impact || "",
      effort: priorityMap[item.effort] || "medium",
      dueDate: item.dueDate?.toISOString().split("T")[0],
    }));

    const severityMap: Record<string, string> = {
      URGENT: "critical",
      HIGH: "high",
      MEDIUM: "medium",
      LOW: "low",
    };

    const formattedAlerts = alerts.map((alert) => ({
      id: alert.id,
      type: alert.type.toLowerCase(),
      severity: severityMap[alert.severity] || "medium",
      title: alert.title,
      description: alert.description || "",
      accountId: alert.companyId,
      accountName: alert.company.name,
      detectedAt: alert.detectedAt.toISOString(),
      action: alert.action || "",
    }));

    const confidenceMap: Record<string, string> = {
      URGENT: "high",
      HIGH: "high",
      MEDIUM: "medium",
      LOW: "low",
    };

    const insightTypeMap: Record<string, string> = {
      RECOMMENDATION: "recommendation",
      ALERT: "alert",
      OPPORTUNITY: "opportunity",
      TREND: "trend",
      WARNING: "warning",
    };

    const insightStatusMap: Record<string, string> = {
      ACTIVE: "active",
      READ: "read",
      ACTIONED: "actioned",
      DISMISSED: "dismissed",
      EXPIRED: "expired",
    };

    const formattedInsights = aiInsights.map((insight) => ({
      id: insight.id,
      accountId: insight.companyId || undefined,
      accountName: insight.company?.name,
      csOwnerId: insight.csOwnerId || undefined,
      csOwnerName: insight.csOwner?.name,
      insight: insight.insight,
      evidence: insight.evidence,
      source: insight.source || "",
      confidence: confidenceMap[insight.confidence] || "medium",
      type: insightTypeMap[insight.type] || "recommendation",
      status: insightStatusMap[insight.status] || "active",
      actionSuggested: insight.actionSuggested || "",
      expectedOutcome: insight.expectedOutcome || "",
      riskIfIgnored: insight.riskIfIgnored || "",
      createdAt: insight.createdAt.toISOString(),
    }));

    const csMetrics = csOwners.map((cs) => {
      const completedChecklist = cs.checklistItems.filter((c) => c.completed).length;
      const totalChecklist = cs.checklistItems.length;
      const pendingDemands = cs.assignedDemands.length;
      const atRisk = cs.companies.filter(
        (c) => c.healthStatus === "CRITICAL" || c.healthStatus === "RISK"
      ).length;

      return {
        id: cs.id,
        name: cs.name,
        avatar: cs.avatar,
        companiesCount: cs.companies.length,
        completedToday: completedChecklist,
        pendingTasks: (totalChecklist - completedChecklist) + pendingDemands,
        totalTasks: totalChecklist + pendingDemands,
        accountsAtRisk: atRisk,
      };
    });

    return NextResponse.json({
      portfolioHealth,
      totalMRR,
      squads: formattedSquads,
      upcomingDeliveries: formattedDeliveries,
      dailyProgress,
      priorityItems: formattedPriorityItems,
      alerts: formattedAlerts,
      aiInsights: formattedInsights,
      csMetrics,
      user: {
        name: session.user.name,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar dashboard 360:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
