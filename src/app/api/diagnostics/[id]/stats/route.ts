import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type { TaskDetail, SystemsData } from "@/services/diagnostic.service";

const FREQUENCY_LABELS: Record<string, string> = {
  diaria: "Diária",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  "sob-demanda": "Sob demanda",
};

const TIME_LABELS: Record<string, string> = {
  "ate-5m": "Até 5 min",
  "5-15m": "5-15 min",
  "15-30m": "15-30 min",
  "30-60m": "30-60 min",
  "1-2h": "1-2 horas",
  "2h+": "Mais de 2h",
};

const PROBLEM_LABELS: Record<string, string> = {
  demora: "Demora",
  erros: "Erros frequentes",
  retrabalho: "Retrabalho",
  "falta-clareza": "Falta de clareza",
  "falta-dados": "Falta de dados",
  dependencia: "Dependência externa",
  outro: "Outro",
};

const GAIN_LABELS: Record<string, string> = {
  tempo: "Economia de tempo",
  "reduzir-erros": "Reduzir erros",
  "reduzir-retrabalho": "Reduzir retrabalho",
  velocidade: "Mais velocidade",
  qualidade: "Mais qualidade",
  outro: "Outro",
};

function parseTimeSaved(text: string): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  const hoursMatch = lower.match(/(\d+)\s*(h|hora|horas)/);
  const minutesMatch = lower.match(/(\d+)\s*(m|min|minuto|minutos)/);
  
  let totalMinutes = 0;
  if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
  if (minutesMatch) totalMinutes += parseInt(minutesMatch[1]);
  
  return totalMinutes;
}

function countOccurrences(items: string[]): Record<string, number> {
  return items.reduce((acc, item) => {
    if (item) {
      acc[item] = (acc[item] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
}

function toChartData(counts: Record<string, number>, labels?: Record<string, string>): Array<{ name: string; value: number }> {
  return Object.entries(counts)
    .map(([key, value]) => ({
      name: labels?.[key] || key,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const { id } = await params;

    const diagnostic = await prisma.diagnosticForm.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, logo: true } },
        sentBy: { select: { id: true, name: true, email: true } },
        responses: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        aiAnalysis: true,
      },
    });

    if (!diagnostic) {
      return NextResponse.json(
        { error: "Diagnóstico não encontrado" },
        { status: 404 }
      );
    }

    const responses = diagnostic.responses;
    const allTaskDetails: TaskDetail[] = [];
    const allTools: string[] = [];
    const allSystems: string[] = [];
    const areas: string[] = [];
    const positions: string[] = [];
    const timeInCompany: string[] = [];
    const frustrations: string[] = [];
    const copyPasteTasks: string[] = [];
    const reworkAreas: string[] = [];
    const humanErrorAreas: string[] = [];
    const dependencyAreas: string[] = [];
    const tasksToEliminate: string[] = [];

    for (const response of responses) {
      const tasks = response.taskDetails as unknown as TaskDetail[];
      if (Array.isArray(tasks)) {
        allTaskDetails.push(...tasks);
      }

      const systems = response.systemsData as unknown as SystemsData;
      if (systems) {
        if (Array.isArray(systems.dailyTools)) {
          allTools.push(...systems.dailyTools);
        }
        if (Array.isArray(systems.indispensableSystems)) {
          allSystems.push(...systems.indispensableSystems);
        }
      }

      if (response.area) areas.push(response.area);
      if (response.position) positions.push(response.position);
      if (response.timeInCompany) timeInCompany.push(response.timeInCompany);
      if (response.frustration) frustrations.push(response.frustration);
      if (response.copyPasteTask) copyPasteTasks.push(response.copyPasteTask);
      if (response.reworkArea) reworkAreas.push(response.reworkArea);
      if (response.humanErrorArea) humanErrorAreas.push(response.humanErrorArea);
      if (response.dependencyArea) dependencyAreas.push(response.dependencyArea);

      const priority = response.priorityData as { taskToEliminate?: string } | null;
      if (priority?.taskToEliminate) {
        tasksToEliminate.push(priority.taskToEliminate);
      }
    }

    const frequencies = allTaskDetails.map(t => t.frequency);
    const executionTimes = allTaskDetails.map(t => t.timePerExecution);
    const problems = allTaskDetails.map(t => t.mainProblem);
    const gains = allTaskDetails.map(t => t.mainGainIfImproved);
    const timeSavedMinutes = allTaskDetails.reduce((sum, t) => sum + parseTimeSaved(t.timeSavedPerWeek), 0);

    const stats = {
      diagnostic: {
        id: diagnostic.id,
        status: diagnostic.status,
        sentAt: diagnostic.sentAt,
        expiresAt: diagnostic.expiresAt,
        targetAudience: diagnostic.targetAudience,
        company: diagnostic.company,
        sentBy: diagnostic.sentBy,
        hasAnalysis: !!diagnostic.aiAnalysis,
      },
      summary: {
        totalResponses: responses.length,
        totalTasks: allTaskDetails.length,
        estimatedTimeSavedPerWeek: Math.round(timeSavedMinutes / 60 * 10) / 10,
        uniqueTools: [...new Set(allTools)].length,
        uniqueAreas: [...new Set(areas)].length,
      },
      charts: {
        frequencyDistribution: toChartData(countOccurrences(frequencies), FREQUENCY_LABELS),
        timeDistribution: toChartData(countOccurrences(executionTimes), TIME_LABELS),
        problemsDistribution: toChartData(countOccurrences(problems), PROBLEM_LABELS),
        gainsDistribution: toChartData(countOccurrences(gains), GAIN_LABELS),
        areaDistribution: toChartData(countOccurrences(areas)),
        toolsUsage: toChartData(countOccurrences(allTools)).slice(0, 10),
        systemsUsage: toChartData(countOccurrences(allSystems)).slice(0, 10),
      },
      textAnalysis: {
        frustrations: frustrations.filter(Boolean),
        copyPasteTasks: copyPasteTasks.filter(Boolean),
        reworkAreas: reworkAreas.filter(Boolean),
        humanErrorAreas: humanErrorAreas.filter(Boolean),
        dependencyAreas: dependencyAreas.filter(Boolean),
        tasksToEliminate: tasksToEliminate.filter(Boolean),
      },
      aiAnalysis: diagnostic.aiAnalysis,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching diagnostic stats:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
