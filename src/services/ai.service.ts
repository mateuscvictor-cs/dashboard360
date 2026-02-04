import OpenAI from "openai";
import { prisma } from "@/lib/db";
import {
  SYSTEM_PROMPT,
  companyAnalysisPrompt,
  csOwnerAnalysisPrompt,
  portfolioAnalysisPrompt,
} from "@/lib/prompts/insights";
import type { InsightType, InsightScope, Priority } from "@prisma/client";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_APIKEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_APIKEY não configurada");
  }
  return new OpenAI({ apiKey });
}

type GeneratedInsight = {
  insight: string;
  evidence: string[];
  actionSuggested: string;
  expectedOutcome: string;
  riskIfIgnored: string;
  confidence: "high" | "medium" | "low";
  type: "recommendation" | "alert" | "opportunity" | "trend" | "warning";
};

type GenerateResponse = {
  insights: GeneratedInsight[];
};

const confidenceMap: Record<string, Priority> = {
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

const typeMap: Record<string, InsightType> = {
  recommendation: "RECOMMENDATION",
  alert: "ALERT",
  opportunity: "OPPORTUNITY",
  trend: "TREND",
  warning: "WARNING",
};

async function callOpenAI(prompt: string): Promise<GenerateResponse | null> {
  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content) as GenerateResponse;
  } catch (error) {
    console.error("Erro ao chamar OpenAI:", error);
    return null;
  }
}

export async function generateCompanyInsights(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      deliveries: {
        where: { status: { in: ["PENDING", "IN_PROGRESS", "BLOCKED", "DELAYED"] } },
        take: 10,
      },
      contacts: { take: 10 },
    },
  });

  if (!company) {
    throw new Error("Empresa não encontrada");
  }

  const prompt = companyAnalysisPrompt({
    name: company.name,
    healthScore: company.healthScore,
    healthStatus: company.healthStatus,
    mrr: company.mrr,
    lastInteraction: company.lastInteraction?.toISOString() || null,
    segment: company.segment || undefined,
    plan: company.plan || undefined,
    deliveries: company.deliveries.map((d) => ({
      title: d.title,
      status: d.status,
      dueDate: d.dueDate?.toISOString() || null,
    })),
    contacts: company.contacts.map((c) => ({
      name: c.name,
      engagementLevel: c.engagementLevel,
      lastContact: c.lastContact?.toISOString() || null,
    })),
  });

  const response = await callOpenAI(prompt);
  if (!response?.insights) return [];

  const createdInsights = await Promise.all(
    response.insights.map((insight) =>
      prisma.aIInsight.create({
        data: {
          insight: insight.insight,
          evidence: insight.evidence,
          actionSuggested: insight.actionSuggested,
          expectedOutcome: insight.expectedOutcome,
          riskIfIgnored: insight.riskIfIgnored,
          confidence: confidenceMap[insight.confidence] || "MEDIUM",
          type: typeMap[insight.type] || "RECOMMENDATION",
          scope: "COMPANY" as InsightScope,
          source: "OpenAI GPT-4o-mini",
          companyId: company.id,
        },
        include: {
          company: { select: { name: true } },
        },
      })
    )
  );

  return createdInsights;
}

export async function generateCSInsights(csOwnerId: string) {
  const csOwner = await prisma.cSOwner.findUnique({
    where: { id: csOwnerId },
    include: {
      companies: {
        select: { id: true, name: true, healthStatus: true, healthScore: true },
      },
      checklistItems: {
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      },
      assignedDemands: {
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      },
    },
  });

  if (!csOwner) {
    throw new Error("CS Owner não encontrado");
  }

  const completedToday = csOwner.checklistItems.filter((c) => c.completed).length;
  const pendingTasks = csOwner.checklistItems.filter((c) => !c.completed).length + csOwner.assignedDemands.length;
  const accountsAtRisk = csOwner.companies.filter(
    (c) => c.healthStatus === "CRITICAL" || c.healthStatus === "RISK"
  ).length;

  const prompt = csOwnerAnalysisPrompt({
    name: csOwner.name,
    companiesCount: csOwner.companies.length,
    completedToday,
    pendingTasks,
    accountsAtRisk,
    companies: csOwner.companies.map((c) => ({
      name: c.name,
      healthStatus: c.healthStatus,
      healthScore: c.healthScore,
    })),
  });

  const response = await callOpenAI(prompt);
  if (!response?.insights) return [];

  const createdInsights = await Promise.all(
    response.insights.map((insight) =>
      prisma.aIInsight.create({
        data: {
          insight: insight.insight,
          evidence: insight.evidence,
          actionSuggested: insight.actionSuggested,
          expectedOutcome: insight.expectedOutcome,
          riskIfIgnored: insight.riskIfIgnored,
          confidence: confidenceMap[insight.confidence] || "MEDIUM",
          type: typeMap[insight.type] || "RECOMMENDATION",
          scope: "CS_OWNER" as InsightScope,
          source: "OpenAI GPT-4o-mini",
          csOwnerId: csOwner.id,
        },
        include: {
          csOwner: { select: { name: true } },
        },
      })
    )
  );

  return createdInsights;
}

export async function generatePortfolioInsights() {
  const companies = await prisma.company.findMany({
    where: {
      healthStatus: { in: ["CRITICAL", "RISK", "ATTENTION"] },
    },
    include: {
      deliveries: {
        where: { status: { in: ["PENDING", "IN_PROGRESS", "BLOCKED", "DELAYED"] } },
        take: 5,
      },
      contacts: { take: 5 },
      csOwner: { select: { id: true, name: true } },
    },
    orderBy: { healthScore: "asc" },
    take: 3,
  });

  if (companies.length === 0) {
    const anyCompanies = await prisma.company.findMany({
      include: {
        deliveries: {
          where: { status: { in: ["PENDING", "IN_PROGRESS", "BLOCKED", "DELAYED"] } },
          take: 5,
        },
        contacts: { take: 5 },
        csOwner: { select: { id: true, name: true } },
      },
      orderBy: { healthScore: "asc" },
      take: 3,
    });
    companies.push(...anyCompanies);
  }

  const allInsights: Awaited<ReturnType<typeof generateCompanyInsights>> = [];

  for (const company of companies) {
    const prompt = companyAnalysisPrompt({
      name: company.name,
      healthScore: company.healthScore,
      healthStatus: company.healthStatus,
      mrr: company.mrr,
      lastInteraction: company.lastInteraction?.toISOString() || null,
      segment: company.segment || undefined,
      plan: company.plan || undefined,
      deliveries: company.deliveries.map((d) => ({
        title: d.title,
        status: d.status,
        dueDate: d.dueDate?.toISOString() || null,
      })),
      contacts: company.contacts.map((c) => ({
        name: c.name,
        engagementLevel: c.engagementLevel,
        lastContact: c.lastContact?.toISOString() || null,
      })),
    });

    const response = await callOpenAI(prompt);
    if (!response?.insights) continue;

    const createdInsights = await Promise.all(
      response.insights.slice(0, 1).map((insight) =>
        prisma.aIInsight.create({
          data: {
            insight: insight.insight,
            evidence: insight.evidence,
            actionSuggested: insight.actionSuggested,
            expectedOutcome: insight.expectedOutcome,
            riskIfIgnored: insight.riskIfIgnored,
            confidence: confidenceMap[insight.confidence] || "MEDIUM",
            type: typeMap[insight.type] || "RECOMMENDATION",
            scope: "COMPANY" as InsightScope,
            source: "OpenAI GPT-4o-mini",
            companyId: company.id,
            csOwnerId: company.csOwner?.id,
          },
          include: {
            company: { select: { name: true } },
            csOwner: { select: { name: true } },
          },
        })
      )
    );

    allInsights.push(...createdInsights);
  }

  return allInsights;
}

export async function generateInsights(
  scope: "company" | "cs_owner" | "portfolio",
  targetId?: string
) {
  switch (scope) {
    case "company":
      if (!targetId) throw new Error("companyId é obrigatório para escopo company");
      return generateCompanyInsights(targetId);
    case "cs_owner":
      if (!targetId) throw new Error("csOwnerId é obrigatório para escopo cs_owner");
      return generateCSInsights(targetId);
    case "portfolio":
      return generatePortfolioInsights();
    default:
      throw new Error("Escopo inválido");
  }
}

type MeetingAnalysisResult = {
  summary: string;
  actionItems: {
    description: string;
    priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
    suggestedAssignee: string;
    dueInDays: number;
  }[];
};

export async function generateMeetingAnalysis(data: {
  companyName: string;
  meetingTitle: string;
  meetingDate: string;
  transcription: string;
}): Promise<MeetingAnalysisResult | null> {
  const { meetingTranscriptionPrompt } = await import("@/lib/prompts/insights");

  const prompt = meetingTranscriptionPrompt(data);

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um analista de Customer Success especializado em extrair insights de reuniões. Responda sempre em JSON válido.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content) as MeetingAnalysisResult;
  } catch (error) {
    console.error("Erro ao analisar transcrição:", error);
    return null;
  }
}
