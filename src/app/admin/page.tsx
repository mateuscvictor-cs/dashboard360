"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { HealthMap } from "@/components/dashboard/health-map";
import { PriorityFeed } from "@/components/dashboard/priority-feed";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { SquadsOverview } from "@/components/dashboard/squads-overview";
import { UpcomingDeliveries } from "@/components/dashboard/upcoming-deliveries";
import { NPSSuggestionsCard } from "@/components/cs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Building2,
  TrendingUp,
  Users,
  CheckCircle2,
  Sparkles,
  Brain,
  Zap,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInsights } from "@/hooks/use-insights";
import type {
  PortfolioHealth,
  PriorityItem,
  Alert,
  AIInsight,
  Squad,
  DailyProgress as DailyProgressType,
} from "@/types";

type DashboardData = {
  portfolioHealth: PortfolioHealth;
  totalMRR: number;
  squads: Squad[];
  upcomingDeliveries: {
    id: string;
    account: string;
    title: string;
    dueDate: string;
    status: string;
    risk: string;
  }[];
  dailyProgress: DailyProgressType;
  priorityItems: PriorityItem[];
  alerts: Alert[];
  aiInsights: AIInsight[];
  csMetrics: {
    id: string;
    name: string;
    avatar: string | null;
    companiesCount: number;
    completedToday: number;
    pendingTasks: number;
    totalTasks: number;
    accountsAtRisk: number;
  }[];
  user: {
    name: string;
  };
};

export default function AdminPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const criticalCount = data.priorityItems.filter(
    (i) => i.priority === "critical"
  ).length;

  const totalCompletedToday = data.csMetrics.reduce(
    (sum, cs) => sum + cs.completedToday,
    0
  );
  const totalTasksToday = data.csMetrics.reduce(
    (sum, cs) => sum + cs.totalTasks,
    0
  );
  const progressPercentage = totalTasksToday > 0 
    ? Math.round((totalCompletedToday / totalTasksToday) * 100) 
    : 0;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Visão 360"
        subtitle={formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
        alertCount={data.alerts.length}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {getGreeting()}, {getFirstName(data.user.name)}! 👋
              </h2>
              <p className="text-sm text-muted-foreground">
                {criticalCount > 0 ? (
                  <>
                    Você tem{" "}
                    <span className="font-semibold text-health-critical">
                      {criticalCount} {criticalCount === 1 ? "item crítico" : "itens críticos"}
                    </span>{" "}
                    que {criticalCount === 1 ? "precisa" : "precisam"} de atenção.
                  </>
                ) : (
                  "Tudo certo por aqui! Nenhum item crítico no momento."
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border-indigo-200/50 dark:border-indigo-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.portfolioHealth.total}</p>
                    <p className="text-xs text-muted-foreground">Empresas ativas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-200/50 dark:border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        notation: "compact",
                      }).format(data.totalMRR)}
                    </p>
                    <p className="text-xs text-muted-foreground">MRR total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-200/50 dark:border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.csMetrics.length}</p>
                    <p className="text-xs text-muted-foreground">CS ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-200/50 dark:border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{progressPercentage}%</p>
                    <p className="text-xs text-muted-foreground">Progresso hoje</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                      Inteligência Artificial
                      <Badge variant="secondary" size="sm" className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {aiInsights.filter(i => i.status === "active").length} insights
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Análises e recomendações automáticas via OpenAI</p>
                  </div>
                </div>
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
                  {generating ? "Gerando..." : "Gerar insights"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {aiInsights.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center mb-3">
                    <Brain className="h-6 w-6 text-purple-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Nenhum insight gerado ainda
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateInsights}
                    disabled={generating}
                    className="border-purple-200"
                  >
                    <Zap className="h-4 w-4 mr-2 text-purple-500" />
                    Gerar primeiro insight
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {aiInsights.filter(i => i.status === "active").slice(0, 3).map((insight, index) => (
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
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold">
                                {insight.accountName.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="font-semibold text-sm truncate">{insight.accountName}</span>
                            </div>
                          )}
                          {insight.csOwnerName && (
                            <Badge variant="outline" className="shrink-0 text-xs gap-1">
                              <Users className="h-3 w-3" />
                              {insight.csOwnerName}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={insight.confidence === "high" ? "healthy-soft" : insight.confidence === "medium" ? "attention-soft" : "risk-soft"} 
                          size="sm"
                        >
                          {insight.confidence === "high" ? "Alta" : insight.confidence === "medium" ? "Média" : "Baixa"}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          size="sm"
                          className="capitalize"
                        >
                          {insight.type === "recommendation" ? "Recomendação" : 
                           insight.type === "alert" ? "Alerta" : 
                           insight.type === "opportunity" ? "Oportunidade" : 
                           insight.type === "warning" ? "Aviso" : "Tendência"}
                        </Badge>
                      </div>
                      <p className="text-sm leading-snug line-clamp-2">
                        {insight.insight}
                      </p>
                      {insight.actionSuggested && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                          <ArrowRight className="h-3 w-3" />
                          {insight.actionSuggested}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                          {insight.source}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-muted-foreground hover:text-health-healthy hover:bg-health-healthy-light"
                            onClick={() => addFeedback(insight.id, "positive")}
                            title="Útil"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-muted-foreground hover:text-health-critical hover:bg-health-critical-light"
                            onClick={() => addFeedback(insight.id, "negative")}
                            title="Não útil"
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => markAsActioned(insight.id)}
                            title="Marcar como acionado"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-muted-foreground hover:text-muted-foreground/80"
                            onClick={() => dismiss(insight.id)}
                            title="Dispensar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 space-y-4">
              <HealthMap data={data.portfolioHealth} />
              
              {data.csMetrics.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Performance do Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.csMetrics.slice(0, 4).map((cs) => {
                      const progress = cs.totalTasks > 0 
                        ? Math.round((cs.completedToday / cs.totalTasks) * 100) 
                        : 0;
                      return (
                        <div key={cs.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 text-white text-xs font-bold">
                            {cs.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium truncate">{cs.name}</span>
                              <span className="text-xs text-muted-foreground">{cs.completedToday}/{cs.totalTasks}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  progress >= 75 ? "bg-health-healthy" : progress >= 50 ? "bg-health-attention" : "bg-health-risk"
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          {cs.accountsAtRisk > 0 && (
                            <Badge variant="danger-soft" size="sm" className="shrink-0">
                              {cs.accountsAtRisk} risco
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-7 space-y-4">
              {data.priorityItems.length > 0 && (
                <PriorityFeed items={data.priorityItems} />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.upcomingDeliveries.length > 0 && (
                  <UpcomingDeliveries deliveries={data.upcomingDeliveries} />
                )}
                {data.squads.length > 0 && (
                  <SquadsOverview squads={data.squads} />
                )}
              </div>

              {data.alerts.length > 0 && (
                <AlertsPanel alerts={data.alerts} />
              )}

              <NPSSuggestionsCard />
            </div>
          </div>

          {data.portfolioHealth.total === 0 && 
           data.priorityItems.length === 0 && 
           data.aiInsights.length === 0 && (
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
