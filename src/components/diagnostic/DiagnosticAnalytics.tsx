"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  ClipboardList,
  Wrench,
  Brain,
  Sparkles,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Bot,
  Zap,
  Copy,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { DiagnosticResponseView } from "./DiagnosticResponseView";

interface ChartDataItem {
  name: string;
  value: number;
}

interface SuggestedIPC {
  name: string;
  area: string;
  description: string;
  howItWorks: string;
  useCases: string[];
  expectedBenefits: string[];
  complexity: "low" | "medium" | "high";
  priority: number;
}

interface SuggestedAutomation {
  name: string;
  area: string;
  description: string;
  howItWorks: string;
  tasksAutomated: string[];
  tools: string[];
  estimatedTimeSaved: string;
  expectedBenefits: string[];
  complexity: "low" | "medium" | "high";
  priority: number;
}

interface PriorityTask {
  task: string;
  reason: string;
  potentialSavings: string;
  frequency: string;
  peopleAffected: string;
}

interface EstimatedSavings {
  weeklyHours: number;
  monthlyHours: number;
  yearlyHours: number;
  mainAreas: string[];
}

interface DiagnosticStats {
  diagnostic: {
    id: string;
    status: string;
    sentAt: string;
    expiresAt: string | null;
    targetAudience: string;
    company: { id: string; name: string; logo: string | null };
    sentBy: { id: string; name: string | null; email: string };
    hasAnalysis: boolean;
  };
  summary: {
    totalResponses: number;
    totalTasks: number;
    estimatedTimeSavedPerWeek: number;
    uniqueTools: number;
    uniqueAreas: number;
  };
  charts: {
    frequencyDistribution: ChartDataItem[];
    timeDistribution: ChartDataItem[];
    problemsDistribution: ChartDataItem[];
    gainsDistribution: ChartDataItem[];
    areaDistribution: ChartDataItem[];
    toolsUsage: ChartDataItem[];
    systemsUsage: ChartDataItem[];
  };
  textAnalysis: {
    frustrations: string[];
    copyPasteTasks: string[];
    reworkAreas: string[];
    humanErrorAreas: string[];
    dependencyAreas: string[];
    tasksToEliminate: string[];
  };
  aiAnalysis: {
    summary: string;
    suggestedIPCs: SuggestedIPC[];
    suggestedAutomations: SuggestedAutomation[];
    priorityTasks: PriorityTask[];
    estimatedSavings: EstimatedSavings;
    presentationPrompt: string;
    analyzedAt: string;
  } | null;
}

interface DiagnosticResponse {
  id: string;
  fullName: string;
  position: string;
  area: string;
  email: string | null;
  timeInCompany: string;
  directlyInvolved: string;
  directManager: string;
  completedAt: string | null;
  taskDetails: unknown;
  systemsData: unknown;
  priorityData: unknown;
  topFiveTasks: string[];
  topTwoTimeTasks: string[];
  copyPasteTask: string | null;
  reworkArea: string | null;
  humanErrorArea: string | null;
  dependencyArea: string | null;
  frustration: string | null;
  user: { id: string; name: string | null; email: string } | null;
}

const CHART_COLORS = {
  primary: "#6366f1",
  secondary: "#22c55e", 
  tertiary: "#f59e0b",
  quaternary: "#ec4899",
  quinary: "#06b6d4",
  senary: "#8b5cf6",
};

const PIE_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
  "#ef4444",
  "#84cc16",
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-foreground">{label || payload[0]?.name}</p>
        <p className="text-sm text-muted-foreground">
          Quantidade: <span className="font-semibold text-foreground">{payload[0]?.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percent: number } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          Quantidade: <span className="font-semibold text-foreground">{data.value}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Percentual: <span className="font-semibold text-foreground">{(data.payload.percent * 100).toFixed(0)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

interface DiagnosticAnalyticsProps {
  diagnosticId: string;
  backUrl: string;
  canDeleteResponses?: boolean;
}

export function DiagnosticAnalytics({ diagnosticId, backUrl, canDeleteResponses = false }: DiagnosticAnalyticsProps) {
  const [stats, setStats] = useState<DiagnosticStats | null>(null);
  const [responses, setResponses] = useState<DiagnosticResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<DiagnosticResponse | null>(null);
  const [expandedIPC, setExpandedIPC] = useState<number | null>(null);
  const [expandedAutomation, setExpandedAutomation] = useState<number | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [deletingResponseId, setDeletingResponseId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [diagnosticId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, responsesRes] = await Promise.all([
        fetch(`/api/diagnostics/${diagnosticId}/stats`),
        fetch(`/api/diagnostics/${diagnosticId}/responses`),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (responsesRes.ok) {
        const data = await responsesRes.json();
        setResponses(data);
      }
    } catch (error) {
      console.error("Error fetching diagnostic data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch(`/api/diagnostics/${diagnosticId}/analyze`, {
        method: "POST",
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error analyzing diagnostic:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (error) {
      console.error("Error copying prompt:", error);
    }
  };

  const handleDeleteResponse = async (e: React.MouseEvent, responseId: string) => {
    e.stopPropagation();
    if (!window.confirm("Excluir esta resposta do diagnóstico? Esta ação não pode ser desfeita.")) return;
    setDeletingResponseId(responseId);
    try {
      const res = await fetch(`/api/diagnostics/${diagnosticId}/responses/${responseId}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedResponse?.id === responseId) setSelectedResponse(null);
        await fetchData();
      }
    } catch (error) {
      console.error("Error deleting response:", error);
    } finally {
      setDeletingResponseId(null);
    }
  };

  const getComplexityBadge = (complexity: string) => {
    const variants: Record<string, string> = {
      low: "bg-green-500/10 text-green-600 border-green-500/30",
      medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
      high: "bg-red-500/10 text-red-600 border-red-500/30",
    };
    const labels: Record<string, string> = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
    };
    return (
      <Badge variant="outline" className={variants[complexity] || ""}>
        {labels[complexity] || complexity}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
      IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      COMPLETED: "bg-green-500/10 text-green-600 border-green-500/30",
      ANALYZED: "bg-purple-500/10 text-purple-600 border-purple-500/30",
    };
    const labels: Record<string, string> = {
      PENDING: "Pendente",
      IN_PROGRESS: "Em andamento",
      COMPLETED: "Completo",
      ANALYZED: "Analisado",
    };
    return (
      <Badge variant="outline" className={variants[status] || ""}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Diagnóstico não encontrado</h2>
        <Link href={backUrl}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  if (selectedResponse) {
    return (
      <DiagnosticResponseView
        response={selectedResponse}
        companyName={stats.diagnostic.company.name}
        onBack={() => setSelectedResponse(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={backUrl}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Diagnóstico - {stats.diagnostic.company.name}</h1>
              {getStatusBadge(stats.diagnostic.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              Enviado em {formatDate(stats.diagnostic.sentAt)} por {stats.diagnostic.sentBy.name || stats.diagnostic.sentBy.email}
            </p>
          </div>
        </div>
        {responses.length > 0 && (
          <Button onClick={handleAnalyze} disabled={analyzing} className="gap-2">
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {stats.aiAnalysis ? "Regenerar Análise IA" : "Analisar com IA"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.summary.totalResponses}</p>
                <p className="text-sm text-muted-foreground">Respostas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ClipboardList className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.summary.totalTasks}</p>
                <p className="text-sm text-muted-foreground">Tarefas mapeadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.summary.estimatedTimeSavedPerWeek}h</p>
                <p className="text-sm text-muted-foreground">Economia/semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Wrench className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.summary.uniqueTools}</p>
                <p className="text-sm text-muted-foreground">Ferramentas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.summary.uniqueAreas}</p>
                <p className="text-sm text-muted-foreground">Áreas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="responses">
            Respostas ({responses.length})
          </TabsTrigger>
          <TabsTrigger value="analysis" disabled={!stats.aiAnalysis}>
            Análise IA
          </TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Principais Problemas</CardTitle>
                <CardDescription>Distribuição dos problemas reportados nas tarefas</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.charts.problemsDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart 
                      data={stats.charts.problemsDistribution} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={130} 
                        tick={{ fontSize: 11, fill: "#374151" }}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Frequência das Tarefas</CardTitle>
                <CardDescription>Com que frequência as tarefas são executadas</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.charts.frequencyDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={stats.charts.frequencyDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.charts.frequencyDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend 
                        layout="vertical" 
                        align="right" 
                        verticalAlign="middle"
                        wrapperStyle={{ fontSize: "12px", paddingLeft: "10px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tempo por Execução</CardTitle>
                <CardDescription>Quanto tempo cada tarefa demora</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.charts.timeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart 
                      data={stats.charts.timeDistribution}
                      margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10, fill: "#374151" }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tickLine={false}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill={CHART_COLORS.secondary} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ganhos Esperados</CardTitle>
                <CardDescription>O que se espera ganhar com melhorias</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.charts.gainsDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={stats.charts.gainsDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.charts.gainsDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend 
                        layout="vertical" 
                        align="right" 
                        verticalAlign="middle"
                        wrapperStyle={{ fontSize: "12px", paddingLeft: "10px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Ferramentas Usadas</CardTitle>
                <CardDescription>Ferramentas mais citadas pelos respondentes</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.charts.toolsUsage.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart 
                      data={stats.charts.toolsUsage} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={90} 
                        tick={{ fontSize: 11, fill: "#374151" }}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill={CHART_COLORS.tertiary} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Distribuição por Área</CardTitle>
                <CardDescription>Áreas que mais responderam</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.charts.areaDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart 
                      data={stats.charts.areaDistribution} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100} 
                        tick={{ fontSize: 11, fill: "#374151" }}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill={CHART_COLORS.quaternary} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="responses" className="mt-6">
          {responses.length > 0 ? (
            <div className="space-y-3">
              {responses.map((response, index) => (
                <motion.div
                  key={response.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedResponse(response)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            <span className="text-sm font-medium text-primary">
                              {response.fullName?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{response.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              {response.position} · {response.area}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {(response.taskDetails as unknown[])?.length || 0} tarefas
                            </p>
                            {response.completedAt && (
                              <p className="text-xs text-muted-foreground">
                                {formatDate(response.completedAt)}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">{response.timeInCompany}</Badge>
                          {canDeleteResponses && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => handleDeleteResponse(e, response.id)}
                              disabled={deletingResponseId === response.id}
                              aria-label="Excluir resposta"
                            >
                              {deletingResponseId === response.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma resposta ainda</h3>
                <p className="text-sm text-muted-foreground">
                  Aguardando respostas dos colaboradores
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          {stats.aiAnalysis ? (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <CardTitle>Resumo Executivo</CardTitle>
                  </div>
                  <CardDescription>
                    Analisado em {formatDate(stats.aiAnalysis.analyzedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{stats.aiAnalysis.summary}</p>
                </CardContent>
              </Card>

              {stats.aiAnalysis.estimatedSavings && (
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <CardTitle className="text-green-700 dark:text-green-400">Economia Estimada</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-background rounded-lg">
                        <p className="text-3xl font-bold text-green-600">{stats.aiAnalysis.estimatedSavings.weeklyHours}h</p>
                        <p className="text-sm text-muted-foreground">por semana</p>
                      </div>
                      <div className="text-center p-4 bg-background rounded-lg">
                        <p className="text-3xl font-bold text-green-600">{stats.aiAnalysis.estimatedSavings.monthlyHours}h</p>
                        <p className="text-sm text-muted-foreground">por mês</p>
                      </div>
                      <div className="text-center p-4 bg-background rounded-lg">
                        <p className="text-3xl font-bold text-green-600">{stats.aiAnalysis.estimatedSavings.yearlyHours}h</p>
                        <p className="text-sm text-muted-foreground">por ano</p>
                      </div>
                    </div>
                    {stats.aiAnalysis.estimatedSavings.mainAreas?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground">Principais áreas:</span>
                        {stats.aiAnalysis.estimatedSavings.mainAreas.map((area, index) => (
                          <Badge key={index} variant="secondary">{area}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {Array.isArray(stats.aiAnalysis.suggestedIPCs) && stats.aiAnalysis.suggestedIPCs.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-500" />
                    <h2 className="text-xl font-semibold">IPCs Sugeridos (Custom GPTs)</h2>
                    <Badge variant="outline">{stats.aiAnalysis.suggestedIPCs.length}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Inteligências Personalizadas Customizadas que funcionam como "ajudantes" inteligentes para cada área
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {stats.aiAnalysis.suggestedIPCs.map((ipc, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="h-full hover:border-blue-500/50 transition-colors">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
                                  <Bot className="h-4 w-4 text-blue-500" />
                                </div>
                                <div>
                                  <CardTitle className="text-base">{ipc.name}</CardTitle>
                                  <Badge variant="outline" className="mt-1 text-xs">{ipc.area}</Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getComplexityBadge(ipc.complexity)}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedIPC(expandedIPC === index ? null : index)}
                                >
                                  {expandedIPC === index ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">{ipc.description}</p>
                            
                            {expandedIPC === index && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4 pt-3 border-t"
                              >
                                <div>
                                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Wrench className="h-3 w-3" /> Como Funciona
                                  </h4>
                                  <p className="text-sm text-muted-foreground">{ipc.howItWorks}</p>
                                </div>
                                
                                {ipc.useCases?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <Target className="h-3 w-3" /> Casos de Uso
                                    </h4>
                                    <ul className="space-y-1">
                                      {ipc.useCases.map((useCase, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                          <span className="text-blue-500">•</span>
                                          {useCase}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {ipc.expectedBenefits?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <TrendingUp className="h-3 w-3" /> Benefícios Esperados
                                    </h4>
                                    <ul className="space-y-1">
                                      {ipc.expectedBenefits.map((benefit, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                          <span className="text-green-500">✓</span>
                                          {benefit}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(stats.aiAnalysis.suggestedAutomations) && stats.aiAnalysis.suggestedAutomations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-xl font-semibold">Automações Sugeridas</h2>
                    <Badge variant="outline">{stats.aiAnalysis.suggestedAutomations.length}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Fluxos automatizados para eliminar tarefas repetitivas e aumentar a produtividade
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {stats.aiAnalysis.suggestedAutomations.map((automation, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="h-full hover:border-yellow-500/50 transition-colors">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10">
                                  <Zap className="h-4 w-4 text-yellow-500" />
                                </div>
                                <div>
                                  <CardTitle className="text-base">{automation.name}</CardTitle>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{automation.area}</Badge>
                                    <span className="text-xs text-green-600 font-medium">
                                      {automation.estimatedTimeSaved}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getComplexityBadge(automation.complexity)}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedAutomation(expandedAutomation === index ? null : index)}
                                >
                                  {expandedAutomation === index ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">{automation.description}</p>
                            
                            {expandedAutomation === index && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4 pt-3 border-t"
                              >
                                <div>
                                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Wrench className="h-3 w-3" /> Como Funciona
                                  </h4>
                                  <p className="text-sm text-muted-foreground">{automation.howItWorks}</p>
                                </div>

                                {automation.tasksAutomated?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <ClipboardList className="h-3 w-3" /> Tarefas Automatizadas
                                    </h4>
                                    <ul className="space-y-1">
                                      {automation.tasksAutomated.map((task, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                          <span className="text-yellow-500">•</span>
                                          {task}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {automation.tools?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <Wrench className="h-3 w-3" /> Ferramentas
                                    </h4>
                                    <div className="flex flex-wrap gap-1">
                                      {automation.tools.map((tool, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">{tool}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {automation.expectedBenefits?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <TrendingUp className="h-3 w-3" /> Benefícios Esperados
                                    </h4>
                                    <ul className="space-y-1">
                                      {automation.expectedBenefits.map((benefit, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                          <span className="text-green-500">✓</span>
                                          {benefit}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(stats.aiAnalysis.priorityTasks) && stats.aiAnalysis.priorityTasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-red-500" />
                      <CardTitle>Tarefas Prioritárias</CardTitle>
                    </div>
                    <CardDescription>Tarefas que devem ser priorizadas para maior impacto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.aiAnalysis.priorityTasks.map((task, index) => (
                        <div key={index} className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-medium">{task.task}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{task.reason}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <Badge variant="outline" className="text-green-600">
                                {task.potentialSavings}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">{task.frequency}</p>
                              <p className="text-xs text-muted-foreground">{task.peopleAffected} pessoas</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats.aiAnalysis.presentationPrompt && (
                <Card className="border-purple-500/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-500" />
                        <CardTitle>Prompt para Apresentação de Onboarding</CardTitle>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyPrompt(stats.aiAnalysis!.presentationPrompt)}
                        className="gap-2"
                      >
                        {copiedPrompt ? (
                          <>
                            <Check className="h-4 w-4 text-green-500" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copiar Prompt
                          </>
                        )}
                      </Button>
                    </div>
                    <CardDescription>
                      Use este prompt no ChatGPT ou Claude para gerar um documento de apresentação profissional
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted rounded-lg max-h-[300px] overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {stats.aiAnalysis.presentationPrompt}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Análise não disponível</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Clique em "Analisar com IA" para gerar 6 IPCs, 6 automações e insights completos
                </p>
                <Button onClick={handleAnalyze} disabled={analyzing || responses.length === 0}>
                  {analyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Analisar com IA
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="mt-6 space-y-6">
          {stats.textAnalysis.frustrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Frustrações Reportadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {stats.textAnalysis.frustrations.map((item, index) => (
                    <li key={index} className="text-sm p-3 bg-muted/50 rounded-lg">
                      "{item}"
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {stats.textAnalysis.tasksToEliminate.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-red-500" />
                  Tarefas que Gostariam de Eliminar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {stats.textAnalysis.tasksToEliminate.map((item, index) => (
                    <li key={index} className="text-sm p-3 bg-muted/50 rounded-lg">
                      "{item}"
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {stats.textAnalysis.reworkAreas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Áreas com Retrabalho</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {stats.textAnalysis.reworkAreas.map((item, index) => (
                    <li key={index} className="text-sm p-3 bg-muted/50 rounded-lg">
                      "{item}"
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {stats.textAnalysis.copyPasteTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tarefas de Copiar/Colar</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {stats.textAnalysis.copyPasteTasks.map((item, index) => (
                    <li key={index} className="text-sm p-3 bg-muted/50 rounded-lg">
                      "{item}"
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {Object.values(stats.textAnalysis).every(arr => arr.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Sem insights disponíveis</h3>
                <p className="text-sm text-muted-foreground">
                  Ainda não há dados suficientes para gerar insights
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
