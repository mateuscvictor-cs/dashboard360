"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  User,
  Building2,
  Video,
  Settings,
  Loader2,
  Plus,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  Check,
  AlertCircle,
  FileText,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

type Booking = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  eventType: string;
  meetingUrl?: string;
  attendeeName: string;
  attendeeEmail: string;
  company?: { id: string; name: string };
  delivery?: { id: string; title: string };
  notes?: string;
  fathomUrl?: string;
  transcript?: string;
};

type CalendlyConfig = {
  calendlyUsername?: string;
  configured?: boolean;
};

type EventType = {
  id: string;
  uri: string;
  slug: string;
  title: string;
  lengthInMinutes: number;
};

type Company = {
  id: string;
  name: string;
  contacts?: Array<{ name: string; email: string }>;
};

type Slot = {
  time: string;
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  ONBOARDING: "Onboarding",
  DELIVERY: "Entrega",
  CHECKIN: "Check-in",
  GENERAL: "Geral",
};

function SetupWizard({
  username,
  setUsername,
  onSave,
  saving,
}: {
  username: string;
  setUsername: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [step, setStep] = useState(1);

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
      <CardContent className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 text-white mb-4">
              <Calendar className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Configure sua Agenda</h2>
            <p className="text-muted-foreground">
              Conecte seu Calendly para agendar reuniões com clientes
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex items-center ${s < 3 ? "flex-1" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= s ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${step > s ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="bg-background rounded-xl p-6 border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">1</span>
                Crie sua conta no Calendly
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                O Calendly é uma plataforma de agendamento. Se você ainda não tem uma conta, crie agora.
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <a href="https://calendly.com/signup" target="_blank" rel="noopener noreferrer">
                    Criar conta
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
                <Button variant="outline" onClick={() => setStep(2)}>
                  Já tenho conta
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-background rounded-xl p-6 border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">2</span>
                Encontre seu username
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium mb-2">Como encontrar:</p>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center mt-0.5">1</span>
                    <span>
                      Acesse{" "}
                      <a href="https://calendly.com/app/admin/account" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        calendly.com/app/admin/account
                      </a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center mt-0.5">2</span>
                    <span>Procure por &quot;My Link&quot; ou &quot;Meu Link&quot;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center mt-0.5">3</span>
                    <span>
                      Copie o valor (ex: <code className="bg-muted px-1 rounded">joao-silva</code>)
                    </span>
                  </li>
                </ol>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button onClick={() => setStep(3)}>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-background rounded-xl p-6 border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">3</span>
                Digite seu username
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-1 rounded-lg border bg-muted/30">
                  <span className="text-sm text-muted-foreground pl-3">calendly.com/</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="seu-usuario"
                    className="flex-1 h-10 bg-background rounded-md px-3 text-sm border-0 outline-none"
                  />
                </div>
                {username && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">
                      Seu perfil: <code className="bg-muted px-1 rounded">calendly.com/{username}</code>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <Button onClick={onSave} disabled={saving || !username.trim()} className="flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Salvar e Concluir
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Precisa de ajuda?</p>
                <p>
                  Certifique-se de criar pelo menos um tipo de evento no Calendly.{" "}
                  <a href="https://help.calendly.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Ver documentação
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NewBookingDialog({
  open,
  onOpenChange,
  config,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  config: CalendlyConfig;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [slots, setSlots] = useState<Record<string, Slot[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");

  useEffect(() => {
    if (open) {
      setLoadingData(true);
      Promise.all([loadCompanies(), loadEventTypes()]).finally(() => {
        setLoadingData(false);
      });
    }
  }, [open]);

  useEffect(() => {
    if (selectedEventType && selectedDate) {
      loadSlots();
    }
  }, [selectedEventType, selectedDate]);

  const loadCompanies = async () => {
    try {
      const res = await fetch("/api/cs/empresas");
      if (res.ok) {
        const data = await res.json();
        const companiesArray = Array.isArray(data) ? data : (data.companies || []);
        setCompanies(companiesArray);
      }
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
    }
  };

  const loadEventTypes = async () => {
    try {
      const res = await fetch("/api/calendly/event-types");
      if (res.ok) {
        const data = await res.json();
        const types = Array.isArray(data) ? data : [];
        setEventTypes(types);
        if (types.length > 0) setSelectedEventType(types[0]);
      } else {
        console.error("Erro ao carregar event types:", await res.text());
        setError("Erro ao carregar tipos de evento do Calendly. Verifique sua API Key.");
      }
    } catch (err) {
      console.error("Erro ao carregar event types:", err);
      setError("Erro ao conectar com Calendly");
    }
  };

  const loadSlots = async () => {
    if (!selectedEventType || !selectedDate) return;

    setLoading(true);
    setSlots({});

    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + 1);

    try {
      const params = new URLSearchParams({
        eventTypeUri: selectedEventType.uri,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });

      const res = await fetch(`/api/calendly/slots?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      } else {
        console.error("Erro ao buscar slots:", await res.text());
      }
    } catch (err) {
      console.error("Erro ao carregar slots:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedSlot || !attendeeName || !attendeeEmail || !selectedEventType) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/calendly/create-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeUri: selectedEventType.uri,
          start: selectedSlot,
          attendeeName,
          attendeeEmail,
          companyId: selectedCompany?.id,
          lengthInMinutes: selectedEventType.lengthInMinutes,
        }),
      });

      if (res.ok) {
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao criar agendamento");
      }
    } catch (err) {
      setError("Erro ao criar agendamento");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedCompany(null);
    setSelectedEventType(eventTypes[0] || null);
    setSelectedDate("");
    setSelectedSlot("");
    setAttendeeName("");
    setAttendeeEmail("");
    setError("");
  };

  const selectCompanyContact = (company: Company) => {
    setSelectedCompany(company);
    setStep(2);
  };

  const slotsForDate = Object.entries(slots).flatMap(([, daySlots]) => daySlots);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex items-center ${s < 3 ? "flex-1" : ""}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  step >= s ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 mx-2 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm mb-4">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Selecione uma empresa (opcional)</p>
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                <button
                  onClick={() => setStep(2)}
                  className="w-full p-3 rounded-lg border hover:bg-muted/50 text-left text-sm text-muted-foreground"
                >
                  Pular - agendar sem vincular empresa
                </button>
                {companies.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma empresa encontrada
                  </p>
                ) : (
                  companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => selectCompanyContact(company)}
                      className="w-full p-3 rounded-lg border hover:bg-muted/50 text-left flex items-center gap-3"
                    >
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{company.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Evento</label>
              {eventTypes.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Nenhum tipo de evento encontrado no Calendly
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://calendly.com/event_types" target="_blank" rel="noopener noreferrer">
                      Criar tipo de evento
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              ) : (
                <select
                  value={selectedEventType?.uri || ""}
                  onChange={(e) => {
                    const et = eventTypes.find((t) => t.uri === e.target.value);
                    setSelectedEventType(et || null);
                    setSelectedSlot("");
                  }}
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                >
                  {eventTypes.map((et) => (
                    <option key={et.uri} value={et.uri}>
                      {et.title} ({et.lengthInMinutes} min)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot("");
                }}
                min={new Date().toISOString().split("T")[0]}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="text-sm font-medium mb-2 block">Horário</label>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : slotsForDate.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum horário disponível nesta data
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                    {slotsForDate.map((slot) => {
                      const time = new Date(slot.time).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <button
                          key={slot.time}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`p-2 text-sm rounded-md border transition-colors ${
                            selectedSlot === slot.time
                              ? "bg-primary text-white border-primary"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedSlot}
                className="flex-1"
              >
                Próximo
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome do Participante</label>
              <input
                type="text"
                value={attendeeName}
                onChange={(e) => setAttendeeName(e.target.value)}
                placeholder="Nome completo"
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">E-mail do Participante</label>
              <input
                type="email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              />
            </div>

            <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
              <p className="font-medium">Resumo</p>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{selectedEventType?.title}</span>
              </p>
              <p className="text-muted-foreground">
                {selectedSlot && new Date(selectedSlot).toLocaleString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {selectedCompany && (
                <p className="text-muted-foreground">
                  Empresa: {selectedCompany.name}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                onClick={handleCreateBooking}
                disabled={creating || !attendeeName || !attendeeEmail}
                className="flex-1"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Criar Agendamento
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function CSAgendaPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [config, setConfig] = useState<CalendlyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, configRes] = await Promise.all([
        fetch("/api/calendly/upcoming?limit=20"),
        fetch("/api/calendly/config"),
      ]);

      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (configRes.ok) {
        const cfg = await configRes.json();
        setConfig(cfg);
        if (cfg.calendlyUsername) setUsername(cfg.calendlyUsername);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!username.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/calendly/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendlyUsername: username.trim() }),
      });
      if (res.ok) {
        setConfig(await res.json());
        setConfigOpen(false);
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Agenda" subtitle="Gerenciar reuniões" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const isConfigured = config?.calendlyUsername;

  return (
    <div className="flex flex-col h-full">
      <Header title="Agenda" subtitle="Gerenciar reuniões via Calendly" />

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        {!isConfigured ? (
          <SetupWizard
            username={username}
            setUsername={setUsername}
            onSave={saveConfig}
            saving={saving}
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Suas Reuniões</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Conectado: calendly.com/{config.calendlyUsername}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setNewBookingOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://calendly.com/${config.calendlyUsername}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Meu Calendly
                  </a>
                </Button>
                <Dialog open={configOpen} onOpenChange={setConfigOpen}>
                  <Button variant="ghost" size="sm" onClick={() => setConfigOpen(true)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Alterar configuração</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Seu usuário no Calendly</label>
                        <div className="flex items-center gap-2 p-1 rounded-lg border bg-muted/30">
                          <span className="text-sm text-muted-foreground pl-3">calendly.com/</span>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                            placeholder="seu-usuario"
                            className="flex-1 h-9 bg-background rounded-md px-3 text-sm border-0 outline-none"
                          />
                        </div>
                      </div>
                      <Button onClick={saveConfig} disabled={saving || !username.trim()} className="w-full">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Salvar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Próximas Reuniões
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">Nenhuma reunião agendada</p>
                    <Button onClick={() => setNewBookingOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeiro agendamento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/cs/agenda/${booking.id}`}
                        className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors block"
                      >
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary">
                          <span className="text-xs font-medium">
                            {new Date(booking.startTime).toLocaleDateString("pt-BR", { weekday: "short" })}
                          </span>
                          <span className="text-lg font-bold">{new Date(booking.startTime).getDate()}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{booking.title}</span>
                            <Badge variant="secondary" size="sm">
                              {EVENT_TYPE_LABELS[booking.eventType] || booking.eventType}
                            </Badge>
                            {booking.transcript && (
                              <Badge variant="outline" size="sm" className="gap-1 text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                                <FileText className="h-3 w-3" />
                                Fathom
                              </Badge>
                            )}
                            {booking.notes && (
                              <Badge variant="outline" size="sm" className="gap-1 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                                <MessageSquare className="h-3 w-3" />
                                Notas
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatTime(booking.startTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {booking.attendeeName}
                            </span>
                            {booking.company && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {booking.company.name}
                              </span>
                            )}
                          </div>
                        </div>

                        {booking.meetingUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(booking.meetingUrl, "_blank");
                            }}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Entrar
                          </Button>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <NewBookingDialog
              open={newBookingOpen}
              onOpenChange={setNewBookingOpen}
              config={config}
              onSuccess={fetchData}
            />
          </>
        )}
      </div>
    </div>
  );
}
