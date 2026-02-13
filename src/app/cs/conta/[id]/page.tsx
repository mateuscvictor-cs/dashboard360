"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  User,
  Calendar,
  Package,
  GraduationCap,
  Users2,
  Video,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Activity,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Settings,
  HelpCircle,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UpcomingDeliverables } from "@/components/upcoming-deliverables";
import { DeliveryCompletionDialog, SendNPSButton } from "@/components/cs";
import { CompanySurveysCard } from "@/components/company-surveys-card";
import { CompanyComments } from "@/components/company";
import { OnboardingTimeline } from "@/components/cliente/onboarding-timeline";
import { cn, formatDate, formatDateShort, getCadenceLabel, calculateNextDate, getDaysUntil } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  segment: string | null;
  plan: string | null;
  framework: string | null;
  mrr: number;
  healthScore: number;
  healthStatus: string;
  tags: string[];
  contractStart: string | null;
  contractEnd: string | null;
  csOwner: { id: string; name: string; email: string; avatar: string | null } | null;
  squad: { id: string; name: string } | null;
  contacts: Contact[];
  deliveries: Delivery[];
  workshops: Workshop[];
  hotseats: Hotseat[];
  meetings: Meeting[];
  timelineEvents: TimelineEvent[];
  aiInsights: AIInsight[];
}

interface Contact {
  id: string;
  name: string;
  role: string | null;
  email: string;
  phone: string | null;
  isDecisionMaker: boolean;
}

interface Delivery {
  id: string;
  title: string;
  status: string;
  progress: number;
  dueDate: string | null;
  assignee: string | null;
  impact: string;
  cadence: string | null;
}

interface Workshop {
  id: string;
  title: string;
  description: string | null;
  date: string;
  duration: number | null;
  participants: number;
  locationType: string;
  cadence: string | null;
}

interface Hotseat {
  id: string;
  title: string;
  description: string | null;
  date: string;
  duration: number | null;
  participants: number;
  locationType: string;
  cadence: string | null;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  recurrence: string;
  status: string;
}

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string | null;
  date: string;
  sentiment: string | null;
  metadata?: { source?: string };
}

interface AIInsight {
  id: string;
  insight: string;
  type: string;
  actionSuggested: string | null;
}

interface OnboardingStep {
  id: string;
  type: "GROUP_CREATION" | "DIAGNOSTIC_FORM" | "ONBOARDING_MEETING" | "CUSTOM";
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  order: number;
  completedAt: string | null;
  dueDate: string | null;
}

interface OnboardingData {
  steps: OnboardingStep[];
  progress: { total: number; completed: number; inProgress: number; pending: number; percentage: number };
}

const healthStatusConfig: Record<string, { label: string; color: string }> = {
  HEALTHY: { label: "Saudável", color: "bg-emerald-500/10 text-emerald-600" },
  ATTENTION: { label: "Atenção", color: "bg-amber-500/10 text-amber-600" },
  RISK: { label: "Em Risco", color: "bg-orange-500/10 text-orange-600" },
  CRITICAL: { label: "Crítico", color: "bg-red-500/10 text-red-600" },
};

const deliveryStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "text-slate-500" },
  IN_PROGRESS: { label: "Em Progresso", color: "text-blue-500" },
  COMPLETED: { label: "Concluído", color: "text-emerald-500" },
  BLOCKED: { label: "Bloqueado", color: "text-red-500" },
  DELAYED: { label: "Atrasado", color: "text-orange-500" },
};

const timelineTypeConfig: Record<string, { icon: typeof Activity; color: string }> = {
  MEETING: { icon: Video, color: "bg-blue-500" },
  MESSAGE: { icon: MessageSquare, color: "bg-purple-500" },
  DELIVERY: { icon: Package, color: "bg-emerald-500" },
  INCIDENT: { icon: AlertTriangle, color: "bg-red-500" },
  MILESTONE: { icon: TrendingUp, color: "bg-amber-500" },
  FEEDBACK: { icon: Activity, color: "bg-cyan-500" },
};

export default function CSContaPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const tabParam = searchParams.get("tab") || "timeline";
  const [company, setCompany] = useState<Company | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingDelivery, setCompletingDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    fetchCompany();
    fetchOnboarding();
  }, [id]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.startsWith("#comment-") && tabParam !== "comentarios") {
      router.replace(`/cs/conta/${id}?tab=comentarios${hash}`, { scroll: false });
    }
  }, [id, tabParam, router]);

  useEffect(() => {
    if (tabParam !== "comentarios") return;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.startsWith("#comment-")) {
      const idFromHash = hash.slice(1);
      const el = document.getElementById(idFromHash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
      }
    }
  }, [tabParam]);

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
      } else if (response.status === 404) {
        setError("Empresa não encontrada");
      } else {
        setError("Erro ao carregar dados");
      }
    } catch (err) {
      console.error("Erro:", err);
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const fetchOnboarding = async () => {
    try {
      const response = await fetch(`/api/cs/empresas/${id}/onboarding`);
      if (response.ok) {
        const data = await response.json();
        setOnboardingData(data);
      } else {
        setOnboardingData({
          steps: [],
          progress: { total: 0, completed: 0, inProgress: 0, pending: 0, percentage: 0 },
        });
      }
    } catch (err) {
      console.error("Erro ao buscar onboarding:", err);
      setOnboardingData({
        steps: [],
        progress: { total: 0, completed: 0, inProgress: 0, pending: 0, percentage: 0 },
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Carregando..." subtitle="" showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Empresa" subtitle="" showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="flex flex-col items-center py-8">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <p className="text-center text-muted-foreground mb-4">{error}</p>
              <Link href="/cs/empresas">
                <Button variant="outline">Voltar para Empresas</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const healthStatus = healthStatusConfig[company.healthStatus] || healthStatusConfig.HEALTHY;

  const allUpcomingItems = [
    ...company.deliveries.filter((d) => d.dueDate).map((d) => ({ type: "delivery" as const, title: d.title, date: d.dueDate!, cadence: d.cadence, status: d.status })),
    ...company.workshops.filter((w) => w.date != null).map((w) => ({ type: "workshop" as const, title: w.title, date: w.date!, cadence: w.cadence, status: "SCHEDULED" })),
    ...company.hotseats.map((h) => ({ type: "hotseat" as const, title: h.title, date: h.date, cadence: h.cadence, status: "SCHEDULED" })),
    ...company.meetings.map((m) => ({ type: "meeting" as const, title: m.title, date: m.date, cadence: m.recurrence, status: m.status })),
  ]
    .filter((item) => new Date(item.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const tourTriggerButton = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/cs/tutoriais/empresas">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" aria-label="Aprenda sobre empresas">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          Aprenda sobre empresas
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="flex flex-col h-full">
      <Header title={company.name} subtitle={company.segment || "Empresa"} showFilters={false} action={tourTriggerButton} />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cs/empresas">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white text-xl font-bold">
                {company.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{company.name}</h1>
                  {tourTriggerButton}
                  <Badge className={healthStatus.color}>{healthStatus.label}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  {company.csOwner && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {company.csOwner.name}
                    </span>
                  )}
                  {company.squad && (
                    <span className="flex items-center gap-1">
                      <Users2 className="h-3 w-3" />
                      {company.squad.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/cs/empresas/${company.id}/onboarding`}>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Onboarding
              </Button>
            </Link>
            <SendNPSButton companyId={company.id} companyName={company.name} />
            <Link href={`/cs/empresas/${company.id}`}>
              <Button variant="outline" className="gap-2">
                <Edit2 className="h-4 w-4" />
                Editar
              </Button>
            </Link>
          </div>
        </div>

        {onboardingData && (
          <OnboardingTimeline
            steps={onboardingData.steps}
            deliveries={company.deliveries.filter((d) => d.status !== "COMPLETED")}
            progress={onboardingData.progress}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Health Score</span>
                <Badge className={healthStatus.color}>{company.healthScore}%</Badge>
              </div>
              <Progress value={company.healthScore} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">MRR</div>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(company.mrr)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Entregas Ativas</div>
              <div className="text-2xl font-bold">{company.deliveries.filter((d) => d.status !== "COMPLETED").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Próximo Evento</div>
              <div className="text-lg font-medium truncate">
                {allUpcomingItems[0] ? (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {formatDateShort(allUpcomingItems[0].date)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Nenhum</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={tabParam} onValueChange={(v) => router.replace(`/cs/conta/${id}?tab=${v}`, { scroll: false })} className="w-full">
              <TabsList>
                <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
                <TabsTrigger value="deliveries">Entregas</TabsTrigger>
                <TabsTrigger value="events">Workshops & Hotseats</TabsTrigger>
                <TabsTrigger value="contacts">Contatos</TabsTrigger>
                <TabsTrigger value="comentarios">Comentários</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Histórico de Eventos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {company.timelineEvents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum evento registrado</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {company.timelineEvents.slice(0, 10).map((event) => {
                          const config = timelineTypeConfig[event.type] || timelineTypeConfig.FEEDBACK;
                          const Icon = config.icon;
                          return (
                            <div key={event.id} className="flex gap-3">
                              <div className={cn("p-2 rounded-lg h-fit", config.color)}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-sm">{event.title}</p>
                                  {event.metadata?.source === "ai_assistant" && (
                                    <Badge variant="secondary" className="text-xs">IA</Badge>
                                  )}
                                </div>
                                {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                                <p className="text-xs text-muted-foreground mt-1">{formatDate(event.date)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deliveries" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Entregas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {company.deliveries.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma entrega cadastrada</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {company.deliveries.map((delivery) => {
                          const dStatus = deliveryStatusConfig[delivery.status] || deliveryStatusConfig.PENDING;
                          const daysUntil = delivery.dueDate ? getDaysUntil(delivery.dueDate) : null;
                          const nextDate = delivery.dueDate && delivery.cadence ? calculateNextDate(delivery.dueDate, delivery.cadence) : null;
                          return (
                            <div key={delivery.id} className="p-3 rounded-lg border">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="font-medium">{delivery.title}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <Badge variant="outline" className={dStatus.color}>{dStatus.label}</Badge>
                                    {delivery.dueDate && (
                                      <span
                                        className={cn(
                                          "text-xs flex items-center gap-1",
                                          daysUntil !== null && daysUntil < 0 && "text-destructive",
                                          daysUntil !== null && daysUntil >= 0 && daysUntil <= 2 && "text-amber-600"
                                        )}
                                      >
                                        <Clock className="h-3 w-3" />
                                        {formatDateShort(delivery.dueDate)}
                                        {daysUntil !== null && <span>({daysUntil < 0 ? `${Math.abs(daysUntil)}d atrasado` : daysUntil === 0 ? "hoje" : `em ${daysUntil}d`})</span>}
                                      </span>
                                    )}
                                    {delivery.cadence && (
                                      <Badge variant="secondary" className="text-xs">
                                        {getCadenceLabel(delivery.cadence)}
                                      </Badge>
                                    )}
                                  </div>
                                  {nextDate && (
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                      <ArrowRight className="h-3 w-3" />
                                      Próxima: {formatDateShort(nextDate)}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 text-right">
                                    <Progress value={delivery.progress} className="h-2 mb-1" />
                                    <p className="text-xs">{delivery.progress}%</p>
                                  </div>
                                  {delivery.status !== "COMPLETED" && (
                                    <Button size="sm" variant="ghost" className="h-8 text-xs text-success hover:text-success hover:bg-success/10" onClick={() => setCompletingDelivery(delivery)}>
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Concluir
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Workshops
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {company.workshops.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">Nenhum workshop</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {company.workshops.map((w) => {
                          const nextDate = w.date && w.cadence ? calculateNextDate(w.date, w.cadence) : null;
                          return (
                            <div key={w.id} className="p-3 rounded-lg border">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{w.title}</p>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {w.date ? formatDateShort(w.date) : "Sem data"}
                                    </span>
                                    {w.cadence && <Badge variant="secondary" className="text-xs">{getCadenceLabel(w.cadence)}</Badge>}
                                  </div>
                                  {nextDate && <p className="text-xs text-muted-foreground mt-1">Próximo: {formatDateShort(nextDate)}</p>}
                                </div>
                                <Badge variant="outline">{w.locationType === "ONLINE" ? "Online" : "Presencial"}</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users2 className="h-4 w-4" />
                      Hotseats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {company.hotseats.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">Nenhum hotseat</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {company.hotseats.map((h) => {
                          const nextDate = h.cadence ? calculateNextDate(h.date, h.cadence) : null;
                          return (
                            <div key={h.id} className="p-3 rounded-lg border">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{h.title}</p>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDateShort(h.date)}
                                    </span>
                                    {h.cadence && <Badge variant="secondary" className="text-xs">{getCadenceLabel(h.cadence)}</Badge>}
                                  </div>
                                  {nextDate && <p className="text-xs text-muted-foreground mt-1">Próximo: {formatDateShort(nextDate)}</p>}
                                </div>
                                <Badge variant="outline">{h.locationType === "ONLINE" ? "Online" : "Presencial"}</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comentarios" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <CompanyComments companyId={id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contacts" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contatos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {company.contacts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum contato cadastrado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {company.contacts.map((contact) => (
                          <div key={contact.id} className="flex items-center gap-3 p-3 rounded-lg border">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-semibold">{contact.name.substring(0, 2).toUpperCase()}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{contact.name}</p>
                                {contact.isDecisionMaker && <Badge variant="default" className="text-xs">Decisor</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{contact.role || "Sem cargo"}</p>
                            </div>
                            <div className="text-right text-sm min-w-0">
                              <p className="text-muted-foreground truncate">{contact.email}</p>
                              {contact.phone && (
                                <p className="text-muted-foreground truncate text-xs mt-0.5">{contact.phone}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <UpcomingDeliverables companyId={company.id} title="Agenda" maxItems={6} showCompany={false} showFutureOccurrences={true} />
            <CompanySurveysCard companyId={company.id} />
            {company.aiInsights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Insights da IA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {company.aiInsights.slice(0, 3).map((insight) => (
                    <div key={insight.id} className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm">{insight.insight}</p>
                      {insight.actionSuggested && <p className="text-xs text-primary mt-2 font-medium">→ {insight.actionSuggested}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                {company.tags.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma tag</p> : <div className="flex flex-wrap gap-2">{company.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {company.framework && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Framework</span>
                    <span className="font-medium">{company.framework}</span>
                  </div>
                )}
                {company.plan && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plano</span>
                    <span className="font-medium">{company.plan}</span>
                  </div>
                )}
                {company.contractStart && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Início Contrato</span>
                    <span className="font-medium">{formatDateShort(company.contractStart)}</span>
                  </div>
                )}
                {company.contractEnd && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fim Contrato</span>
                    <span className="font-medium">{formatDateShort(company.contractEnd)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {completingDelivery && (
        <DeliveryCompletionDialog
          open={!!completingDelivery}
          onOpenChange={(open) => !open && setCompletingDelivery(null)}
          delivery={completingDelivery}
          onComplete={() => {
            if (completingDelivery && company) {
              setCompany({ ...company, deliveries: company.deliveries.map((d) => (d.id === completingDelivery.id ? { ...d, status: "COMPLETED", progress: 100 } : d)) });
            }
            setCompletingDelivery(null);
          }}
        />
      )}
    </div>
  );
}
