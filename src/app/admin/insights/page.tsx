"use client";

import { useState } from "react";
import {
  Brain,
  Filter,
  Zap,
  Loader2,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
  ArrowRight,
  Building2,
  User,
  Users,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInsights } from "@/hooks/use-insights";
import { cn } from "@/lib/utils";
import type { InsightScope, InsightType } from "@/types";

const scopeLabels: Record<string, string> = {
  company: "Empresa",
  cs_owner: "CS Owner",
  portfolio: "Portfólio",
  squad: "Squad",
};

const typeLabels: Record<string, string> = {
  recommendation: "Recomendação",
  alert: "Alerta",
  opportunity: "Oportunidade",
  trend: "Tendência",
  warning: "Aviso",
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  recommendation: Lightbulb,
  alert: AlertCircle,
  opportunity: TrendingUp,
  trend: TrendingUp,
  warning: AlertTriangle,
};

const typeColors: Record<string, string> = {
  recommendation: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  alert: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  opportunity: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  trend: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
};

export default function InsightsPage() {
  const [scopeFilter, setScopeFilter] = useState<InsightScope | "all">("all");
  const [typeFilter, setTypeFilter] = useState<InsightType | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const {
    insights,
    stats,
    loading,
    generating,
    generate,
    addFeedback,
    markAsActioned,
    dismiss,
  } = useInsights(50);

  const handleGeneratePortfolio = async () => {
    await generate("portfolio");
  };

  const filteredInsights = insights.filter((insight) => {
    if (insight.status !== "active") return false;
    if (typeFilter !== "all" && insight.type !== typeFilter) return false;
    if (scopeFilter !== "all" && insight.scope !== scopeFilter) return false;
    return true;
  });

  const activeCount = insights.filter((i) => i.status === "active").length;

  return (
    <div className="flex flex-col h-full">
      <Header title="Insights IA" subtitle="Recomendações inteligentes" showFilters={false} />

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-200/50 dark:border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/20">
                  <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.byType?.recommendation || 0}</p>
                  <p className="text-xs text-muted-foreground">Recomendações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/20">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.byType?.alert || 0}</p>
                  <p className="text-xs text-muted-foreground">Alertas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.byType?.opportunity || 0}</p>
                  <p className="text-xs text-muted-foreground">Oportunidades</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.byType?.warning || 0}</p>
                  <p className="text-xs text-muted-foreground">Avisos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filtros
              <ChevronDown className={cn("h-3 w-3 transition-transform", showFilters && "rotate-180")} />
            </Button>

            {showFilters && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value as InsightScope | "all")}
                  className="rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">Todos os escopos</option>
                  <option value="company">Empresa</option>
                  <option value="cs_owner">CS Owner</option>
                  <option value="portfolio">Portfólio</option>
                  <option value="squad">Squad</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as InsightType | "all")}
                  className="rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="recommendation">Recomendação</option>
                  <option value="alert">Alerta</option>
                  <option value="opportunity">Oportunidade</option>
                  <option value="trend">Tendência</option>
                  <option value="warning">Aviso</option>
                </select>
              </div>
            )}
          </div>

          <Button
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            onClick={handleGeneratePortfolio}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {generating ? "Gerando..." : "Gerar Insights"}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredInsights.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center mb-4">
                <Brain className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Nenhum insight encontrado</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                Gere novos insights usando inteligência artificial para receber recomendações
                personalizadas sobre seu portfólio.
              </p>
              <Button
                onClick={handleGeneratePortfolio}
                disabled={generating}
                className="gap-2"
              >
                <Zap className="h-4 w-4" />
                Gerar primeiro insight
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInsights.map((insight) => {
              const TypeIcon = typeIcons[insight.type] || Lightbulb;

              return (
                <Card key={insight.id} className="group hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", typeColors[insight.type])}>
                        <TypeIcon className="h-6 w-6" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" size="sm">
                                {typeLabels[insight.type]}
                              </Badge>
                              <Badge
                                variant={insight.confidence === "high" ? "healthy-soft" : insight.confidence === "medium" ? "attention-soft" : "risk-soft"}
                                size="sm"
                              >
                                {insight.confidence === "high" ? "Alta confiança" : insight.confidence === "medium" ? "Média" : "Baixa"}
                              </Badge>
                              <Badge variant="secondary" size="sm" className="capitalize">
                                {scopeLabels[insight.scope]}
                              </Badge>
                            </div>
                            <p className="font-semibold text-base">{insight.insight}</p>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                              onClick={() => addFeedback(insight.id, "positive")}
                              title="Útil"
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                              onClick={() => addFeedback(insight.id, "negative")}
                              title="Não útil"
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => markAsActioned(insight.id)}
                              title="Marcar como acionado"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-muted-foreground/80"
                              onClick={() => dismiss(insight.id)}
                              title="Dispensar"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {insight.accountName && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {insight.accountName}
                            </span>
                          )}
                          {insight.csOwnerName && (
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {insight.csOwnerName}
                            </span>
                          )}
                          {insight.squadName && (
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {insight.squadName}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-muted text-xs">
                            {insight.source}
                          </span>
                        </div>

                        {insight.evidence.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Evidências</p>
                            <ul className="text-sm space-y-1">
                              {insight.evidence.map((e, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-muted-foreground">•</span>
                                  <span>{e}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {insight.actionSuggested && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20">
                            <ArrowRight className="h-4 w-4 text-purple-500 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                {insight.actionSuggested}
                              </p>
                              {insight.expectedOutcome && (
                                <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-0.5">
                                  Resultado esperado: {insight.expectedOutcome}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {insight.riskIfIgnored && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                              Risco se ignorar: {insight.riskIfIgnored}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
