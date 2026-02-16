"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { ActionZone } from "@/components/dashboard/action-zone";
import { PortfolioDonut } from "@/components/dashboard/portfolio-donut";
import { MRRChart } from "@/components/dashboard/mrr-chart";
import { DeliveryTimeline } from "@/components/dashboard/delivery-timeline";
import { CSOwnerCards } from "@/components/dashboard/cs-owner-cards";
import { FinancialBar } from "@/components/dashboard/financial-bar";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Brain,
  Zap,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInsights } from "@/hooks/use-insights";
import type {
  PortfolioHealth,
  PriorityItem,
  Alert,
  AIInsight,
} from "@/types";

type ActionItem = {
  id: string;
  accountId: string;
  accountName: string;
  reason: string;
  reasonType: string;
  priority: string;
  action: string;
};

type TimelineDelivery = {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  startDate: string;
  dueDate: string;
  status: string;
  progress: number;
};

type MRRDataPoint = {
  month: string;
  year: number;
  mrr: number;
};

type CSMetric = {
  id: string;
  name: string;
  avatar: string | null;
  companiesCount: number;
  completedToday: number;
  pendingTasks: number;
  totalTasks: number;
  accountsAtRisk: number;
  weeklyCompletionRate: number;
  capacityUsed: number;
};

type DashboardData = {
  portfolioHealth: PortfolioHealth;
  healthHistory: Array<{ date: string; healthy: number; attention: number; risk: number; critical: number }>;
  totalMRR: number;
  mrrHistory: MRRDataPoint[];
  totalBilledAmount: number;
  totalCashIn: number;
  timelineDeliveries: TimelineDelivery[];
  priorityItems: PriorityItem[];
  topActions: ActionItem[];
  alerts: Alert[];
  aiInsights: AIInsight[];
  csMetrics: CSMetric[];
  user: {
    name: string;
  };
};

export default function AdminPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insightsExpanded, setInsightsExpanded] = useState(false);

  const {
    insights: aiInsights,
    generating,
    generate,
    addFeedback,
    markAsActioned,
    dismiss,
  } = useInsights(10);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard/360");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        setError("Erro ao carregar dados");
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    try {
      await fetch("/api/insights?clearOrphans=true", { method: "DELETE" });
      await generate("portfolio");
    } catch {
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getFirstName = (name: string) => {
    return name?.split(" ")[0] || "Usuário";
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header
          title="Visão 360"
          subtitle={formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col h-full">
        <Header
          title="Visão 360"
          subtitle={formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error || "Erro ao carregar dados"}</span>
          </div>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const criticalCount = data.topActions.filter(
    (i) => i.priority === "critical"
  ).length;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Visão 360"
        subtitle={formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
        alertCount={data.alerts.length}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {getGreeting()}, {getFirstName(data.user.name)}!
              </h2>
              <p className="text-sm text-muted-foreground">
                {criticalCount > 0 ? (
                  <>
                    Você tem{" "}
                    <span className="font-semibold text-health-critical">
                      {criticalCount} {criticalCount === 1 ? "ação crítica" : "ações críticas"}
                    </span>{" "}
                    para hoje.
                  </>
                ) : data.topActions.length > 0 ? (
                  <>
                    {data.topActions.length} {data.topActions.length === 1 ? "ação prioritária" : "ações prioritárias"} aguardando.
                  </>
                ) : (
                  "Tudo sob controle! Nenhuma ação urgente no momento."
                )}
              </p>
            </div>
            <Badge variant="gradient" size="lg" className="gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Ao vivo
            </Badge>
          </div>

          <ActionZone actions={data.topActions} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioDonut data={data.portfolioHealth} />
            <MRRChart data={data.mrrHistory} currentMRR={data.totalMRR} />
          </div>

          <DeliveryTimeline deliveries={data.timelineDeliveries} />

          <CSOwnerCards metrics={data.csMetrics} />

          <FinancialBar 
            billedAmount={data.totalBilledAmount} 
            cashIn={data.totalCashIn} 
          />

          {data.alerts.length > 0 && (
            <AlertsPanel alerts={data.alerts} />
          )}

          <Card className="overflow-hidden border-purple-200/50 dark:border-purple-500/20 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-rose-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow-lg shadow-purple-500/25">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    {generating && (
                      <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-40" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-purple-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      Insights de IA
                      <Badge variant="secondary" size="sm" className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {aiInsights.filter(i => i.status === "active").length}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Análises automáticas via OpenAI</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-purple-200 dark:border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-500/10"
                    onClick={handleGenerateInsights}
                    disabled={generating}
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2 text-purple-500" />
                    )}
                    {generating ? "Gerando..." : "Gerar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setInsightsExpanded(!insightsExpanded)}
                  >
                    {insightsExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {insightsExpanded && (
              <CardContent className="pt-0">
                {aiInsights.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="mx-auto w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center mb-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nenhum insight gerado ainda
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {aiInsights.filter(i => i.status === "active").slice(0, 6).map((insight, index) => (
                      <div
                        key={insight.id}
                        className={cn(
                          "group rounded-xl border p-4 space-y-3 transition-all duration-200 hover:shadow-md bg-background/50 backdrop-blur-sm",
                          index === 0 && "border-purple-200 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-500/5"
                        )}
                      >
                        {(insight.accountName || insight.csOwnerName) && (
                          <div className="flex items-center gap-2 pb-2 border-b">
                            {insight.accountName && (
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-[10px] font-bold">
                                  {insight.accountName.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="font-medium text-xs truncate">{insight.accountName}</span>
                              </div>
                            )}
                            {insight.csOwnerName && (
                              <Badge variant="outline" className="shrink-0 text-[10px] gap-1 h-5">
                                <Users className="h-2.5 w-2.5" />
                                {insight.csOwnerName}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={insight.confidence === "high" ? "healthy-soft" : insight.confidence === "medium" ? "attention-soft" : "risk-soft"} 
                            size="sm"
                            className="text-[10px]"
                          >
                            {insight.confidence === "high" ? "Alta" : insight.confidence === "medium" ? "Média" : "Baixa"}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            size="sm"
                            className="capitalize text-[10px]"
                          >
                            {insight.type === "recommendation" ? "Recomendação" : 
                             insight.type === "alert" ? "Alerta" : 
                             insight.type === "opportunity" ? "Oportunidade" : 
                             insight.type === "warning" ? "Aviso" : "Tendência"}
                          </Badge>
                        </div>
                        <p className="text-xs leading-snug line-clamp-2">
                          {insight.insight}
                        </p>
                        {insight.actionSuggested && (
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                            <ArrowRight className="h-2.5 w-2.5" />
                            {insight.actionSuggested}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-[9px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                            {insight.source}
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-6 w-6 text-muted-foreground hover:text-health-healthy hover:bg-health-healthy-light"
                              onClick={() => addFeedback(insight.id, "positive")}
                              title="Útil"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-6 w-6 text-muted-foreground hover:text-health-critical hover:bg-health-critical-light"
                              onClick={() => addFeedback(insight.id, "negative")}
                              title="Não útil"
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => markAsActioned(insight.id)}
                              title="Acionado"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-6 w-6 text-muted-foreground hover:text-muted-foreground/80"
                              onClick={() => dismiss(insight.id)}
                              title="Dispensar"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {data.portfolioHealth.total === 0 && 
           data.topActions.length === 0 && (
            <div className="rounded-xl border bg-card p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="font-semibold mb-2">Comece a usar o Dashboard</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Cadastre empresas, atribua CS Owners e comece a acompanhar a saúde do seu portfólio.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
