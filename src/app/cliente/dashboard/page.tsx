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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationBell } from "@/components/notifications";
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

export default function ClienteDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch("/api/cliente/dashboard");
        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
        }
      } catch (error) {
        console.error("Erro ao buscar dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

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

      <div className="flex-1 overflow-auto p-6 space-y-6">
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

                          <div className="grid grid-cols-3 gap-4 pt-4">
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
