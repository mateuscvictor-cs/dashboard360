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
  Loader2,
  Plus,
  ExternalLink,
  Check,
  AlertCircle,
  Users,
  Filter,
} from "lucide-react";

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
  csOwner?: { id: string; name: string; avatar?: string };
};

type EventType = {
  id: number;
  slug: string;
  title: string;
  lengthInMinutes: number;
};

type Company = {
  id: string;
  name: string;
};

type CSOwner = {
  id: string;
  name: string;
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

function NewBookingDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
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
    if (selectedEventType?.id && selectedDate) {
      loadSlots();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventType?.id, selectedDate]);

  const loadCompanies = async () => {
    try {
      const res = await fetch("/api/cs/empresas?all=true");
      if (res.ok) {
        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
    }
  };

  const loadEventTypes = async () => {
    try {
      const res = await fetch("/api/calcom/event-types");
      if (res.ok) {
        const data = await res.json();
        const types = Array.isArray(data) ? data : [];
        setEventTypes(types);
        if (types.length > 0) setSelectedEventType(types[0]);
      } else {
        setError("Erro ao carregar tipos de evento do Cal.com");
      }
    } catch (err) {
      console.error("Erro ao carregar event types:", err);
      setError("Erro ao conectar com Cal.com");
    }
  };

  const loadSlots = async () => {
    if (!selectedEventType || !selectedDate || loading) return;

    setLoading(true);
    setSlots({});
    setError("");

    const [year, month, day] = selectedDate.split("-").map(Number);
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);

    try {
      const params = new URLSearchParams({
        eventTypeId: String(selectedEventType.id),
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(`/api/calcom/slots?${params}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      
      if (res.ok) {
        if (data && typeof data === "object") {
          setSlots(data);
        }
      } else {
        if (data.error?.includes("524") || data.error?.includes("timeout")) {
          setError("Cal.com está lento. Tente novamente em alguns segundos.");
        } else {
          setError(data.error || "Erro ao buscar horários");
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Tempo esgotado. Cal.com está lento, tente novamente.");
      } else {
        setError("Erro ao conectar com Cal.com. Tente novamente.");
      }
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
      const res = await fetch("/api/calcom/admin-create-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeId: selectedEventType.id,
          eventTypeSlug: selectedEventType.slug,
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

  const slotsForDate = Object.entries(slots).flatMap(([, daySlots]) => daySlots);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Agendamento (Admin)</DialogTitle>
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
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => {
                      setSelectedCompany(company);
                      setStep(2);
                    }}
                    className="w-full p-3 rounded-lg border hover:bg-muted/50 text-left flex items-center gap-3"
                  >
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{company.name}</span>
                  </button>
                ))}
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
                    Nenhum tipo de evento encontrado
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://app.cal.com/event-types" target="_blank" rel="noopener noreferrer">
                      Criar tipo de evento
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              ) : (
                <select
                  value={selectedEventType?.id || ""}
                  onChange={(e) => {
                    const et = eventTypes.find((t) => t.id === parseInt(e.target.value));
                    setSelectedEventType(et || null);
                    setSelectedSlot("");
                  }}
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                >
                  {eventTypes.map((et) => (
                    <option key={et.id} value={et.id}>
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
                    <span className="ml-2 text-sm text-muted-foreground">Buscando horários...</span>
                  </div>
                ) : slotsForDate.length === 0 ? (
                  <div className="py-4 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {error || "Nenhum horário disponível para esta data"}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={loadSlots}>
                        Tentar novamente
                      </Button>
                      <Button variant="link" size="sm" asChild className="text-xs">
                        <a href="https://app.cal.com/availability" target="_blank" rel="noopener noreferrer">
                          Ver no Cal.com
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
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
              <Button onClick={() => setStep(3)} disabled={!selectedSlot} className="flex-1">
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
                {selectedSlot &&
                  new Date(selectedSlot).toLocaleString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </p>
              {selectedCompany && <p className="text-muted-foreground">Empresa: {selectedCompany.name}</p>}
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

export default function AdminAgendaPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [csOwners, setCsOwners] = useState<CSOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [selectedCsOwner, setSelectedCsOwner] = useState<string>("all");

  useEffect(() => {
    fetchData();
    fetchCsOwners();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedCsOwner]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCsOwner !== "all") {
        params.set("csOwnerId", selectedCsOwner);
      }
      params.set("limit", "50");

      const res = await fetch(`/api/calcom/all-bookings?${params}`);
      if (res.ok) {
        setBookings(await res.json());
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCsOwners = async () => {
    try {
      const res = await fetch("/api/cs-owners");
      if (res.ok) {
        const data = await res.json();
        setCsOwners(Array.isArray(data) ? data : data.csOwners || []);
      }
    } catch (error) {
      console.error("Erro ao carregar CS Owners:", error);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Agenda" subtitle="Visão geral de todas as reuniões" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedCsOwner}
                onChange={(e) => setSelectedCsOwner(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">Todos os CSs</option>
                {csOwners.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setNewBookingOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://app.cal.com/bookings/upcoming" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Cal.com
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                  <p className="text-sm text-muted-foreground">Reuniões Agendadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Users className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{csOwners.length}</p>
                  <p className="text-sm text-muted-foreground">CS Owners</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Building2 className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(bookings.filter((b) => b.company).map((b) => b.company?.id)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Empresas com Reuniões</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximas Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Nenhuma reunião agendada</p>
                <Button onClick={() => setNewBookingOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar agendamento
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors"
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
                        {booking.csOwner && (
                          <Badge variant="outline" size="sm">
                            CS: {booking.csOwner.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {booking.meetingUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={booking.meetingUrl} target="_blank" rel="noopener noreferrer">
                          <Video className="h-4 w-4 mr-1" />
                          Entrar
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <NewBookingDialog open={newBookingOpen} onOpenChange={setNewBookingOpen} onSuccess={fetchData} />
      </div>
    </div>
  );
}
