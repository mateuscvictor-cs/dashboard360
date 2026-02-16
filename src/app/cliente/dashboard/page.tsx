"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Users,
  Target,
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Users2,
  Play,
  Loader2,
  FolderOpen,
  UserPlus,
  Mail,
  X,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationBell } from "@/components/notifications";
import { OnboardingTimeline } from "@/components/cliente/onboarding-timeline";
import { cn, formatDate } from "@/lib/utils";

type Delivery = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  dueDate: string | null;
  assignee: string | null;
  impact: string;
};

type Workshop = {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: string;
  duration: string | null;
  participants: number;
  meetingLink: string | null;
};

type Hotseat = Workshop;

type CompletedDelivery = {
  id: string;
  title: string;
  completedDate: string;
};

type SupportContact = {
  name: string;
  role: string | null;
  email: string;
  phone: string | null;
};

type OnboardingStep = {
  id: string;
  type: "GROUP_CREATION" | "DIAGNOSTIC_FORM" | "ONBOARDING_MEETING" | "CUSTOM";
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  order: number;
  completedAt: string | null;
  dueDate: string | null;
};

type OnboardingData = {
  steps: OnboardingStep[];
  progress: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    percentage: number;
  };
};

type DashboardData = {
  companyName: string;
  logo: string | null;
  framework: string | null;
  segment: string | null;
  status: string;
  healthScore: number;
  overallProgress: number;
  contractStart: string | null;
  contractEnd: string | null;
  fathomLink: string | null;
  docsLink: string | null;
  csOwner: { name: string; email: string; avatar: string | null } | null;
  squad: { name: string } | null;
  metrics: {
    totalDeliveries: number;
    completedDeliveries: number;
    workshopsScheduled: number;
    hotseatsScheduled: number;
  };
  currentDeliveries: Delivery[];
  completedDeliveries: CompletedDelivery[];
  workshops: Workshop[];
  hotseats: Hotseat[];
  supportContacts: SupportContact[];
};

type CompanyMember = { id: string; name: string | null; email: string; createdAt: string };
type CompanyInvite = { id: string; email: string; status: string; expiresAt: string; createdAt: string; invitedBy: string | null };
type MembersStats = { limit: number; used: number; pending: number; remaining: number };

export default function ClienteDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [membersData, setMembersData] = useState<{
    members: CompanyMember[];
    invites: CompanyInvite[];
    stats: MembersStats;
  } | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    setMembersError(null);
    try {
      const res = await fetch("/api/cliente/company/members");
      if (res.ok) {
        const json = await res.json();
        setMembersData({ members: json.members, invites: json.invites, stats: json.stats });
      }
    } catch {
      setMembersError("Erro ao carregar membros");
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardRes, onboardingRes, membersRes] = await Promise.all([
          fetch("/api/cliente/dashboard"),
          fetch("/api/cliente/onboarding"),
          fetch("/api/cliente/company/members"),
        ]);

        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          setData(dashboardData);
        }

        if (onboardingRes.ok) {
          const onboarding = await onboardingRes.json();
          setOnboardingData(onboarding);
        } else {
          setOnboardingData({
            steps: [],
            progress: { total: 0, completed: 0, inProgress: 0, pending: 0, percentage: 0 },
          });
        }

        if (membersRes.ok) {
          const json = await membersRes.json();
          setMembersData({ members: json.members, invites: json.invites, stats: json.stats });
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setOnboardingData({
          steps: [],
          progress: { total: 0, completed: 0, inProgress: 0, pending: 0, percentage: 0 },
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setInviting(true);
    setMembersError(null);
    try {
      const res = await fetch("/api/cliente/company/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok) {
        setInviteEmail("");
        await fetchMembers();
      } else {
        setMembersError(json.error || "Erro ao enviar convite");
      }
    } catch {
      setMembersError("Erro ao enviar convite");
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (id: string) => {
    try {
      const res = await fetch(`/api/cliente/invites/${id}`, { method: "DELETE" });
      if (res.ok) await fetchMembers();
    } catch {
      setMembersError("Erro ao cancelar convite");
    }
  };

  const handleResendInvite = async (id: string) => {
    try {
      const res = await fetch(`/api/cliente/invites/${id}/resend`, { method: "POST" });
      if (res.ok) await fetchMembers();
    } catch {
      setMembersError("Erro ao reenviar convite");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground">
          Dados não disponíveis
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Entre em contato com o suporte.
        </p>
      </div>
    );
  }

  const totalSessions = data.metrics.workshopsScheduled + data.metrics.hotseatsScheduled;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{data.companyName}</h1>
                {data.framework && (
                  <Badge variant="info-soft" className="text-xs">
                    {data.framework}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {data.segment || "Projeto"} •{" "}
                {data.contractStart && `Início: ${formatDate(data.contractStart)}`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Badge variant="success" size="lg" className="gap-1.5">
                <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                Ativo
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        {onboardingData && (
          <OnboardingTimeline
            steps={onboardingData.steps}
            deliveries={data.currentDeliveries}
            progress={onboardingData.progress}
          />
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Progresso Geral"
            value={data.overallProgress}
            suffix="%"
            icon={Target}
            gradient="from-blue-500 to-cyan-500"
          />
          <MetricCard
            label="Entregas"
            value={data.metrics.completedDeliveries}
            suffix={` / ${data.metrics.totalDeliveries}`}
            icon={Package}
            gradient="from-emerald-500 to-teal-500"
          />
          <MetricCard
            label="Workshops"
            value={data.metrics.workshopsScheduled}
            suffix=" agendados"
            icon={GraduationCap}
            gradient="from-purple-500 to-pink-500"
          />
          <MetricCard
            label="Hotseats"
            value={data.metrics.hotseatsScheduled}
            suffix=" agendados"
            icon={Users2}
            gradient="from-orange-500 to-amber-500"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="deliveries">Entregas</TabsTrigger>
            <TabsTrigger value="sessions">Workshops & Hotseats</TabsTrigger>
            <TabsTrigger value="support">Suporte</TabsTrigger>
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
                        <CardTitle className="text-lg">Progresso do Projeto</CardTitle>
                        {data.contractEnd && (
                          <CardDescription>
                            Conclusão prevista: {formatDate(data.contractEnd)}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Progresso geral</span>
                            <span className="text-2xl font-bold">{data.overallProgress}%</span>
                          </div>
                          <Progress value={data.overallProgress} className="h-3" />

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                              <p className="text-2xl font-bold text-success">
                                {data.metrics.completedDeliveries}
                              </p>
                              <p className="text-xs text-muted-foreground">Concluídas</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                              <p className="text-2xl font-bold text-info">
                                {data.currentDeliveries.length}
                              </p>
                              <p className="text-xs text-muted-foreground">Em andamento</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                              <p className="text-2xl font-bold text-warning">{totalSessions}</p>
                              <p className="text-xs text-muted-foreground">Sessões agendadas</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Entregas em Andamento</CardTitle>
                          <Button variant="ghost" size="sm" onClick={() => setActiveTab("deliveries")}>
                            Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {data.currentDeliveries.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma entrega em andamento
                          </p>
                        ) : (
                          data.currentDeliveries.slice(0, 2).map((delivery) => (
                            <div key={delivery.id} className="rounded-xl border p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold">{delivery.title}</p>
                                  {delivery.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {delivery.description}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="info-soft">{delivery.progress}%</Badge>
                              </div>
                              <Progress value={delivery.progress} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-2">
                                {delivery.dueDate && `Prazo: ${formatDate(delivery.dueDate)}`}
                                {delivery.assignee && ` • ${delivery.assignee}`}
                              </p>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <UserPlus className="h-5 w-5 text-primary" />
                          Membros da empresa
                        </CardTitle>
                        <CardDescription>
                          Convide pessoas para acessar a área de membro (apenas /membro)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {membersError && (
                          <p className="text-sm text-destructive">{membersError}</p>
                        )}
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="Email do convidado"
                            className="flex-1"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                          />
                          <Button
                            size="sm"
                            onClick={handleInvite}
                            disabled={inviting || !inviteEmail.trim()}
                          >
                            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Convidar"}
                          </Button>
                        </div>
                        {loading ? null : membersData ? (
                          <>
                            {membersData.stats.limit > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {membersData.stats.used + membersData.stats.pending} de {membersData.stats.limit} vagas
                                {membersData.stats.remaining > 0 && ` · ${membersData.stats.remaining} restantes`}
                              </p>
                            )}
                            {membersData.members.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">Membros ativos</p>
                                <ul className="space-y-2">
                                  {membersData.members.map((m) => (
                                    <li key={m.id} className="flex items-center gap-2 text-sm">
                                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                                        {(m.name || m.email).charAt(0).toUpperCase()}
                                      </div>
                                      <span className="font-medium truncate">{m.name || "—"}</span>
                                      <span className="text-muted-foreground truncate">{m.email}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {membersData.invites.filter((i) => i.status === "PENDING").length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">Convites pendentes</p>
                                <ul className="space-y-2">
                                  {membersData.invites
                                    .filter((i) => i.status === "PENDING")
                                    .map((i) => (
                                      <li
                                        key={i.id}
                                        className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded-md bg-muted/50"
                                      >
                                        <span className="flex items-center gap-2 truncate">
                                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                          {i.email}
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => handleResendInvite(i.id)}
                                            aria-label="Reenviar convite"
                                          >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => handleCancelInvite(i.id)}
                                            aria-label="Cancelar convite"
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            )}
                            {membersData.members.length === 0 &&
                              membersData.invites.filter((i) => i.status === "PENDING").length === 0 && (
                                <p className="text-sm text-muted-foreground py-2">
                                  Nenhum membro ainda. Envie um convite por email.
                                </p>
                              )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">
                            Envie um convite por email para adicionar membros à empresa.
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Próximas Sessões</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {[...data.workshops.slice(0, 1), ...data.hotseats.slice(0, 1)].length ===
                        0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma sessão agendada
                          </p>
                        ) : (
                          [...data.workshops.slice(0, 1), ...data.hotseats.slice(0, 1)].map(
                            (session, index) => (
                              <div key={index} className="rounded-lg border p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  {index === 0 && data.workshops.length > 0 ? (
                                    <GraduationCap className="h-4 w-4 text-purple-500" />
                                  ) : (
                                    <Users2 className="h-4 w-4 text-orange-500" />
                                  )}
                                  <p className="font-medium text-sm">{session.title}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(session.scheduledDate)}
                                  {session.duration && ` • ${session.duration}`}
                                </p>
                              </div>
                            )
                          )
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setActiveTab("sessions")}
                        >
                          Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Equipe Responsável</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {data.csOwner && (
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-semibold">
                              {data.csOwner.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{data.csOwner.name}</p>
                              <p className="text-xs text-muted-foreground">CS Owner</p>
                            </div>
                          </div>
                        )}
                        {data.squad && (
                          <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-xs text-muted-foreground mb-1">Squad</p>
                            <p className="font-medium text-sm">{data.squad.name}</p>
                          </div>
                        )}
                        {data.fathomLink && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => window.open(data.fathomLink!, "_blank")}
                          >
                            <Play className="h-4 w-4" />
                            Ver reunião gravada
                          </Button>
                        )}
                      </CardContent>
                    </Card>

                    {data.docsLink && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Documentos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-between"
                            onClick={() => window.open(data.docsLink!, "_blank")}
                          >
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Documentos do Projeto
                            </span>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="deliveries" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Entregas em Andamento</CardTitle>
                      <CardDescription>
                        {data.currentDeliveries.length} entregas ativas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {data.currentDeliveries.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Nenhuma entrega em andamento
                        </p>
                      ) : (
                        data.currentDeliveries.map((delivery) => (
                          <DeliveryCard
                            key={delivery.id}
                            delivery={delivery}
                            isExpanded={selectedDelivery === delivery.id}
                            onToggle={() =>
                              setSelectedDelivery(
                                selectedDelivery === delivery.id ? null : delivery.id
                              )
                            }
                          />
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <CardTitle className="text-lg">Concluídas</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {data.completedDeliveries.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhuma entrega concluída
                        </p>
                      ) : (
                        data.completedDeliveries.map((delivery) => (
                          <div
                            key={delivery.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20"
                          >
                            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                            <div>
                              <p className="font-medium text-sm">{delivery.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Concluído em {formatDate(delivery.completedDate)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="sessions" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-purple-500" />
                        <CardTitle className="text-lg">Workshops</CardTitle>
                      </div>
                      <CardDescription>Treinamentos e capacitações</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {data.workshops.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Nenhum workshop agendado</p>
                        </div>
                      ) : (
                        data.workshops.map((workshop) => (
                          <SessionCard
                            key={workshop.id}
                            session={workshop}
                            type="workshop"
                          />
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Users2 className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-lg">Hotseats</CardTitle>
                      </div>
                      <CardDescription>Sessões práticas individuais</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {data.hotseats.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Nenhum hotseat agendado</p>
                        </div>
                      ) : (
                        data.hotseats.map((hotseat) => (
                          <SessionCard key={hotseat.id} session={hotseat} type="hotseat" />
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="support" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Contatos de Suporte</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {data.supportContacts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum contato cadastrado
                        </p>
                      ) : (
                        data.supportContacts.map((contact, index) => (
                          <div key={index} className="rounded-xl border p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm font-semibold">
                                  {contact.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <div>
                                  <p className="font-semibold">{contact.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {contact.role || "Suporte"}
                                  </p>
                                  {contact.phone && (
                                    <p className="text-sm text-muted-foreground mt-0.5">{contact.phone}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-2"
                                onClick={() =>
                                  window.open(`mailto:${contact.email}`, "_blank")
                                }
                              >
                                <MessageSquare className="h-4 w-4" />
                                Email
                              </Button>
                              {contact.phone && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-2"
                                  onClick={() =>
                                    window.open(`tel:${contact.phone}`, "_self")
                                  }
                                >
                                  Ligar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Recursos</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => (window.location.href = "/cliente/recursos")}
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Ver Recursos e Automações
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => (window.location.href = "/cliente/documentacao")}
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Documentação
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
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
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm",
              gradient
            )}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{value}</span>
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function DeliveryCard({
  delivery,
  isExpanded,
  onToggle,
}: {
  delivery: Delivery;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border p-4 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm">
          <Clock className="h-5 w-5 text-white" />
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{delivery.title}</h3>
              {delivery.description && (
                <p className="text-sm text-muted-foreground mt-1">{delivery.description}</p>
              )}
            </div>
            <Badge variant="info-soft">Em andamento</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold">{delivery.progress}%</span>
            </div>
            <Progress value={delivery.progress} className="h-2" />
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {delivery.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Prazo: {formatDate(delivery.dueDate)}
              </span>
            )}
            {delivery.assignee && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {delivery.assignee}
              </span>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={onToggle} className="w-full text-xs">
            {isExpanded ? "Ver menos" : "Ver detalhes"}
            <ArrowRight
              className={cn("h-3 w-3 ml-1 transition-transform", isExpanded && "rotate-90")}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SessionCard({
  session,
  type,
}: {
  session: Workshop | Hotseat;
  type: "workshop" | "hotseat";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-4 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold">{session.title}</p>
          {session.description && (
            <p className="text-xs text-muted-foreground mt-1">{session.description}</p>
          )}
        </div>
        <Badge variant="secondary">Agendado</Badge>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(session.scheduledDate)}
        </span>
        {session.duration && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {session.duration}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {session.participants} participantes
        </span>
      </div>
      {session.meetingLink && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3 gap-2"
          onClick={() => window.open(session.meetingLink!, "_blank")}
        >
          <Play className="h-4 w-4" />
          Acessar reunião
        </Button>
      )}
    </motion.div>
  );
}
