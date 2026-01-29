"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  User,
  AlertTriangle,
  Plus,
  Package,
  GraduationCap,
  Users2,
  Calendar,
  Loader2,
  Edit2,
  Eye,
  MapPin,
  Video,
  Link as LinkIcon,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDateShort, getCadenceLabel, calculateNextDate, getDaysUntil } from "@/lib/utils";
import { UpcomingDeliverables } from "@/components/upcoming-deliverables";
import { DeliveryCompletionDialog, SendNPSButton } from "@/components/cs";
import { CompanySurveysCard } from "@/components/company-surveys-card";
import { LogoUpload, ResourceManager, DiagnosticManager } from "@/components/company";

type Contact = {
  id: string;
  name: string;
  role: string | null;
  email: string;
  phone: string | null;
  isDecisionMaker: boolean;
};

type Delivery = {
  id: string;
  title: string;
  status: string;
  progress: number;
  dueDate: string | null;
  assignee: string | null;
  impact: string;
  cadence: string | null;
};

type Workshop = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  duration: number | null;
  participants: number;
  locationType: string;
  address: string | null;
  meetingLink: string | null;
  fathomLink: string | null;
  attachments: string[];
  notes: string | null;
  createdBy: { id: string; name: string } | null;
};

type Hotseat = Workshop;

type Company = {
  id: string;
  name: string;
  logo: string | null;
  segment: string | null;
  plan: string | null;
  mrr: number;
  healthScore: number;
  healthStatus: string;
  workshopsCount: number;
  hotseatsCount: number;
  lastInteraction: string | null;
  framework: string | null;
  contacts: Contact[];
  deliveries: Delivery[];
  csOwner: { id: string; name: string } | null;
  canEdit: boolean;
};

const healthStatusConfig: Record<string, { label: string; color: string }> = {
  HEALTHY: { label: "Saudável", color: "text-emerald-500 bg-emerald-500/10" },
  STABLE: { label: "Estável", color: "text-blue-500 bg-blue-500/10" },
  ATTENTION: { label: "Atenção", color: "text-amber-500 bg-amber-500/10" },
  RISK: { label: "Em Risco", color: "text-orange-500 bg-orange-500/10" },
  CRITICAL: { label: "Crítico", color: "text-red-500 bg-red-500/10" },
};

const deliveryStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "text-slate-500 bg-slate-500/10" },
  IN_PROGRESS: { label: "Em Progresso", color: "text-blue-500 bg-blue-500/10" },
  REVIEW: { label: "Em Revisão", color: "text-amber-500 bg-amber-500/10" },
  COMPLETED: { label: "Concluído", color: "text-emerald-500 bg-emerald-500/10" },
  BLOCKED: { label: "Bloqueado", color: "text-red-500 bg-red-500/10" },
};

const initialEventForm = {
  title: "",
  description: "",
  date: "",
  time: "",
  duration: "",
  participants: "",
  locationType: "ONLINE",
  address: "",
  meetingLink: "",
  fathomLink: "",
  notes: "",
};

export default function CSEmpresaDetalhePage() {
  const params = useParams();
  const id = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [hotseats, setHotseats] = useState<Hotseat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showContactModal, setShowContactModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventType, setEventType] = useState<"workshop" | "hotseat">("workshop");
  const [saving, setSaving] = useState(false);
  const [completingDelivery, setCompletingDelivery] = useState<Delivery | null>(null);

  const [newContact, setNewContact] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    isDecisionMaker: false,
  });

  const [newDelivery, setNewDelivery] = useState({
    title: "",
    status: "PENDING",
    dueDate: "",
    assignee: "",
    impact: "MEDIUM",
  });

  const [newEvent, setNewEvent] = useState(initialEventForm);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [companyRes, workshopsRes, hotseatsRes] = await Promise.all([
        fetch(`/api/cs/empresas/${id}`),
        fetch(`/api/cs/empresas/${id}/workshops`),
        fetch(`/api/cs/empresas/${id}/hotseats`),
      ]);

      if (companyRes.ok) {
        const data = await companyRes.json();
        setCompany(data);
      } else if (companyRes.status === 404) {
        setError("Empresa não encontrada");
      }

      if (workshopsRes.ok) {
        setWorkshops(await workshopsRes.json());
      }

      if (hotseatsRes.ok) {
        setHotseats(await hotseatsRes.json());
      }
    } catch (err) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.email) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/cs/empresas/${id}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      });

      if (response.ok) {
        const contact = await response.json();
        setCompany(prev => prev ? {
          ...prev,
          contacts: [...prev.contacts, contact],
        } : null);
        setShowContactModal(false);
        setNewContact({ name: "", role: "", email: "", phone: "", isDecisionMaker: false });
      }
    } catch (err) {
      console.error("Erro ao adicionar contato:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDelivery = async () => {
    if (!newDelivery.title) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/cs/empresas/${id}/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDelivery),
      });

      if (response.ok) {
        const delivery = await response.json();
        setCompany(prev => prev ? {
          ...prev,
          deliveries: [delivery, ...prev.deliveries],
        } : null);
        setShowDeliveryModal(false);
        setNewDelivery({ title: "", status: "PENDING", dueDate: "", assignee: "", impact: "MEDIUM" });
      }
    } catch (err) {
      console.error("Erro ao adicionar entregável:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) return;

    setSaving(true);
    try {
      const dateTime = newEvent.time
        ? `${newEvent.date}T${newEvent.time}:00`
        : `${newEvent.date}T09:00:00`;

      const endpoint = eventType === "workshop"
        ? `/api/cs/empresas/${id}/workshops`
        : `/api/cs/empresas/${id}/hotseats`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description || null,
          date: dateTime,
          duration: newEvent.duration ? parseInt(newEvent.duration) : null,
          participants: newEvent.participants ? parseInt(newEvent.participants) : 0,
          locationType: newEvent.locationType,
          address: newEvent.locationType === "PRESENCIAL" ? newEvent.address : null,
          meetingLink: newEvent.locationType === "ONLINE" ? newEvent.meetingLink : null,
          fathomLink: newEvent.fathomLink || null,
          notes: newEvent.notes || null,
        }),
      });

      if (response.ok) {
        const event = await response.json();
        if (eventType === "workshop") {
          setWorkshops(prev => [event, ...prev]);
          setCompany(prev => prev ? { ...prev, workshopsCount: prev.workshopsCount + 1 } : null);
        } else {
          setHotseats(prev => [event, ...prev]);
          setCompany(prev => prev ? { ...prev, hotseatsCount: prev.hotseatsCount + 1 } : null);
        }
        setShowEventModal(false);
        setNewEvent(initialEventForm);
      }
    } catch (err) {
      console.error("Erro ao criar evento:", err);
    } finally {
      setSaving(false);
    }
  };

  const openEventModal = (type: "workshop" | "hotseat") => {
    setEventType(type);
    setNewEvent(initialEventForm);
    setShowEventModal(true);
  };

  const handleDeliveryCompleted = () => {
    if (completingDelivery && company) {
      setCompany({
        ...company,
        deliveries: company.deliveries.map(d =>
          d.id === completingDelivery.id
            ? { ...d, status: "COMPLETED", progress: 100 }
            : d
        ),
      });
    }
    setCompletingDelivery(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Não definido";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString("pt-BR")} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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
                <Button variant="outline">Voltar para lista</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusConfig = healthStatusConfig[company.healthStatus] || healthStatusConfig.STABLE;

  return (
    <div className="flex flex-col h-full">
      <Header title={company.name} subtitle={company.segment || "Empresa"} showFilters={false} />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/cs/empresas">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {company.canEdit && (
              <SendNPSButton
                companyId={company.id}
                companyName={company.name}
              />
            )}
            <Badge className={cn("gap-1 px-3 py-1", statusConfig.color)}>
              {company.canEdit ? <Edit2 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {company.canEdit ? "Pode editar" : "Somente visualização"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Health Score</p>
                  <p className="text-2xl font-bold">{company.healthScore}%</p>
                </div>
              </div>
              <Progress value={company.healthScore} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Workshops</p>
                  <p className="text-2xl font-bold">{company.workshopsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                  <Users2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hotseats</p>
                  <p className="text-2xl font-bold">{company.hotseatsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última Interação</p>
                  <p className="text-lg font-semibold">{formatDate(company.lastInteraction)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {company.canEdit && (
          <div className="flex gap-2">
            <Link href={`/cs/empresas/${id}/onboarding`}>
              <Button variant="outline" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Onboarding
              </Button>
            </Link>
            <Button onClick={() => openEventModal("workshop")} className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Novo Workshop
            </Button>
            <Button onClick={() => openEventModal("hotseat")} variant="outline" className="gap-2">
              <Users2 className="h-4 w-4" />
              Novo Hotseat
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Workshops
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workshops.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <GraduationCap className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm text-center">
                    Nenhum workshop registrado
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workshops.slice(0, 5).map((w) => (
                    <div key={w.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium">{w.title}</p>
                        <Badge variant="outline" className="text-xs gap-1">
                          {w.locationType === "ONLINE" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                          {w.locationType === "ONLINE" ? "Online" : "Presencial"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(w.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {w.participants} participantes
                        </span>
                      </div>
                      {w.fathomLink && (
                        <a href={w.fathomLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-2">
                          <LinkIcon className="h-3 w-3" />
                          Ver gravação no Fathom
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users2 className="h-5 w-5" />
                Hotseats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hotseats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Users2 className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm text-center">
                    Nenhum hotseat registrado
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hotseats.slice(0, 5).map((h) => (
                    <div key={h.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium">{h.title}</p>
                        <Badge variant="outline" className="text-xs gap-1">
                          {h.locationType === "ONLINE" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                          {h.locationType === "ONLINE" ? "Online" : "Presencial"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(h.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {h.participants} participantes
                        </span>
                      </div>
                      {h.fathomLink && (
                        <a href={h.fathomLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-2">
                          <LinkIcon className="h-3 w-3" />
                          Ver gravação no Fathom
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Entregáveis</CardTitle>
              {company.canEdit && (
                <Button size="sm" onClick={() => setShowDeliveryModal(true)} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {company.deliveries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Package className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm text-center">
                    Nenhum entregável cadastrado
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {company.deliveries.map((delivery) => {
                    const dStatus = deliveryStatusConfig[delivery.status] || deliveryStatusConfig.PENDING;
                    const nextDate = delivery.dueDate && delivery.cadence 
                      ? calculateNextDate(delivery.dueDate, delivery.cadence) 
                      : null;
                    const daysUntil = delivery.dueDate ? getDaysUntil(delivery.dueDate) : null;
                    return (
                      <div key={delivery.id} className="p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{delivery.title}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="outline" className={cn("text-xs", dStatus.color)}>
                                {dStatus.label}
                              </Badge>
                              {delivery.dueDate && (
                                <span className={cn(
                                  "text-xs flex items-center gap-1",
                                  daysUntil !== null && daysUntil < 0 && "text-destructive",
                                  daysUntil !== null && daysUntil >= 0 && daysUntil <= 2 && "text-amber-600"
                                )}>
                                  <Clock className="h-3 w-3" />
                                  {formatDateShort(delivery.dueDate)}
                                  {daysUntil !== null && (
                                    <span className="ml-1">
                                      ({daysUntil < 0 ? `${Math.abs(daysUntil)}d atrasado` : daysUntil === 0 ? "hoje" : `em ${daysUntil}d`})
                                    </span>
                                  )}
                                </span>
                              )}
                              {delivery.cadence && (
                                <Badge variant="secondary" className="text-xs">
                                  {getCadenceLabel(delivery.cadence)}
                                </Badge>
                              )}
                            </div>
                            {nextDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Próxima: {formatDateShort(nextDate)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16">
                              <Progress value={delivery.progress} className="h-2" />
                              <p className="text-xs text-center mt-1">{delivery.progress}%</p>
                            </div>
                            {company.canEdit && delivery.status !== "COMPLETED" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-success hover:text-success hover:bg-success/10"
                                onClick={() => setCompletingDelivery(delivery)}
                              >
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Contatos</CardTitle>
              {company.canEdit && (
                <Button size="sm" onClick={() => setShowContactModal(true)} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {company.contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <User className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm text-center">
                    Nenhum contato cadastrado
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {company.contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-semibold">
                        {contact.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{contact.name}</p>
                          {contact.isDecisionMaker && (
                            <Badge variant="default" className="text-xs">Decisor</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{contact.role || "Sem cargo"}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground truncate">{contact.email}</p>
                        {contact.phone && (
                          <p className="text-muted-foreground truncate">{contact.phone}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <UpcomingDeliverables
          companyId={company.id}
          title="Agenda de Entregas"
          maxItems={10}
          showCompany={false}
          showFutureOccurrences={true}
        />

        <CompanySurveysCard companyId={company.id} />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">MRR</p>
                <p className="font-semibold">{formatCurrency(company.mrr)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Segmento</p>
                <p className="font-semibold">{company.segment || "Não definido"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plano</p>
                <p className="font-semibold">{company.plan || "Não definido"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CS Responsável</p>
                <p className="font-semibold">{company.csOwner?.name || "Não atribuído"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {company.canEdit && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Logo da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LogoUpload companyId={company.id} currentLogo={company.logo} />
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <ResourceManager companyId={company.id} />
            </div>
          </div>
        )}

        {company.canEdit && (
          <DiagnosticManager companyId={company.id} />
        )}
      </div>

      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input placeholder="Nome completo" value={newContact.name} onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cargo</label>
              <Input placeholder="Ex: Diretor de TI" value={newContact.role} onChange={(e) => setNewContact(prev => ({ ...prev, role: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input type="email" placeholder="email@empresa.com" value={newContact.email} onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input placeholder="(00) 00000-0000" value={newContact.phone} onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={newContact.isDecisionMaker} onChange={(e) => setNewContact(prev => ({ ...prev, isDecisionMaker: e.target.checked }))} className="rounded border-input" />
              <span className="text-sm">É decisor</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactModal(false)}>Cancelar</Button>
            <Button onClick={handleAddContact} disabled={saving || !newContact.name || !newContact.email}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Entregável</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input placeholder="Nome do entregável" value={newDelivery.title} onChange={(e) => setNewDelivery(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={newDelivery.status} onValueChange={(value) => setNewDelivery(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                    <SelectItem value="REVIEW">Em Revisão</SelectItem>
                    <SelectItem value="COMPLETED">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Impacto</label>
                <Select value={newDelivery.impact} onValueChange={(value) => setNewDelivery(prev => ({ ...prev, impact: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">Alto</SelectItem>
                    <SelectItem value="MEDIUM">Médio</SelectItem>
                    <SelectItem value="LOW">Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Entrega</label>
                <Input type="date" value={newDelivery.dueDate} onChange={(e) => setNewDelivery(prev => ({ ...prev, dueDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Responsável</label>
                <Input placeholder="Nome do responsável" value={newDelivery.assignee} onChange={(e) => setNewDelivery(prev => ({ ...prev, assignee: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliveryModal(false)}>Cancelar</Button>
            <Button onClick={handleAddDelivery} disabled={saving || !newDelivery.title}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {eventType === "workshop" ? <GraduationCap className="h-5 w-5" /> : <Users2 className="h-5 w-5" />}
              Novo {eventType === "workshop" ? "Workshop" : "Hotseat"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título / Tema *</label>
              <Input placeholder={`Tema do ${eventType}`} value={newEvent.title} onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea placeholder="Descreva o objetivo e conteúdo..." value={newEvent.description} onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data *</label>
                <Input type="date" value={newEvent.date} onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Horário</label>
                <Input type="time" value={newEvent.time} onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duração (min)</label>
                <Input type="number" placeholder="60" value={newEvent.duration} onChange={(e) => setNewEvent(prev => ({ ...prev, duration: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Participantes</label>
                <Input type="number" placeholder="Quantidade" value={newEvent.participants} onChange={(e) => setNewEvent(prev => ({ ...prev, participants: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Local</label>
                <Select value={newEvent.locationType} onValueChange={(value) => setNewEvent(prev => ({ ...prev, locationType: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newEvent.locationType === "PRESENCIAL" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Endereço</label>
                <Input placeholder="Endereço completo" value={newEvent.address} onChange={(e) => setNewEvent(prev => ({ ...prev, address: e.target.value }))} />
              </div>
            )}

            {newEvent.locationType === "ONLINE" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Link da Reunião</label>
                <Input placeholder="https://meet.google.com/..." value={newEvent.meetingLink} onChange={(e) => setNewEvent(prev => ({ ...prev, meetingLink: e.target.value }))} />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Link do Fathom (gravação)
              </label>
              <Input placeholder="https://fathom.video/..." value={newEvent.fathomLink} onChange={(e) => setNewEvent(prev => ({ ...prev, fathomLink: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Textarea placeholder="Anotações adicionais..." value={newEvent.notes} onChange={(e) => setNewEvent(prev => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventModal(false)}>Cancelar</Button>
            <Button onClick={handleAddEvent} disabled={saving || !newEvent.title || !newEvent.date}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar {eventType === "workshop" ? "Workshop" : "Hotseat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {completingDelivery && (
        <DeliveryCompletionDialog
          open={!!completingDelivery}
          onOpenChange={(open) => !open && setCompletingDelivery(null)}
          delivery={completingDelivery}
          onComplete={handleDeliveryCompleted}
        />
      )}
    </div>
  );
}
