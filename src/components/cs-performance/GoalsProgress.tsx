"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Target, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { PerformanceMetric, PerformancePeriod } from "@prisma/client";

interface Goal {
  id: string;
  metric: PerformanceMetric;
  targetValue: number;
  period: PerformancePeriod;
  startDate: string;
  endDate: string;
  csOwner?: {
    id: string;
    name: string;
  } | null;
}

interface GoalWithProgress {
  goal: Goal;
  currentValue: number;
  progress: number;
  remaining: number;
}

interface GoalsProgressProps {
  goals: GoalWithProgress[];
  onGoalClick?: (goalId: string) => void;
}

const METRIC_LABELS: Record<PerformanceMetric, string> = {
  DELIVERIES_ON_TIME: "Entregas no Prazo",
  DELIVERIES_COMPLETION: "Taxa de Conclusão",
  CHECKLIST_COMPLETION: "Checklist Completo",
  DEMANDS_RESOLVED: "Demandas Resolvidas",
  HEALTH_SCORE_AVG: "Health Score Médio",
  ACCOUNTS_HEALTHY: "Contas Saudáveis",
  RISK_REDUCTION: "Redução de Risco",
  ACTIVITIES_COUNT: "Atividades",
  MEETINGS_COUNT: "Reuniões",
  RESPONSE_TIME: "Tempo de Resposta",
  NPS_AVERAGE: "NPS Médio",
  CSAT_AVERAGE: "CSAT Médio",
};

const PERIOD_LABELS: Record<PerformancePeriod, string> = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
};

const getProgressColor = (progress: number) => {
  if (progress >= 100) return "bg-emerald-500";
  if (progress >= 75) return "bg-blue-500";
  if (progress >= 50) return "bg-amber-500";
  return "bg-red-500";
};

const getStatusIcon = (progress: number) => {
  if (progress >= 100) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (progress >= 75) return <Target className="h-4 w-4 text-blue-500" />;
  if (progress >= 50) return <Clock className="h-4 w-4 text-amber-500" />;
  return <AlertCircle className="h-4 w-4 text-red-500" />;
};

const formatValue = (metric: PerformanceMetric, value: number) => {
  const percentMetrics: PerformanceMetric[] = [
    "DELIVERIES_ON_TIME",
    "DELIVERIES_COMPLETION",
    "CHECKLIST_COMPLETION",
    "DEMANDS_RESOLVED",
    "ACCOUNTS_HEALTHY",
  ];

  if (percentMetrics.includes(metric)) {
    return `${value.toFixed(1)}%`;
  }
  return value.toFixed(1);
};

export function GoalsProgress({ goals, onGoalClick }: GoalsProgressProps) {
  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <Target className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Metas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[150px] text-center">
            <Target className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma meta configurada</p>
            <p className="text-xs text-muted-foreground mt-1">Crie metas para acompanhar o progresso</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedGoals = goals.filter(g => g.progress >= 100).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <Target className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Metas</CardTitle>
          </div>
          <Badge variant="secondary" size="sm">
            {completedGoals}/{goals.length} concluídas
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.map((item) => {
            const isCompleted = item.progress >= 100;
            const endDate = new Date(item.goal.endDate);
            const now = new Date();
            const isExpired = endDate < now && !isCompleted;

            return (
              <div
                key={item.goal.id}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  onGoalClick && "cursor-pointer hover:bg-muted/50",
                  isCompleted && "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5",
                  isExpired && "border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5"
                )}
                onClick={() => onGoalClick?.(item.goal.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2">
                    {getStatusIcon(item.progress)}
                    <div>
                      <p className="text-sm font-medium">{METRIC_LABELS[item.goal.metric]}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" size="sm" className="text-[10px]">
                          {PERIOD_LABELS[item.goal.period]}
                        </Badge>
                        {item.goal.csOwner ? (
                          <span className="text-[10px] text-muted-foreground">
                            {item.goal.csOwner.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            Meta da Equipe
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      isCompleted ? "text-emerald-600" : "text-foreground"
                    )}>
                      {formatValue(item.goal.metric, item.currentValue)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      de {formatValue(item.goal.metric, item.goal.targetValue)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        getProgressColor(item.progress)
                      )}
                      style={{ width: `${Math.min(100, item.progress)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{item.progress.toFixed(0)}% concluído</span>
                    {!isCompleted && item.remaining > 0 && (
                      <span>Faltam {formatValue(item.goal.metric, item.remaining)}</span>
                    )}
                    {isCompleted && (
                      <span className="text-emerald-600 font-medium">Meta atingida!</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
