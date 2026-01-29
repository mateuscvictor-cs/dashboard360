import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    const [
      companies,
      squads,
      deliveries,
      timelineDeliveries,
      checklistItemsToday,
      priorityItems,
      alerts,
      aiInsights,
      csOwners,
      weeklyChecklistItems,
    ] = await Promise.all([
      prisma.company.findMany({
        select: {
          id: true,
          name: true,
          healthScore: true,
          healthStatus: true,
          riskScore: true,
          billedAmount: true,
          cashIn: true,
          mrr: true,
          lastInteraction: true,
          contractStart: true,
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
      prisma.delivery.findMany({
        where: {
          dueDate: {
            gte: today,
            lte: twoWeeksFromNow,
          },
        },
        include: {
          company: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: "asc" },
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
          company: { select: { id: true, name: true } },
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
          pendings: {
            where: { status: { in: ["PENDING", "OVERDUE"] } },
          },
          companies: {
            select: { id: true, healthStatus: true },
          },
        },
      }),
      prisma.checklistItem.findMany({
        where: {
          date: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
            lte: endOfDay,
          },
        },
        select: {
          csOwnerId: true,
          completed: true,
          date: true,
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
    const totalBilledAmount = companies.reduce((sum, c) => sum + c.billedAmount, 0);
    const totalCashIn = companies.reduce((sum, c) => sum + c.cashIn, 0);

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
      const pendingItems = cs.pendings.length;
      const atRisk = cs.companies.filter(
        (c) => c.healthStatus === "CRITICAL" || c.healthStatus === "RISK"
      ).length;

      const csWeeklyItems = weeklyChecklistItems.filter(item => item.csOwnerId === cs.id);
      const weeklyCompleted = csWeeklyItems.filter(item => item.completed).length;
      const weeklyTotal = csWeeklyItems.length;
      const weeklyCompletionRate = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0;

      const capacityUsed = cs.companies.length > 0 
        ? Math.min(Math.round((cs.companies.length / 10) * 100), 100) 
        : 0;

      return {
        id: cs.id,
        name: cs.name,
        avatar: cs.avatar,
        companiesCount: cs.companies.length,
        completedToday: completedChecklist,
        pendingTasks: (totalChecklist - completedChecklist) + pendingDemands + pendingItems,
        totalTasks: totalChecklist + pendingDemands + pendingItems,
        accountsAtRisk: atRisk,
        weeklyCompletionRate,
        capacityUsed,
      };
    });

    const formattedTimelineDeliveries = timelineDeliveries.map((d) => ({
      id: d.id,
      title: d.title,
      companyId: d.company.id,
      companyName: d.company.name,
      startDate: d.createdAt.toISOString().split("T")[0],
      dueDate: d.dueDate?.toISOString().split("T")[0] || "",
      status: d.status.toLowerCase(),
      progress: d.progress,
    }));

    const healthHistory = generateHealthHistory(portfolioHealth, 30);
    const mrrHistory = generateMRRHistory(totalMRR, 6);

    const topActions = formattedPriorityItems
      .filter((item) => item.priority === "critical" || item.priority === "high")
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        accountId: item.accountId,
        accountName: item.accountName,
        reason: item.reason,
        reasonType: item.reasonType,
        priority: item.priority,
        action: item.recommendedAction,
      }));

    return NextResponse.json({
      portfolioHealth,
      healthHistory,
      totalMRR,
      mrrHistory,
      totalBilledAmount,
      totalCashIn,
      squads: formattedSquads,
      upcomingDeliveries: formattedDeliveries,
      timelineDeliveries: formattedTimelineDeliveries,
      dailyProgress,
      priorityItems: formattedPriorityItems,
      topActions,
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

function generateHealthHistory(currentHealth: { healthy: number; attention: number; risk: number; critical: number }, days: number) {
  const history = [];
  const total = currentHealth.healthy + currentHealth.attention + currentHealth.risk + currentHealth.critical;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const variance = Math.sin(i * 0.3) * 0.1;
    const healthyRatio = total > 0 ? (currentHealth.healthy / total) : 0.7;
    
    history.push({
      date: date.toISOString().split("T")[0],
      healthy: Math.round(total * Math.max(0.3, Math.min(0.9, healthyRatio + variance))),
      attention: Math.round(total * Math.max(0.05, (currentHealth.attention / total) + variance * 0.5)),
      risk: Math.round(total * Math.max(0.02, (currentHealth.risk / total) - variance * 0.3)),
      critical: Math.round(total * Math.max(0, (currentHealth.critical / total) - variance * 0.2)),
    });
  }
  
  history[history.length - 1] = {
    date: new Date().toISOString().split("T")[0],
    ...currentHealth,
  };
  
  return history;
}

function generateMRRHistory(currentMRR: number, months: number) {
  const history = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    const growthFactor = 1 - (i * 0.03);
    const variance = (Math.random() - 0.5) * 0.05;
    const mrr = Math.round(currentMRR * (growthFactor + variance));
    
    history.push({
      month: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      year: date.getFullYear(),
      mrr: Math.max(0, mrr),
    });
  }
  
  history[history.length - 1] = {
    month: new Date().toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    year: new Date().getFullYear(),
    mrr: currentMRR,
  };
  
  return history;
}
