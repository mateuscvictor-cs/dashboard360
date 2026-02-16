"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Building2,
  AlertTriangle,
  Circle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { UpcomingDeliverables } from "@/components/upcoming-deliverables";
import { NPSSuggestionsCard } from "@/components/cs";
import { cn } from "@/lib/utils";

type ChecklistItem = {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
};

type Company = {
  id: string;
  name: string;
  healthScore: number;
  healthStatus: string;
};

type CSData = {
  id: string;
  name: string;
  companies: Company[];
  checklistItems: ChecklistItem[];
  stats: {
    totalCompanies: number;
    completedTasks: number;
    pendingTasks: number;
    totalTasks: number;
    atRiskCompanies: number;
  };
};

const priorityConfig: Record<string, { color: string }> = {
  HIGH: { color: "text-red-500" },
  MEDIUM: { color: "text-amber-500" },
  LOW: { color: "text-blue-500" },
};

export default function CSHomePage() {
  const [data, setData] = useState<CSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/cs/me");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else if (response.status === 404) {
        setError("Perfil de CS não encontrado. Entre em contato com o administrador.");
      } else {
        setError("Erro ao carregar dados.");
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    setToggling(id);
    try {
      const response = await fetch(`/api/checklist/${id}/toggle`, {
        method: "POST",
      });

      if (response.ok && data) {
        setData({
          ...data,
          checklistItems: data.checklistItems.map(item =>
            item.id === id ? { ...item, completed: !completed } : item
          ),
          stats: {
            ...data.stats,
            completedTasks: completed ? data.stats.completedTasks - 1 : data.stats.completedTasks + 1,
            pendingTasks: completed ? data.stats.pendingTasks + 1 : data.stats.pendingTasks - 1,
          },
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar tarefa:", err);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Minha Área" subtitle="Visão geral do seu dia" showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Minha Área" subtitle="Visão geral do seu dia" showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="flex flex-col items-center py-8">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <p className="text-center text-muted-foreground">{error || "Erro ao carregar dados."}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { stats, checklistItems, companies } = data;
  const progressPercentage = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const pendingTasks = checklistItems.filter(t => !t.completed).slice(0, 5);
  const atRiskCompanies = companies.filter(
    c => c.healthStatus === "CRITICAL" || c.healthStatus === "RISK"
  ).slice(0, 5);

  return (
    <div className="flex flex-col h-full">
      <Header title="Minha Área" subtitle="Visão geral do seu dia" showFilters={false} />

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/cs/empresas">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stats.totalCompanies}</p>
                <p className="text-sm text-muted-foreground">Minhas Empresas</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/cs/tarefas">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
                <p className="text-sm text-muted-foreground">Tarefas Concluídas</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/cs/tarefas">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 shadow-sm">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stats.pendingTasks}</p>
                <p className="text-sm text-muted-foreground">Tarefas Pendentes</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/cs/empresas">
            <Card className={cn(
              "hover:shadow-md transition-shadow cursor-pointer",
              stats.atRiskCompanies > 0 && "border-danger/30"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 shadow-sm">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  {stats.atRiskCompanies > 0 && <Badge variant="danger">Atenção</Badge>}
                </div>
                <p className="text-2xl font-bold">{stats.atRiskCompanies}</p>
                <p className="text-sm text-muted-foreground">Empresas em Risco</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Progresso do Dia</CardTitle>
            <CardDescription>
              {stats.completedTasks} de {stats.totalTasks} tarefas concluídas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={progressPercentage} className="flex-1 h-3" />
              <span className="text-lg font-bold">{progressPercentage}%</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Tarefas Pendentes</CardTitle>
              <Link href="/cs/tarefas">
                <Button variant="ghost" size="sm" className="gap-1">
                  Ver todas <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {pendingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-muted-foreground text-sm text-center">
                    Todas as tarefas concluídas!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <button
                        onClick={() => handleToggle(task.id, task.completed)}
                        disabled={toggling === task.id}
                        className="shrink-0"
                      >
                        {toggling === task.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <Circle className={cn(
                            "h-5 w-5 hover:text-primary transition-colors",
                            priorityConfig[task.priority]?.color || "text-muted-foreground"
                          )} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Empresas em Atenção</CardTitle>
              <Link href="/cs/empresas">
                <Button variant="ghost" size="sm" className="gap-1">
                  Ver todas <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {atRiskCompanies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-muted-foreground text-sm text-center">
                    Nenhuma empresa em situação crítica!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {atRiskCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs font-bold shrink-0">
                        {company.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{company.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Health Score: {company.healthScore}%
                        </p>
                      </div>
                      <Badge variant="danger" className="shrink-0">
                        {company.healthStatus === "CRITICAL" ? "Crítico" : "Em Risco"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {data?.id && (
            <UpcomingDeliverables
              csOwnerId={data.id}
              title="Próximas Entregas"
              maxItems={8}
              showCompany={true}
              showFutureOccurrences={true}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NPSSuggestionsCard />
        </div>
      </div>
    </div>
  );
}
