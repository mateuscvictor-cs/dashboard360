"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Rocket, 
  Heart, 
  MessageSquare, 
  Star,
  CheckCircle2,
  Clock,
  ListChecks,
  FileCheck,
  Activity,
  HeartPulse,
  Users,
  TrendingDown,
  Calendar,
  MessageCircle,
  Timer,
  ThumbsUp,
  Smile
} from "lucide-react";

interface BreakdownData {
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
}

interface PerformanceBreakdownProps {
  data: BreakdownData;
  teamAverage?: number;
}

const CATEGORIES = [
  {
    key: "execution" as const,
    title: "Execução",
    icon: Rocket,
    color: "from-emerald-500 to-teal-500",
    shadow: "shadow-emerald-500/25",
    maxPoints: 40,
    metrics: [
      { key: "deliveriesOnTime", label: "Entregas no Prazo", icon: Clock, max: 15 },
      { key: "deliveriesCompletion", label: "Taxa de Conclusão", icon: CheckCircle2, max: 10 },
      { key: "checklistCompletion", label: "Checklist Diário", icon: ListChecks, max: 10 },
      { key: "demandsResolved", label: "Demandas Resolvidas", icon: FileCheck, max: 5 },
    ],
  },
  {
    key: "portfolio" as const,
    title: "Saúde do Portfólio",
    icon: Heart,
    color: "from-red-500 to-rose-500",
    shadow: "shadow-red-500/25",
    maxPoints: 30,
    metrics: [
      { key: "healthScoreAvg", label: "Health Score Médio", icon: HeartPulse, max: 15 },
      { key: "accountsHealthy", label: "Contas Saudáveis", icon: Users, max: 10 },
      { key: "riskReduction", label: "Redução de Risco", icon: TrendingDown, max: 5 },
    ],
  },
  {
    key: "engagement" as const,
    title: "Engajamento",
    icon: MessageSquare,
    color: "from-blue-500 to-cyan-500",
    shadow: "shadow-blue-500/25",
    maxPoints: 20,
    metrics: [
      { key: "activitiesCount", label: "Atividades Registradas", icon: Activity, max: 8 },
      { key: "meetingsCount", label: "Reuniões Realizadas", icon: Calendar, max: 7 },
      { key: "responseTime", label: "Tempo de Resposta", icon: Timer, max: 5 },
    ],
  },
  {
    key: "satisfaction" as const,
    title: "Satisfação",
    icon: Star,
    color: "from-amber-500 to-orange-500",
    shadow: "shadow-amber-500/25",
    maxPoints: 10,
    metrics: [
      { key: "npsAverage", label: "NPS Médio", icon: ThumbsUp, max: 5 },
      { key: "csatAverage", label: "CSAT Médio", icon: Smile, max: 5 },
    ],
  },
];

export function PerformanceBreakdown({ data, teamAverage }: PerformanceBreakdownProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Breakdown da Performance</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
              <span className="text-muted-foreground">Score: </span>
              <span className="font-bold">{data.total.toFixed(1)}</span>
            </div>
            {teamAverage !== undefined && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted" />
                <span className="text-muted-foreground">Média: </span>
                <span className="font-medium">{teamAverage.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORIES.map((category) => {
            const categoryData = data[category.key];
            const CategoryIcon = category.icon;
            const percentage = (categoryData.subtotal / category.maxPoints) * 100;

            return (
              <div
                key={category.key}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg",
                      category.color,
                      category.shadow
                    )}>
                      <CategoryIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{category.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Máx: {category.maxPoints} pontos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{categoryData.subtotal.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground">{percentage.toFixed(0)}%</p>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
                  <div
                    className={cn("h-full rounded-full bg-gradient-to-r", category.color)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="space-y-2">
                  {category.metrics.map((metric) => {
                    const value = categoryData[metric.key as keyof typeof categoryData] as number;
                    const metricPercentage = (value / metric.max) * 100;
                    const MetricIcon = metric.icon;

                    return (
                      <div key={metric.key} className="flex items-center gap-2">
                        <MetricIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="text-muted-foreground truncate">{metric.label}</span>
                            <span className="font-medium shrink-0">{value.toFixed(1)}/{metric.max}</span>
                          </div>
                          <div className="h-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                metricPercentage >= 80 ? "bg-emerald-500" :
                                metricPercentage >= 50 ? "bg-amber-500" :
                                "bg-red-500"
                              )}
                              style={{ width: `${metricPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
