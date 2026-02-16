"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  MessageSquare,
  Users,
  Calendar,
  Clock,
  Plus,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  Send,
  Target,
  Bell,
  RefreshCw,
  FileText,
  Video,
  Mic,
  Building2,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
}

interface WhatsAppGroup {
  id: string;
  name: string;
  company: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  members: number;
}

interface Followup {
  id: string;
  company: string;
  contact: string;
  type: "call" | "email" | "meeting" | "whatsapp";
  dueDate: string;
  notes: string;
  status: "pending" | "completed" | "overdue";
}

interface NutritionAction {
  id: string;
  company: string;
  type: "content" | "checkin" | "tip" | "case_study";
  title: string;
  scheduledDate: string;
  status: "scheduled" | "sent" | "opened" | "clicked";
}

interface Activity {
  id: string;
  type: "call" | "email" | "meeting" | "note" | "task" | "whatsapp";
  company: string;
  description: string;
  timestamp: string;
  duration?: number;
  outcome?: string;
}

const activityTypes = [
  { id: "call", label: "Call", icon: Phone, color: "bg-blue-100 text-blue-600 hover:bg-blue-200" },
  { id: "email", label: "Email", icon: Mail, color: "bg-purple-100 text-purple-600 hover:bg-purple-200" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "bg-green-100 text-green-600 hover:bg-green-200" },
  { id: "meeting", label: "Reunião", icon: Video, color: "bg-orange-100 text-orange-600 hover:bg-orange-200" },
  { id: "note", label: "Nota", icon: FileText, color: "bg-slate-100 text-slate-600 hover:bg-slate-200" },
];

const mockCompanies = [
  "TechCorp Brasil",
  "Varejo Express",
  "Fintech Solutions",
  "LogiTech",
  "HealthPlus",
  "EduTech",
];

const mockData = {
  csOwner: {
    name: "Carlos Silva",
    role: "CS Care Lead",
    avatar: "CS",
    accountsCount: 12,
    healthyAccounts: 8,
    atRiskAccounts: 3,
    criticalAccounts: 1,
  },
  dailyChecklist: [
    { id: "1", title: "Revisar alertas críticos", description: "Verificar contas com health score abaixo de 40", completed: true, priority: "high" },
    { id: "2", title: "Responder grupos de WhatsApp", description: "Máximo 2h de SLA", completed: true, priority: "high" },
    { id: "3", title: "Followups do dia", description: "3 followups pendentes", completed: false, priority: "high" },
    { id: "4", title: "Atualizar status das entregas", description: "Sincronizar com squads", completed: false, priority: "medium" },
    { id: "5", title: "Enviar nutrição programada", description: "2 conteúdos agendados", completed: false, priority: "medium" },
    { id: "6", title: "Revisar NPS pendentes", description: "Analisar feedbacks recebidos", completed: false, priority: "low" },
  ] as ChecklistItem[],
  whatsappGroups: [
    { id: "1", name: "TechCorp - Projeto ICIA", company: "TechCorp Brasil", lastMessage: "Conseguimos resolver o bug de integração!", lastMessageTime: "2026-01-22T10:30:00", unreadCount: 3, members: 8 },
    { id: "2", name: "Varejo Express - Suporte", company: "Varejo Express", lastMessage: "Quando podemos agendar o treinamento?", lastMessageTime: "2026-01-22T09:15:00", unreadCount: 1, members: 5 },
    { id: "3", name: "Fintech Solutions - CS", company: "Fintech Solutions", lastMessage: "Obrigado pelo material enviado!", lastMessageTime: "2026-01-21T18:45:00", unreadCount: 0, members: 6 },
    { id: "4", name: "LogiTech - Implementação", company: "LogiTech", lastMessage: "Vamos precisar de uma call amanhã", lastMessageTime: "2026-01-21T16:20:00", unreadCount: 2, members: 7 },
  ] as WhatsAppGroup[],
  followups: [
    { id: "1", company: "TechCorp Brasil", contact: "João Silva", type: "call", dueDate: "2026-01-22", notes: "Discutir expansão do contrato", status: "pending" },
    { id: "2", company: "Varejo Express", contact: "Maria Santos", type: "meeting", dueDate: "2026-01-22", notes: "Review mensal de resultados", status: "pending" },
    { id: "3", company: "Fintech Solutions", contact: "Pedro Costa", type: "email", dueDate: "2026-01-22", notes: "Enviar proposta de upsell", status: "pending" },
    { id: "4", company: "HealthPlus", contact: "Ana Lima", type: "whatsapp", dueDate: "2026-01-21", notes: "Verificar satisfação pós-implementação", status: "overdue" },
  ] as Followup[],
  nutritionActions: [
    { id: "1", company: "TechCorp Brasil", type: "content", title: "Case de sucesso: ROI com IA", scheduledDate: "2026-01-22", status: "scheduled" },
    { id: "2", company: "Varejo Express", type: "tip", title: "5 dicas para otimizar dashboards", scheduledDate: "2026-01-22", status: "scheduled" },
    { id: "3", company: "Fintech Solutions", type: "checkin", title: "Check-in de satisfação mensal", scheduledDate: "2026-01-23", status: "scheduled" },
    { id: "4", company: "LogiTech", type: "case_study", title: "Estudo: Automação de processos", scheduledDate: "2026-01-24", status: "scheduled" },
  ] as NutritionAction[],
  recentActivities: [
    { id: "1", type: "call", company: "TechCorp Brasil", description: "Call de alinhamento sobre integração ERP", timestamp: "2026-01-22T09:00:00", duration: 30, outcome: "Definido próximos passos" },
    { id: "2", type: "whatsapp", company: "Varejo Express", description: "Respondido dúvida sobre relatórios", timestamp: "2026-01-22T08:45:00" },
    { id: "3", type: "email", company: "Fintech Solutions", description: "Enviado material de treinamento", timestamp: "2026-01-21T17:30:00" },
    { id: "4", type: "meeting", company: "HealthPlus", description: "Review trimestral com stakeholders", timestamp: "2026-01-21T14:00:00", duration: 60, outcome: "Cliente satisfeito, potencial expansão" },
    { id: "5", type: "note", company: "LogiTech", description: "Registrado feedback sobre nova feature", timestamp: "2026-01-21T11:00:00" },
  ] as Activity[],
  aiInsights: [
    { id: "1", type: "alert", title: "Varejo Express precisa de atenção", description: "Queda de 20% no engajamento esta semana. Recomendação: agendar call de diagnóstico.", priority: "high" },
    { id: "2", type: "opportunity", title: "TechCorp pronto para upsell", description: "Alto uso de features avançadas. Momento ideal para apresentar plano Enterprise.", priority: "medium" },
    { id: "3", type: "pattern", title: "Padrão identificado: Fintech Solutions", description: "Comportamento similar a clientes que expandiram contrato nos últimos 3 meses.", priority: "low" },
  ],
};

export default function CSOwnerPage() {
  const [checklist, setChecklist] = useState(mockData.dailyChecklist);
  const [activeTab, setActiveTab] = useState("overview");
  const [activities, setActivities] = useState(mockData.recentActivities);
  
  const [activityForm, setActivityForm] = useState({
    type: "call" as string,
    company: "",
    description: "",
    duration: "",
    outcome: "",
  });
  const [showActivityModal, setShowActivityModal] = useState(false);

  const completedTasks = checklist.filter(item => item.completed).length;
  const totalTasks = checklist.length;
  const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const pendingFollowups = mockData.followups.filter(f => f.status !== "completed");
  const overdueFollowups = mockData.followups.filter(f => f.status === "overdue");
  const totalUnread = mockData.whatsappGroups.reduce((acc, g) => acc + g.unreadCount, 0);

  const handleQuickActivity = (type: string) => {
    setActivityForm(prev => ({ ...prev, type }));
    setShowActivityModal(true);
  };

  const handleSubmitActivity = () => {
    if (!activityForm.company || !activityForm.description) return;
    
    const newActivity: Activity = {
      id: `new-${Date.now()}`,
      type: activityForm.type as Activity["type"],
      company: activityForm.company,
      description: activityForm.description,
      timestamp: new Date().toISOString(),
      duration: activityForm.duration ? parseInt(activityForm.duration) : undefined,
      outcome: activityForm.outcome || undefined,
    };
    
    setActivities(prev => [newActivity, ...prev]);
    setActivityForm({ type: "call", company: "", description: "", duration: "", outcome: "" });
    setShowActivityModal(false);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Minha Área" subtitle={`Olá, ${mockData.csOwner.name}`} showFilters={false} />

      <div className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="p-4">
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Registrar Atividade</p>
                      <p className="text-xs text-muted-foreground">O que você fez agora?</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{activities.length}</p>
                    <p className="text-xs text-muted-foreground">atividades hoje</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activityTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant="outline"
                      size="sm"
                      className={cn("flex-1 gap-2 border-0", type.color)}
                      onClick={() => handleQuickActivity(type.id)}
                    >
                      <type.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{type.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Progresso do Dia"
              value={progressPercentage}
              suffix="%"
              icon={Target}
              gradient="from-emerald-500 to-teal-500"
            />
            <MetricCard
              label="Followups Pendentes"
              value={pendingFollowups.length}
              suffix={overdueFollowups.length > 0 ? ` (${overdueFollowups.length} atrasados)` : ""}
              icon={Clock}
              gradient="from-orange-500 to-amber-500"
            />
            <MetricCard
              label="WhatsApp"
              value={totalUnread}
              suffix=" não lidas"
              icon={MessageSquare}
              gradient="from-green-500 to-emerald-500"
            />
            <MetricCard
              label="Minhas Contas"
              value={mockData.csOwner.accountsCount}
              suffix={` (${mockData.csOwner.atRiskAccounts} em risco)`}
              icon={Users}
              gradient="from-blue-500 to-cyan-500"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="activities">
                Atividades
                <Badge variant="secondary" size="sm" className="ml-2">{activities.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="followups">Followups</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrição</TabsTrigger>
            </TabsList>

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
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">Últimas Atividades</CardTitle>
                              <CardDescription>Seus registros mais recentes</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setActiveTab("activities")}>
                              Ver todas <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {activities.slice(0, 4).map((activity) => (
                            <ActivityRow key={activity.id} activity={activity} />
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">Checklist Diário</CardTitle>
                              <CardDescription>{completedTasks} de {totalTasks} tarefas concluídas</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={progressPercentage} className="w-24 h-2" />
                              <span className="text-sm font-semibold">{progressPercentage}%</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {checklist.slice(0, 4).map((item) => (
                            <motion.div
                              key={item.id}
                              layout
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm",
                                item.completed ? "bg-muted/50 opacity-60" : "bg-background"
                              )}
                              onClick={() => toggleChecklistItem(item.id)}
                            >
                              <div className="mt-0.5">
                                {item.completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-success" />
                                ) : (
                                  <Circle className={cn(
                                    "h-5 w-5",
                                    item.priority === "high" && "text-danger",
                                    item.priority === "medium" && "text-warning",
                                    item.priority === "low" && "text-muted-foreground"
                                  )} />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className={cn(
                                  "font-medium text-sm",
                                  item.completed && "line-through text-muted-foreground"
                                )}>
                                  {item.title}
                                </p>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                                )}
                              </div>
                              <Badge
                                variant={
                                  item.priority === "high" ? "danger-soft" :
                                  item.priority === "medium" ? "warning-soft" : "secondary"
                                }
                                size="sm"
                              >
                                {item.priority === "high" ? "Alta" : item.priority === "medium" ? "Média" : "Baixa"}
                              </Badge>
                            </motion.div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Insights da IA</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {mockData.aiInsights.map((insight) => (
                            <div
                              key={insight.id}
                              className={cn(
                                "rounded-xl border p-3",
                                insight.priority === "high" && "border-danger/30 bg-danger/5",
                                insight.priority === "medium" && "border-warning/30 bg-warning/5",
                                insight.priority === "low" && "border-info/30 bg-info/5"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <div className={cn(
                                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                                  insight.type === "alert" && "bg-danger/10 text-danger",
                                  insight.type === "opportunity" && "bg-success/10 text-success",
                                  insight.type === "pattern" && "bg-info/10 text-info"
                                )}>
                                  {insight.type === "alert" && <AlertCircle className="h-4 w-4" />}
                                  {insight.type === "opportunity" && <TrendingUp className="h-4 w-4" />}
                                  {insight.type === "pattern" && <Sparkles className="h-4 w-4" />}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{insight.title}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">WhatsApp</CardTitle>
                            {totalUnread > 0 && (
                              <Badge variant="success">{totalUnread} novas</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {mockData.whatsappGroups.slice(0, 3).map((group) => (
                            <div key={group.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white text-xs font-semibold">
                                {group.company.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{group.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{group.lastMessage}</p>
                              </div>
                              {group.unreadCount > 0 && (
                                <Badge variant="success" size="sm">{group.unreadCount}</Badge>
                              )}
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("whatsapp")}>
                            Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Followups Hoje</CardTitle>
                            <Badge variant={overdueFollowups.length > 0 ? "danger" : "secondary"}>
                              {pendingFollowups.length} pendentes
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {mockData.followups.slice(0, 3).map((followup) => (
                            <div key={followup.id} className={cn(
                              "flex items-center gap-3 p-2 rounded-lg",
                              followup.status === "overdue" && "bg-danger/5"
                            )}>
                              <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg",
                                followup.type === "call" && "bg-blue-100 text-blue-600",
                                followup.type === "email" && "bg-purple-100 text-purple-600",
                                followup.type === "meeting" && "bg-orange-100 text-orange-600",
                                followup.type === "whatsapp" && "bg-green-100 text-green-600"
                              )}>
                                {followup.type === "call" && <Phone className="h-4 w-4" />}
                                {followup.type === "email" && <Mail className="h-4 w-4" />}
                                {followup.type === "meeting" && <Calendar className="h-4 w-4" />}
                                {followup.type === "whatsapp" && <MessageSquare className="h-4 w-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{followup.company}</p>
                                <p className="text-xs text-muted-foreground">{followup.contact}</p>
                              </div>
                              {followup.status === "overdue" && (
                                <Badge variant="danger" size="sm">Atrasado</Badge>
                              )}
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("followups")}>
                            Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activities" className="mt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Histórico de Atividades</CardTitle>
                          <CardDescription>Todas as suas ações registradas</CardDescription>
                        </div>
                        <Button size="sm" className="gap-2" onClick={() => setShowActivityModal(true)}>
                          <Plus className="h-4 w-4" />
                          Nova Atividade
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {activities.map((activity, index) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="relative flex gap-4"
                          >
                            {index < activities.length - 1 && (
                              <div className="absolute left-5 top-12 bottom-0 w-px bg-border" />
                            )}
                            <ActivityRow activity={activity} showTimeline />
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="whatsapp" className="mt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Grupos de WhatsApp</CardTitle>
                          <CardDescription>{mockData.whatsappGroups.length} grupos ativos</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Atualizar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {mockData.whatsappGroups.map((group) => (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-4 p-4 rounded-xl border hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white font-semibold">
                            {group.company.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{group.name}</p>
                              {group.unreadCount > 0 && (
                                <Badge variant="success" size="sm">{group.unreadCount}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{group.lastMessage}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>{formatRelativeTime(group.lastMessageTime)}</span>
                              <span>•</span>
                              <span>{group.members} membros</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="followups" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Followups Pendentes</CardTitle>
                            <CardDescription>{pendingFollowups.length} followups para fazer</CardDescription>
                          </div>
                          <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Novo Followup
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {mockData.followups.map((followup) => (
                          <motion.div
                            key={followup.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "rounded-xl border p-4",
                              followup.status === "overdue" && "border-danger/30 bg-danger/5"
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "flex h-10 w-10 items-center justify-center rounded-lg",
                                  followup.type === "call" && "bg-blue-100 text-blue-600",
                                  followup.type === "email" && "bg-purple-100 text-purple-600",
                                  followup.type === "meeting" && "bg-orange-100 text-orange-600",
                                  followup.type === "whatsapp" && "bg-green-100 text-green-600"
                                )}>
                                  {followup.type === "call" && <Phone className="h-5 w-5" />}
                                  {followup.type === "email" && <Mail className="h-5 w-5" />}
                                  {followup.type === "meeting" && <Calendar className="h-5 w-5" />}
                                  {followup.type === "whatsapp" && <MessageSquare className="h-5 w-5" />}
                                </div>
                                <div>
                                  <p className="font-semibold">{followup.company}</p>
                                  <p className="text-sm text-muted-foreground">{followup.contact}</p>
                                </div>
                              </div>
                              <Badge
                                variant={followup.status === "overdue" ? "danger" : "secondary"}
                              >
                                {followup.status === "overdue" ? "Atrasado" : formatDate(followup.dueDate)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{followup.notes}</p>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="flex-1">
                                Marcar como feito
                              </Button>
                              <Button variant="ghost" size="sm">
                                Reagendar
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Calendário de Followups</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-12 text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Calendário em desenvolvimento</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="nutrition" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Nutrição Programada</CardTitle>
                            <CardDescription>Conteúdos e check-ins agendados</CardDescription>
                          </div>
                          <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Agendar
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {mockData.nutritionActions.map((action) => (
                          <motion.div
                            key={action.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "flex h-10 w-10 items-center justify-center rounded-lg",
                                  action.type === "content" && "bg-purple-100 text-purple-600",
                                  action.type === "checkin" && "bg-blue-100 text-blue-600",
                                  action.type === "tip" && "bg-amber-100 text-amber-600",
                                  action.type === "case_study" && "bg-emerald-100 text-emerald-600"
                                )}>
                                  {action.type === "content" && <Bell className="h-5 w-5" />}
                                  {action.type === "checkin" && <MessageSquare className="h-5 w-5" />}
                                  {action.type === "tip" && <Sparkles className="h-5 w-5" />}
                                  {action.type === "case_study" && <TrendingUp className="h-5 w-5" />}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{action.title}</p>
                                  <p className="text-xs text-muted-foreground">{action.company}</p>
                                </div>
                              </div>
                              <Badge variant="secondary" size="sm">
                                {formatDate(action.scheduledDate)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <Button variant="outline" size="sm" className="flex-1">
                                Enviar agora
                              </Button>
                              <Button variant="ghost" size="sm">
                                Editar
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Biblioteca de Conteúdos</CardTitle>
                        <CardDescription>Materiais prontos para envio</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {["Cases de sucesso", "Dicas de uso", "Novidades do produto", "Webinars gravados", "E-books"].map((content, index) => (
                          <Button key={index} variant="outline" className="w-full justify-between">
                            <span>{content}</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>

      <AnimatePresence>
        {showActivityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowActivityModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-xl shadow-xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Registrar Atividade</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowActivityModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Atividade</label>
                  <div className="flex flex-wrap gap-2">
                    {activityTypes.map((type) => (
                      <Button
                        key={type.id}
                        variant={activityForm.type === type.id ? "default" : "outline"}
                        size="sm"
                        className={cn("gap-2", activityForm.type === type.id ? "" : type.color)}
                        onClick={() => setActivityForm(prev => ({ ...prev, type: type.id }))}
                      >
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Empresa</label>
                  <select
                    value={activityForm.company}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Selecione uma empresa</option>
                    {mockCompanies.map((company) => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">O que você fez?</label>
                  <textarea
                    value={activityForm.description}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: Alinhei expectativas sobre o projeto, discuti próximos passos..."
                    className="w-full min-h-[100px] rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Duração (min)</label>
                    <input
                      type="number"
                      value={activityForm.duration}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="30"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Resultado</label>
                    <input
                      type="text"
                      value={activityForm.outcome}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, outcome: e.target.value }))}
                      placeholder="Ex: Cliente satisfeito"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t">
                <Button variant="outline" onClick={() => setShowActivityModal(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="gap-2"
                  onClick={handleSubmitActivity}
                  disabled={!activityForm.company || !activityForm.description}
                >
                  <Send className="h-4 w-4" />
                  Registrar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm", gradient)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
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

function ActivityRow({ 
  activity, 
  showTimeline = false 
}: { 
  activity: Activity;
  showTimeline?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border hover:shadow-sm transition-all",
      showTimeline && "flex-1"
    )}>
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg relative z-10",
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
          <span className="font-medium text-sm">{activity.company}</span>
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
