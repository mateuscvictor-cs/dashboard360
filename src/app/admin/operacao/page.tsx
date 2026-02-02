"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Users,
  Target,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  AlertCircle,
  FileText,
  Send,
  X,
  Building2,
  User,
  Search,
  ChevronRight,
  ExternalLink,
  Trash2,
  Edit,
  Play,
  LayoutTemplate,
  ClipboardList,
  UserPlus,
  UsersRound,
  Brain,
  Zap,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { useInsights } from "@/hooks/use-insights";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import {
  mockTeamActivities,
  mockPendings,
  mockDemands,
  mockTemplates,
  mockAppliedTemplates,
  mockSquads,
  getCSOwnerById,
  getTemplateById,
  getSquadById,
  type CSOwner,
  type TeamActivity,
  type Pending,
  type Demand,
  type ActivityTemplate,
  type TemplateTask,
  type AppliedTemplate,
} from "@/lib/data/cs-mock";

const categoryLabels: Record<string, string> = {
  daily: "Diário",
  weekly: "Semanal",
  onboarding: "Onboarding",
  nutrition: "Nutrição",
  research: "Pesquisa",
  custom: "Personalizado",
};

const categoryColors: Record<string, string> = {
  daily: "bg-blue-100 text-blue-700",
  weekly: "bg-purple-100 text-purple-700",
  onboarding: "bg-emerald-100 text-emerald-700",
  nutrition: "bg-amber-100 text-amber-700",
  research: "bg-pink-100 text-pink-700",
  custom: "bg-slate-100 text-slate-700",
};

type DBCSOwner = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  status: string;
  weeklyCompletion: number;
  avgResponseTime: number;
  npsScore: number;
  accountsAtRisk: number;
  accountsCount: number;
  completedToday: number;
  pendingTasks: number;
  totalTasks: number;
};

export default function OperacaoPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCS, setSelectedCS] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCSDropdown, setShowCSDropdown] = useState(false);
  const [showNewDemand, setShowNewDemand] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showApplyTemplate, setShowApplyTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ActivityTemplate | null>(null);
  const [templates, setTemplates] = useState(mockTemplates);
  const [appliedTemplates, setAppliedTemplates] = useState(mockAppliedTemplates);
  const [csOwners, setCsOwners] = useState<DBCSOwner[]>([]);
  const [loadingCS, setLoadingCS] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    insights: aiInsights,
    generating,
    generate,
    addFeedback,
    markAsActioned,
    dismiss,
  } = useInsights(10);

  const handleGenerateCSInsights = async (csId: string) => {
    try {
      await generate("cs_owner", csId);
    } catch {
    }
  };

  const handleGeneratePortfolioInsights = async () => {
    try {
      await generate("portfolio");
    } catch {
    }
  };
  
  const [newDemand, setNewDemand] = useState({
    title: "",
    description: "",
    company: "",
    assignedTo: "",
    priority: "medium",
    type: "request",
    dueDate: "",
  });

  const [newTemplate, setNewTemplate] = useState<{
    name: string;
    description: string;
    category: string;
    tasks: Array<{ id: string; title: string; description: string; priority: "high" | "medium" | "low"; estimatedMinutes: number }>;
  }>({
    name: "",
    description: "",
    category: "custom",
    tasks: [{ id: "new-1", title: "", description: "", priority: "medium", estimatedMinutes: 15 }],
  });

  const [applyForm, setApplyForm] = useState({
    assignType: "cs" as "cs" | "squad",
    assignedToId: "",
    dueDate: "",
  });

  useEffect(() => {
    async function loadCSOwners() {
      try {
        const res = await fetch("/api/cs-owners");
        if (res.ok) {
          const data = await res.json();
          setCsOwners(data);
        }
      } catch (error) {
        console.error("Erro ao carregar CS Owners:", error);
      }
      setLoadingCS(false);
    }
    loadCSOwners();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCSDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCSOwners = useMemo(() => {
    if (!searchQuery) return csOwners;
    const query = searchQuery.toLowerCase();
    return csOwners.filter(cs => 
      cs.name.toLowerCase().includes(query) ||
      cs.email.toLowerCase().includes(query) ||
      cs.role.toLowerCase().includes(query)
    );
  }, [searchQuery, csOwners]);

  const selectedCSOwner = selectedCS ? csOwners.find(cs => cs.id === selectedCS) : null;

  const totalCompleted = csOwners.reduce((acc, cs) => acc + cs.completedToday, 0);
  const totalPending = csOwners.reduce((acc, cs) => acc + cs.pendingTasks, 0);
  const overduePendings = mockPendings.filter(p => p.status === "overdue").length;
  const urgentDemands = mockDemands.filter(d => d.priority === "urgent" && d.status !== "completed").length;

  const filteredActivities = selectedCS 
    ? mockTeamActivities.filter(a => a.csOwnerId === selectedCS)
    : mockTeamActivities;

  const filteredPendings = selectedCS
    ? mockPendings.filter(p => p.csOwnerId === selectedCS)
    : mockPendings;

  const handleAddTask = () => {
    setNewTemplate(prev => ({
      ...prev,
      tasks: [...prev.tasks, { id: `new-${Date.now()}`, title: "", description: "", priority: "medium" as const, estimatedMinutes: 15 }]
    }));
  };

  const handleRemoveTask = (taskId: string) => {
    setNewTemplate(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    }));
  };

  const handleTaskChange = (taskId: string, field: string, value: string | number) => {
    setNewTemplate(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t)
    }));
  };

  const resetTemplateForm = () => {
    setNewTemplate({
      name: "",
      description: "",
      category: "custom",
      tasks: [{ id: "new-1", title: "", description: "", priority: "medium" as const, estimatedMinutes: 15 }],
    });
    setEditingTemplate(null);
    setShowNewTemplate(false);
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name || newTemplate.tasks.some(t => !t.title)) return;
    
    const template: ActivityTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name,
      description: newTemplate.description,
      category: newTemplate.category as ActivityTemplate["category"],
      tasks: newTemplate.tasks as TemplateTask[],
      createdBy: "Admin",
      createdAt: new Date().toISOString(),
      isDefault: false,
    };
    
    setTemplates(prev => [...prev, template]);
    resetTemplateForm();
  };

  const openEditModal = (template: ActivityTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      description: template.description,
      category: template.category,
      tasks: template.tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description ?? "",
        priority: t.priority,
        estimatedMinutes: t.estimatedMinutes ?? 15,
      })),
    });
    setShowNewTemplate(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate || !newTemplate.name || newTemplate.tasks.some(t => !t.title)) return;
    
    const updated: ActivityTemplate = {
      ...editingTemplate,
      name: newTemplate.name,
      description: newTemplate.description,
      category: newTemplate.category as ActivityTemplate["category"],
      tasks: newTemplate.tasks.map((t, index) => ({
        id: t.id.startsWith("new-") ? `${editingTemplate.id}-new-${Date.now()}-${index}` : t.id,
        title: t.title,
        description: t.description || undefined,
        priority: t.priority,
        estimatedMinutes: t.estimatedMinutes,
      })) as TemplateTask[],
    };
    
    setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updated : t));
    setAppliedTemplates(prev => prev.map(a =>
      a.templateId === editingTemplate.id
        ? { ...a, templateName: updated.name, totalTasks: updated.tasks.length }
        : a
    ));
    resetTemplateForm();
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate || !applyForm.assignedToId || !applyForm.dueDate) return;

    const applied: AppliedTemplate = {
      id: `applied-${Date.now()}`,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      assignedToId: applyForm.assignType === "cs" ? applyForm.assignedToId : null,
      assignedToSquad: applyForm.assignType === "squad" ? applyForm.assignedToId : null,
      appliedBy: "Admin",
      appliedAt: new Date().toISOString(),
      dueDate: applyForm.dueDate,
      status: "active",
      completedTasks: 0,
      totalTasks: selectedTemplate.tasks.length,
    };

    setAppliedTemplates(prev => [...prev, applied]);
    setApplyForm({ assignType: "cs", assignedToId: "", dueDate: "" });
    setSelectedTemplate(null);
    setShowApplyTemplate(false);
  };

  const openApplyModal = (template: ActivityTemplate) => {
    setSelectedTemplate(template);
    setShowApplyTemplate(true);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Operação" subtitle="Gestão da equipe de CS" showFilters={false} />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Atividades Hoje"
            value={totalCompleted}
            suffix=" concluídas"
            icon={CheckCircle2}
            gradient="from-emerald-500 to-teal-500"
          />
          <MetricCard
            label="Pendências"
            value={totalPending}
            suffix={overduePendings > 0 ? ` (${overduePendings} atrasadas)` : ""}
            icon={Clock}
            gradient="from-orange-500 to-amber-500"
            alert={overduePendings > 0}
          />
          <MetricCard
            label="Demandas Abertas"
            value={mockDemands.filter(d => d.status !== "completed").length}
            suffix={urgentDemands > 0 ? ` (${urgentDemands} urgentes)` : ""}
            icon={FileText}
            gradient="from-blue-500 to-cyan-500"
            alert={urgentDemands > 0}
          />
          <MetricCard
            label="Templates Ativos"
            value={appliedTemplates.filter(t => t.status === "active").length}
            suffix={` de ${templates.length}`}
            icon={LayoutTemplate}
            gradient="from-violet-500 to-purple-500"
          />
        </div>

        <Link href="/admin/operacao/performance">
          <Card className="group border-amber-200/50 dark:border-amber-500/20 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-500/5 dark:to-orange-500/5 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Performance da Equipe</h3>
                    <p className="text-sm text-muted-foreground">
                      Veja o ranking, métricas e metas dos CS Owners
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <span className="text-sm font-medium group-hover:underline">Ver dashboard</span>
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={selectedCSOwner ? selectedCSOwner.name : searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedCS(null);
                      setShowCSDropdown(true);
                    }}
                    onFocus={() => setShowCSDropdown(true)}
                    placeholder="Buscar CS por nome, email ou cargo..."
                    className="w-full pl-9 pr-10 py-2 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  {(selectedCS || searchQuery) && (
                    <button
                      onClick={() => {
                        setSelectedCS(null);
                        setSearchQuery("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showCSDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-80 overflow-auto"
                    >
                      <div
                        className={cn(
                          "px-3 py-2 text-sm cursor-pointer hover:bg-muted flex items-center gap-2",
                          !selectedCS && "bg-primary/5 text-primary"
                        )}
                        onClick={() => {
                          setSelectedCS(null);
                          setSearchQuery("");
                          setShowCSDropdown(false);
                        }}
                      >
                        <Users className="h-4 w-4" />
                        <span className="font-medium">Todos os CS</span>
                        <span className="text-muted-foreground ml-auto">{csOwners.length}</span>
                      </div>
                      <div className="border-t" />
                      {filteredCSOwners.length > 0 ? (
                        filteredCSOwners.map((cs) => (
                          <div
                            key={cs.id}
                            className={cn(
                              "px-3 py-2 cursor-pointer hover:bg-muted flex items-center gap-3",
                              selectedCS === cs.id && "bg-primary/5"
                            )}
                            onClick={() => {
                              setSelectedCS(cs.id);
                              setSearchQuery("");
                              setShowCSDropdown(false);
                            }}
                          >
                            <div className="relative">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs font-semibold">
                                {cs.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background",
                                cs.status === "online" && "bg-success",
                                cs.status === "busy" && "bg-warning",
                                cs.status === "offline" && "bg-muted-foreground"
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{cs.name}</p>
                              <p className="text-xs text-muted-foreground">{cs.role}</p>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              <p>{cs.accountsCount} contas</p>
                              {mockPendings.filter(p => p.csOwnerId === cs.id && p.status === "overdue").length > 0 && (
                                <p className="text-danger">{mockPendings.filter(p => p.csOwnerId === cs.id && p.status === "overdue").length} atrasadas</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                          Nenhum CS encontrado
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {selectedCSOwner && (
                <Link href={`/admin/operacao/cs/${selectedCSOwner.id}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    Ver perfil completo
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="team">Equipe</TabsTrigger>
              <TabsTrigger value="templates">
                Templates
                <Badge variant="secondary" size="sm" className="ml-2">{templates.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="activities">Atividades</TabsTrigger>
              <TabsTrigger value="pendings">Pendências</TabsTrigger>
              <TabsTrigger value="demands">Demandas</TabsTrigger>
            </TabsList>
            {activeTab === "demands" && (
              <Button size="sm" className="gap-2" onClick={() => setShowNewDemand(true)}>
                <Plus className="h-4 w-4" />
                Nova Demanda
              </Button>
            )}
            {activeTab === "templates" && (
              <Button size="sm" className="gap-2" onClick={() => setShowNewTemplate(true)}>
                <Plus className="h-4 w-4" />
                Novo Template
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Performance da Equipe</CardTitle>
                        <CardDescription>Progresso do checklist diário por CS</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {csOwners.slice(0, 4).map((cs) => {
                          const total = cs.totalTasks || (cs.completedToday + cs.pendingTasks);
                          const percentage = total > 0 ? Math.round((cs.completedToday / total) * 100) : 0;
                          return (
                            <Link key={cs.id} href={`/admin/operacao/cs/${cs.id}`} className="block">
                              <div className="space-y-2 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs font-semibold">
                                        {cs.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                      </div>
                                      <div className={cn(
                                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                                        cs.status === "online" && "bg-success",
                                        cs.status === "busy" && "bg-warning",
                                        cs.status === "offline" && "bg-muted-foreground"
                                      )} />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{cs.name}</p>
                                      <p className="text-xs text-muted-foreground">{cs.accountsCount} contas</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-right">
                                      <span className="font-semibold">{cs.completedToday}</span>
                                      <span className="text-muted-foreground text-sm"> / {total}</span>
                                    </div>
                                    {mockPendings.filter(p => p.csOwnerId === cs.id && p.status === "overdue").length > 0 && (
                                      <Badge variant="danger" size="sm">
                                        {mockPendings.filter(p => p.csOwnerId === cs.id && p.status === "overdue").length} atrasadas
                                      </Badge>
                                    )}
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </div>
                                <Progress value={percentage} className="h-2" />
                              </div>
                            </Link>
                          );
                        })}
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("team")}>
                          Ver toda equipe
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Templates Aplicados</CardTitle>
                            <CardDescription>Checklists ativos para a equipe</CardDescription>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setActiveTab("templates")}>
                            Ver todos
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {appliedTemplates.filter(t => t.status === "active").slice(0, 4).map((applied) => {
                          const assignee = applied.assignedToId 
                            ? csOwners.find(cs => cs.id === applied.assignedToId)
                            : applied.assignedToSquad 
                              ? getSquadById(applied.assignedToSquad)
                              : null;
                          const progress = Math.round((applied.completedTasks / applied.totalTasks) * 100);
                          
                          return (
                            <div key={applied.id} className="flex items-center gap-3 p-3 rounded-lg border">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ClipboardList className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{applied.templateName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {applied.assignedToId ? (assignee as { name: string })?.name : `Squad: ${(assignee as { name: string })?.name}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold">{progress}%</p>
                                <p className="text-xs text-muted-foreground">{applied.completedTasks}/{applied.totalTasks}</p>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Alertas</CardTitle>
                          <Badge variant="danger">{overduePendings + urgentDemands}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {overduePendings > 0 && (
                          <div className="rounded-lg border border-danger/30 bg-danger/5 p-3">
                            <div className="flex items-center gap-2 text-danger">
                              <AlertCircle className="h-4 w-4" />
                              <span className="font-medium text-sm">{overduePendings} pendências atrasadas</span>
                            </div>
                          </div>
                        )}
                        {urgentDemands > 0 && (
                          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                            <div className="flex items-center gap-2 text-warning">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="font-medium text-sm">{urgentDemands} demandas urgentes</span>
                            </div>
                          </div>
                        )}
                        {overduePendings === 0 && urgentDemands === 0 && (
                          <div className="text-center py-4">
                            <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Nenhum alerta</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-purple-200/50 dark:border-purple-500/20">
                      <CardHeader className="pb-2 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-transparent">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Brain className="h-5 w-5 text-purple-500" />
                              {generating && (
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                                </span>
                              )}
                            </div>
                            <CardTitle className="text-lg">Insights IA</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleGeneratePortfolioInsights}
                            disabled={generating}
                            className="h-8 gap-1"
                          >
                            {generating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Zap className="h-3 w-3 text-purple-500" />
                            )}
                            Gerar
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-3">
                        {aiInsights.filter(i => i.status === "active").length === 0 ? (
                          <div className="text-center py-4">
                            <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Nenhum insight gerado</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={handleGeneratePortfolioInsights}
                              disabled={generating}
                            >
                              <Zap className="h-3 w-3 mr-1 text-purple-500" />
                              Gerar insights
                            </Button>
                          </div>
                        ) : (
                          aiInsights.filter(i => i.status === "active").slice(0, 3).map((insight) => (
                            <div
                              key={insight.id}
                              className={cn(
                                "group rounded-lg border p-3 transition-all hover:shadow-sm",
                                insight.type === "warning" || insight.type === "alert"
                                  ? "border-warning/30 bg-warning/5"
                                  : insight.type === "opportunity"
                                  ? "border-emerald-200/50 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5"
                                  : ""
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium text-sm line-clamp-2">{insight.insight}</p>
                                  {insight.csOwnerName && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      CS: {insight.csOwnerName}
                                    </p>
                                  )}
                                  {insight.accountName && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Empresa: {insight.accountName}
                                    </p>
                                  )}
                                  {insight.actionSuggested && (
                                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                                      <ArrowRight className="h-3 w-3" />
                                      {insight.actionSuggested}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => addFeedback(insight.id, "positive")}
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => dismiss(insight.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        {aiInsights.filter(i => i.status === "active").length > 3 && (
                          <Link href="/admin/insights">
                            <Button variant="ghost" size="sm" className="w-full">
                              Ver todos os insights
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="team" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {csOwners.map((cs) => (
                    <CSCard key={cs.id} cs={cs} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="templates" className="mt-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Templates Aplicados</CardTitle>
                          <CardDescription>{appliedTemplates.filter(t => t.status === "active").length} templates ativos</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {appliedTemplates.filter(t => t.status === "active").map((applied) => {
                        const assignee = applied.assignedToId 
                          ? csOwners.find(cs => cs.id === applied.assignedToId)
                          : applied.assignedToSquad 
                            ? getSquadById(applied.assignedToSquad)
                            : null;
                        const progress = Math.round((applied.completedTasks / applied.totalTasks) * 100);
                        
                        return (
                          <motion.div
                            key={applied.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-4 p-4 rounded-xl border"
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <ClipboardList className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{applied.templateName}</p>
                                <Badge variant="info" size="sm">Ativo</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  {applied.assignedToId ? <User className="h-3 w-3" /> : <UsersRound className="h-3 w-3" />}
                                  {applied.assignedToId ? (assignee as { name: string })?.name : `Squad: ${(assignee as { name: string })?.name}`}
                                </span>
                                <span>Prazo: {formatDate(applied.dueDate)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                <Progress value={progress} className="w-20 h-2" />
                                <span className="text-sm font-semibold">{progress}%</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{applied.completedTasks} de {applied.totalTasks} tarefas</p>
                            </div>
                          </motion.div>
                        );
                      })}
                      {appliedTemplates.filter(t => t.status === "active").length === 0 && (
                        <div className="text-center py-8">
                          <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Nenhum template aplicado</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Templates Disponíveis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {templates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onApply={() => openApplyModal(template)}
                          onEdit={() => openEditModal(template)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activities" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Histórico de Atividades</CardTitle>
                        <CardDescription>
                          {selectedCSOwner 
                            ? `Atividades de ${selectedCSOwner.name}`
                            : "Todas as atividades da equipe"
                          }
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredActivities.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <ActivityRow activity={activity} showCS={!selectedCS} />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pendings" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Pendências Atrasadas</CardTitle>
                      <CardDescription>{filteredPendings.filter(p => p.status === "overdue").length} itens</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {filteredPendings.filter(p => p.status === "overdue").map((pending) => (
                        <PendingRow key={pending.id} pending={pending} showCS={!selectedCS} />
                      ))}
                      {filteredPendings.filter(p => p.status === "overdue").length === 0 && (
                        <div className="text-center py-8">
                          <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Nenhuma pendência atrasada</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Pendências do Dia</CardTitle>
                      <CardDescription>{filteredPendings.filter(p => p.status === "pending").length} itens</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {filteredPendings.filter(p => p.status === "pending").map((pending) => (
                        <PendingRow key={pending.id} pending={pending} showCS={!selectedCS} />
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="demands" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Demandas da Operação</CardTitle>
                    <CardDescription>Gerencie solicitações e escalonamentos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockDemands.map((demand) => (
                        <DemandRow key={demand.id} demand={demand} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>

        <AnimatePresence>
          {showNewDemand && (
            <NewDemandModal 
              onClose={() => setShowNewDemand(false)}
              newDemand={newDemand}
              setNewDemand={setNewDemand}
              csOwners={csOwners}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showNewTemplate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={resetTemplateForm}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">
                    {editingTemplate ? "Editar Template" : "Criar Novo Template"}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={resetTemplateForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Nome do Template</label>
                      <input
                        type="text"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Rotina Semanal de Nutrição"
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Categoria</label>
                      <select
                        value={newTemplate.category}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="daily">Diário</option>
                        <option value="weekly">Semanal</option>
                        <option value="onboarding">Onboarding</option>
                        <option value="nutrition">Nutrição</option>
                        <option value="research">Pesquisa</option>
                        <option value="custom">Personalizado</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Descrição</label>
                    <textarea
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva o objetivo deste template..."
                      className="w-full min-h-[60px] rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">Tarefas</label>
                      <Button variant="outline" size="sm" onClick={handleAddTask} className="gap-1">
                        <Plus className="h-3 w-3" />
                        Adicionar Tarefa
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {newTemplate.tasks.map((task, index) => (
                        <div key={task.id} className="rounded-lg border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Tarefa {index + 1}</span>
                            {newTemplate.tasks.length > 1 && (
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveTask(task.id)}>
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => handleTaskChange(task.id, "title", e.target.value)}
                            placeholder="Título da tarefa"
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          <input
                            type="text"
                            value={task.description || ""}
                            onChange={(e) => handleTaskChange(task.id, "description", e.target.value)}
                            placeholder="Descrição (opcional)"
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <select
                                value={task.priority}
                                onChange={(e) => handleTaskChange(task.id, "priority", e.target.value)}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              >
                                <option value="high">Alta prioridade</option>
                                <option value="medium">Média prioridade</option>
                                <option value="low">Baixa prioridade</option>
                              </select>
                            </div>
                            <div className="w-32">
                              <input
                                type="number"
                                value={task.estimatedMinutes || ""}
                                onChange={(e) => handleTaskChange(task.id, "estimatedMinutes", parseInt(e.target.value) || 0)}
                                placeholder="Minutos"
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t">
                  <Button variant="outline" onClick={resetTemplateForm}>
                    Cancelar
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                    disabled={!newTemplate.name || newTemplate.tasks.some(t => !t.title)}
                  >
                    {editingTemplate ? (
                      <>
                        <Edit className="h-4 w-4" />
                        Salvar alterações
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Criar Template
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showApplyTemplate && selectedTemplate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowApplyTemplate(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background rounded-xl shadow-xl w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Aplicar Template</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowApplyTemplate(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="rounded-lg border p-3 bg-muted/50">
                    <p className="font-semibold">{selectedTemplate.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.tasks.length} tarefas</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Atribuir para</label>
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant={applyForm.assignType === "cs" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setApplyForm(prev => ({ ...prev, assignType: "cs", assignedToId: "" }))}
                        className="flex-1 gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        CS Individual
                      </Button>
                      <Button
                        variant={applyForm.assignType === "squad" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setApplyForm(prev => ({ ...prev, assignType: "squad", assignedToId: "" }))}
                        className="flex-1 gap-2"
                      >
                        <UsersRound className="h-4 w-4" />
                        Squad
                      </Button>
                    </div>
                    <select
                      value={applyForm.assignedToId}
                      onChange={(e) => setApplyForm(prev => ({ ...prev, assignedToId: e.target.value }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Selecione...</option>
                      {applyForm.assignType === "cs" ? (
                        csOwners.map(cs => (
                          <option key={cs.id} value={cs.id}>{cs.name} - {cs.role}</option>
                        ))
                      ) : (
                        mockSquads.map(squad => (
                          <option key={squad.id} value={squad.id}>{squad.name} ({squad.members.length} membros)</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Prazo para conclusão</label>
                    <input
                      type="date"
                      value={applyForm.dueDate}
                      onChange={(e) => setApplyForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium mb-2">Tarefas do template:</p>
                    <div className="space-y-1">
                      {selectedTemplate.tasks.map((task, index) => (
                        <div key={task.id} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{index + 1}.</span>
                          <span>{task.title}</span>
                          <Badge
                            variant={task.priority === "high" ? "danger-soft" : task.priority === "medium" ? "warning-soft" : "secondary"}
                            size="sm"
                            className="ml-auto"
                          >
                            {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t">
                  <Button variant="outline" onClick={() => setShowApplyTemplate(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    className="gap-2"
                    onClick={handleApplyTemplate}
                    disabled={!applyForm.assignedToId || !applyForm.dueDate}
                  >
                    <Play className="h-4 w-4" />
                    Aplicar Template
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  icon: Icon,
  gradient,
  alert,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  alert?: boolean;
}) {
  return (
    <Card className={alert ? "border-danger/30" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm", gradient)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          {alert && <AlertCircle className="h-4 w-4 text-danger" />}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{value}</span>
          {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function CSCard({ cs }: { cs: DBCSOwner }) {
  const total = cs.totalTasks || (cs.completedToday + cs.pendingTasks);
  const percentage = total > 0 ? Math.round((cs.completedToday / total) * 100) : 0;

  return (
    <Link href={`/admin/operacao/cs/${cs.id}`}>
      <Card className="hover:shadow-md transition-all cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-semibold">
                  {cs.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                  cs.status === "ONLINE" && "bg-success",
                  cs.status === "BUSY" && "bg-warning",
                  cs.status === "OFFLINE" && "bg-muted-foreground"
                )} />
              </div>
              <div>
                <p className="font-semibold">{cs.name}</p>
                <p className="text-xs text-muted-foreground">{cs.role}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">{cs.accountsCount}</p>
                <p className="text-xs text-muted-foreground">Contas</p>
              </div>
              <div className={cn("text-center p-2 rounded-lg", cs.accountsAtRisk > 0 ? "bg-danger/10" : "bg-muted/50")}>
                <p className={cn("text-lg font-bold", cs.accountsAtRisk > 0 && "text-danger")}>{cs.accountsAtRisk}</p>
                <p className="text-xs text-muted-foreground">Em Risco</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TemplateCard({ template, onApply, onEdit }: { template: ActivityTemplate; onApply: () => void; onEdit: () => void }) {
  const totalMinutes = template.tasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  
  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">{template.name}</p>
              <Badge className={cn("mt-1", categoryColors[template.category])} size="sm">
                {categoryLabels[template.category]}
              </Badge>
            </div>
          </div>
          {template.isDefault && (
            <Badge variant="secondary" size="sm">Padrão</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>{template.tasks.length} tarefas</span>
          <span>~{totalMinutes} min</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={onApply}>
            <Play className="h-3 w-3" />
            Aplicar
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} title="Editar template">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityRow({ activity, showCS = true }: { activity: TeamActivity; showCS?: boolean }) {
  const csOwner = getCSOwnerById(activity.csOwnerId);
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:shadow-sm transition-all">
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        activity.type === "call" && "bg-blue-100 text-blue-600",
        activity.type === "email" && "bg-purple-100 text-purple-600",
        activity.type === "meeting" && "bg-orange-100 text-orange-600",
        activity.type === "whatsapp" && "bg-green-100 text-green-600",
        activity.type === "note" && "bg-slate-100 text-slate-600",
        activity.type === "task" && "bg-pink-100 text-pink-600"
      )}>
        {activity.type === "call" && <Phone className="h-4 w-4" />}
        {activity.type === "email" && <Mail className="h-4 w-4" />}
        {activity.type === "meeting" && <Calendar className="h-4 w-4" />}
        {activity.type === "whatsapp" && <MessageSquare className="h-4 w-4" />}
        {activity.type === "note" && <FileText className="h-4 w-4" />}
        {activity.type === "task" && <CheckCircle2 className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {showCS && csOwner && (
            <>
              <span className="font-medium text-sm">{csOwner.name}</span>
              <span className="text-muted-foreground">•</span>
            </>
          )}
          <span className="text-sm">{activity.company}</span>
          {activity.duration && (
            <Badge variant="secondary" size="sm">{activity.duration} min</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{activity.description}</p>
        {activity.outcome && (
          <p className="text-xs text-success mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {activity.outcome}
          </p>
        )}
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatRelativeTime(activity.timestamp)}
      </span>
    </div>
  );
}

function PendingRow({ pending, showCS = true }: { pending: Pending; showCS?: boolean }) {
  const csOwner = getCSOwnerById(pending.csOwnerId);
  
  return (
    <div className={cn(
      "rounded-xl border p-4",
      pending.status === "overdue" && "border-danger/30 bg-danger/5"
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            pending.type === "followup" && "bg-blue-100 text-blue-600",
            pending.type === "checklist" && "bg-amber-100 text-amber-600",
            pending.type === "delivery" && "bg-purple-100 text-purple-600",
            pending.type === "nutrition" && "bg-emerald-100 text-emerald-600"
          )}>
            {pending.type === "followup" && <Phone className="h-4 w-4" />}
            {pending.type === "checklist" && <CheckCircle2 className="h-4 w-4" />}
            {pending.type === "delivery" && <FileText className="h-4 w-4" />}
            {pending.type === "nutrition" && <Send className="h-4 w-4" />}
          </div>
          <div>
            <p className="font-medium text-sm">{pending.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {showCS && csOwner && <span>{csOwner.name}</span>}
              {pending.company && (
                <>
                  {showCS && <span>•</span>}
                  <span>{pending.company}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Badge
          variant={pending.status === "overdue" ? "danger" : pending.priority === "high" ? "warning" : "secondary"}
          size="sm"
        >
          {pending.status === "overdue" ? "Atrasado" : pending.priority === "high" ? "Alta" : "Normal"}
        </Badge>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-muted-foreground">
          {pending.status === "overdue" ? "Era para " : "Para "}{formatDate(pending.dueDate)}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Cobrar</Button>
          <Button variant="ghost" size="sm">Ver</Button>
        </div>
      </div>
    </div>
  );
}

function DemandRow({ demand }: { demand: Demand }) {
  const assignedTo = demand.assignedToId ? getCSOwnerById(demand.assignedToId) : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border p-4",
        demand.priority === "urgent" && demand.status !== "completed" && "border-danger/30 bg-danger/5"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            demand.type === "escalation" && "bg-danger/10 text-danger",
            demand.type === "support" && "bg-blue-100 text-blue-600",
            demand.type === "request" && "bg-purple-100 text-purple-600",
            demand.type === "internal" && "bg-slate-100 text-slate-600"
          )}>
            {demand.type === "escalation" && <AlertTriangle className="h-5 w-5" />}
            {demand.type === "support" && <MessageSquare className="h-5 w-5" />}
            {demand.type === "request" && <FileText className="h-5 w-5" />}
            {demand.type === "internal" && <Target className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold">{demand.title}</p>
              <Badge
                variant={demand.priority === "urgent" ? "danger" : demand.priority === "high" ? "warning" : "secondary"}
                size="sm"
              >
                {demand.priority === "urgent" ? "Urgente" : demand.priority === "high" ? "Alta" : demand.priority === "medium" ? "Média" : "Baixa"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{demand.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {demand.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {demand.company}
                </span>
              )}
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {assignedTo ? assignedTo.name : "Não atribuído"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Prazo: {formatDate(demand.dueDate)}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
        {demand.status === "open" && <Button variant="outline" size="sm">Atribuir</Button>}
        {demand.status === "in_progress" && <Button variant="outline" size="sm">Marcar concluída</Button>}
        <Button variant="ghost" size="sm">Detalhes</Button>
      </div>
    </motion.div>
  );
}

function NewDemandModal({
  onClose,
  newDemand,
  setNewDemand,
  csOwners,
}: {
  onClose: () => void;
  newDemand: {
    title: string;
    description: string;
    company: string;
    assignedTo: string;
    priority: string;
    type: string;
    dueDate: string;
  };
  setNewDemand: React.Dispatch<React.SetStateAction<typeof newDemand>>;
  csOwners: DBCSOwner[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background rounded-xl shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Nova Demanda</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <input
              type="text"
              value={newDemand.title}
              onChange={(e) => setNewDemand(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Escalonamento de cliente"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Descrição</label>
            <textarea
              value={newDemand.description}
              onChange={(e) => setNewDemand(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva a demanda..."
              className="w-full min-h-[80px] rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Empresa</label>
              <input
                type="text"
                value={newDemand.company}
                onChange={(e) => setNewDemand(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Nome da empresa"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Atribuir para</label>
              <select
                value={newDemand.assignedTo}
                onChange={(e) => setNewDemand(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Não atribuído</option>
                {csOwners.map(cs => (
                  <option key={cs.id} value={cs.id}>{cs.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tipo</label>
              <select
                value={newDemand.type}
                onChange={(e) => setNewDemand(prev => ({ ...prev, type: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="request">Solicitação</option>
                <option value="escalation">Escalonamento</option>
                <option value="support">Suporte</option>
                <option value="internal">Interna</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Prioridade</label>
              <select
                value={newDemand.priority}
                onChange={(e) => setNewDemand(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Prazo</label>
              <input
                type="date"
                value={newDemand.dueDate}
                onChange={(e) => setNewDemand(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="gap-2">
            <Send className="h-4 w-4" />
            Criar Demanda
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
