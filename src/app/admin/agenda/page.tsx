"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Search,
  X,
  UserPlus,
  Mail,
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
  csOwner?: { id: string; name: string; avatar?: string };
  notes?: string;
  fathomUrl?: string;
  transcript?: string;
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
  logo?: string;
  csOwner?: { id: string; name: string };
};

type UserType = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Slot = {
  time: string;
  schedulingUrl?: string;
};

type Invitee = {
  name: string;
  email: string;
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  ONBOARDING: "Onboarding",
  DELIVERY: "Entrega",
  CHECKIN: "Check-in",
  GENERAL: "Geral",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [slots, setSlots] = useState<Record<string, Slot[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadingEventTypes, setLoadingEventTypes] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [hostSearch, setHostSearch] = useState("");
  const [hostResults, setHostResults] = useState<UserType[]>([]);
  const [hostLoading, setHostLoading] = useState(false);
  const [selectedHost, setSelectedHost] = useState<UserType | null>(null);

  const [companySearch, setCompanySearch] = useState("");
  const [companyResults, setCompanyResults] = useState<Company[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedSchedulingUrl, setSelectedSchedulingUrl] = useState("");

  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [additionalInvitees, setAdditionalInvitees] = useState<Invitee[]>([]);
  const [newInviteeName, setNewInviteeName] = useState("");
  const [newInviteeEmail, setNewInviteeEmail] = useState("");

  const [searchingNext, setSearchingNext] = useState(false);

  const debouncedHostSearch = useDebounce(hostSearch, 300);
  const debouncedCompanySearch = useDebounce(companySearch, 300);

  useEffect(() => {
    if (open) {
      loadEventTypes();
    }
  }, [open]);

  useEffect(() => {
    if (debouncedHostSearch.length >= 2) {
      searchHosts(debouncedHostSearch);
    } else {
      setHostResults([]);
    }
  }, [debouncedHostSearch]);

  useEffect(() => {
    if (debouncedCompanySearch.length >= 2) {
      searchCompanies(debouncedCompanySearch);
    } else {
      setCompanyResults([]);
    }
  }, [debouncedCompanySearch]);

  useEffect(() => {
    if (selectedEventType?.uri && selectedDate) {
      loadSlots();
    }
  }, [selectedEventType?.uri, selectedDate]);

  const searchHosts = async (query: string) => {
    setHostLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setHostResults(data.filter((u: UserType) => u.role === "ADMIN" || u.role === "CS_OWNER"));
      }
    } catch (err) {
      console.error("Erro ao buscar hosts:", err);
    } finally {
      setHostLoading(false);
    }
  };

  const searchCompanies = async (query: string) => {
    setCompanyLoading(true);
    try {
      const res = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}&limit=10`);
      if (res.ok) {
        setCompanyResults(await res.json());
      }
    } catch (err) {
      console.error("Erro ao buscar empresas:", err);
    } finally {
      setCompanyLoading(false);
    }
  };

  const loadEventTypes = async () => {
    setLoadingEventTypes(true);
    try {
      const res = await fetch("/api/calendly/event-types");
      if (res.ok) {
        const data = await res.json();
        const types = Array.isArray(data) ? data : [];
        setEventTypes(types);
        if (types.length > 0) setSelectedEventType(types[0]);
      } else {
        setError("Erro ao carregar tipos de evento do Calendly");
      }
    } catch (err) {
      console.error("Erro ao carregar event types:", err);
      setError("Erro ao conectar com Calendly");
    } finally {
      setLoadingEventTypes(false);
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
        eventTypeUri: selectedEventType.uri,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });

      const res = await fetch(`/api/calendly/slots?${params}`);
      const data = await res.json();

      if (res.ok) {
        if (data && typeof data === "object") {
          setSlots(data);
        }
      } else {
        setError(data.error || "Erro ao buscar horários");
      }
    } catch (err) {
      setError("Erro ao conectar com Calendly. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const findNextAvailable = async () => {
    if (!selectedEventType || searchingNext) return;

    setSearchingNext(true);
    setError("");
    setSlots({});

    try {
      const params = new URLSearchParams({
        eventTypeUri: selectedEventType.uri,
        findNext: "true",
      });

      const res = await fetch(`/api/calendly/slots?${params}`);
      const data = await res.json();

      if (res.ok && data.nextAvailableDate) {
        setSelectedDate(data.nextAvailableDate);
        setSlots(data.slots || {});
      } else if (data.message) {
        setError(data.message);
      } else {
        setError("Nenhuma disponibilidade encontrada");
      }
    } catch (err) {
      setError("Erro ao buscar disponibilidade");
    } finally {
      setSearchingNext(false);
    }
  };

  const addInvitee = () => {
    if (newInviteeName.trim() && newInviteeEmail.trim()) {
      setAdditionalInvitees([...additionalInvitees, { name: newInviteeName.trim(), email: newInviteeEmail.trim() }]);
      setNewInviteeName("");
      setNewInviteeEmail("");
    }
  };

  const removeInvitee = (index: number) => {
    setAdditionalInvitees(additionalInvitees.filter((_, i) => i !== index));
  };

  const handleCreateBooking = async () => {
    if (!selectedSlot || !attendeeName || !attendeeEmail || !selectedEventType || !selectedHost) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/calendly/admin-create-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csOwnerId: selectedHost.id,
          eventTypeUri: selectedEventType.uri,
          start: selectedSlot,
          attendeeName,
          attendeeEmail,
          companyId: selectedCompany?.id,
          lengthInMinutes: selectedEventType.lengthInMinutes,
          additionalInvitees,
          schedulingUrl: selectedSchedulingUrl,
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
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedHost(null);
    setHostSearch("");
    setHostResults([]);
    setSelectedCompany(null);
    setCompanySearch("");
    setCompanyResults([]);
    setSelectedEventType(eventTypes[0] || null);
    setSelectedDate("");
    setSelectedSlot("");
    setSelectedSchedulingUrl("");
    setAttendeeName("");
    setAttendeeEmail("");
    setAdditionalInvitees([]);
    setNewInviteeName("");
    setNewInviteeEmail("");
    setError("");
    setSearchingNext(false);
  };

  const slotsForDate = Object.entries(slots).flatMap(([, daySlots]) => daySlots);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex items-center ${s < 4 ? "flex-1" : ""}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  step >= s ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 4 && <div className={`flex-1 h-0.5 mx-2 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Responsável pela reunião (CS Owner ou Admin)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite para buscar..."
                  value={hostSearch}
                  onChange={(e) => setHostSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {selectedHost && (
                <div className="mt-2 p-3 rounded-lg border bg-primary/5 border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{selectedHost.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedHost.email}</p>
                    </div>
                    <Badge variant="secondary" size="sm">
                      {selectedHost.role === "ADMIN" ? "Admin" : "CS Owner"}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedHost(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {hostSearch.length >= 2 && !selectedHost && (
                <div className="mt-2 border rounded-lg overflow-hidden">
                  {hostLoading ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : hostResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhum usuário encontrado
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      {hostResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedHost(user);
                            setHostSearch("");
                            setHostResults([]);
                          }}
                          className="w-full p-3 hover:bg-muted/50 text-left flex items-center gap-3 border-b last:border-b-0"
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <Badge variant="outline" size="sm">
                            {user.role === "ADMIN" ? "Admin" : "CS Owner"}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={() => setStep(2)} disabled={!selectedHost} className="flex-1">
                Próximo
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Vincular a uma empresa (opcional)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite para buscar empresa..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {selectedCompany && (
                <div className="mt-2 p-3 rounded-lg border bg-primary/5 border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{selectedCompany.name}</p>
                      {selectedCompany.csOwner && (
                        <p className="text-xs text-muted-foreground">CS: {selectedCompany.csOwner.name}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCompany(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {companySearch.length >= 2 && !selectedCompany && (
                <div className="mt-2 border rounded-lg overflow-hidden">
                  {companyLoading ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : companyResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhuma empresa encontrada
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      {companyResults.map((company) => (
                        <button
                          key={company.id}
                          onClick={() => {
                            setSelectedCompany(company);
                            setCompanySearch("");
                            setCompanyResults([]);
                          }}
                          className="w-full p-3 hover:bg-muted/50 text-left flex items-center gap-3 border-b last:border-b-0"
                        >
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{company.name}</p>
                            {company.csOwner && (
                              <p className="text-xs text-muted-foreground">CS: {company.csOwner.name}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                {selectedCompany ? "Próximo" : "Pular"}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Evento</label>
              {loadingEventTypes ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              ) : eventTypes.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Nenhum tipo de evento encontrado
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
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot("");
                  }}
                  min={new Date().toISOString().split("T")[0]}
                  className="flex-1 h-10 rounded-md border bg-background px-3 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={findNextAvailable}
                  disabled={searchingNext || !selectedEventType}
                  className="whitespace-nowrap"
                >
                  {searchingNext ? <Loader2 className="h-4 w-4 animate-spin" /> : "Próxima disponível"}
                </Button>
              </div>
            </div>

            {selectedDate && (
              <div>
                <label className="text-sm font-medium mb-2 block">Horário</label>
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
                  </div>
                ) : slotsForDate.length === 0 ? (
                  <div className="py-4 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Nenhum horário disponível</p>
                    <Button variant="outline" size="sm" onClick={findNextAvailable} disabled={searchingNext}>
                      Buscar próxima disponibilidade
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                    {slotsForDate.map((slot) => {
                      const time = new Date(slot.time).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <button
                          key={slot.time}
                          onClick={() => {
                            setSelectedSlot(slot.time);
                            setSelectedSchedulingUrl(slot.schedulingUrl || "");
                          }}
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
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button onClick={() => setStep(4)} disabled={!selectedSlot} className="flex-1">
                Próximo
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Nome do Participante</label>
                <Input
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">E-mail</label>
                <Input
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Convidar mais pessoas (opcional)
                </label>
              </div>

              {additionalInvitees.length > 0 && (
                <div className="space-y-2 mb-3">
                  {additionalInvitees.map((invitee, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{invitee.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{invitee.email}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeInvitee(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Nome"
                  value={newInviteeName}
                  onChange={(e) => setNewInviteeName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={newInviteeEmail}
                  onChange={(e) => setNewInviteeEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addInvitee}
                  disabled={!newInviteeName.trim() || !newInviteeEmail.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
              <p className="font-medium">Resumo</p>
              <div className="space-y-1 text-muted-foreground">
                <p><span className="font-medium text-foreground">Evento:</span> {selectedEventType?.title}</p>
                <p>
                  <span className="font-medium text-foreground">Data:</span>{" "}
                  {selectedSlot && new Date(selectedSlot).toLocaleString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p><span className="font-medium text-foreground">Responsável:</span> {selectedHost?.name}</p>
                {selectedCompany && (
                  <p><span className="font-medium text-foreground">Empresa:</span> {selectedCompany.name}</p>
                )}
                {additionalInvitees.length > 0 && (
                  <p><span className="font-medium text-foreground">Convidados extras:</span> {additionalInvitees.length}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(3)}>
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
  const [csOwners, setCsOwners] = useState<{ id: string; name: string }[]>([]);
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

      const res = await fetch(`/api/calendly/all-bookings?${params}`);
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
              <a href="https://calendly.com/app/scheduled_events/user/me" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Calendly
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
                  <Link
                    key={booking.id}
                    href={`/admin/agenda/${booking.id}`}
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
                        {booking.csOwner && (
                          <Badge variant="outline" size="sm">
                            CS: {booking.csOwner.name}
                          </Badge>
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

        <NewBookingDialog open={newBookingOpen} onOpenChange={setNewBookingOpen} onSuccess={fetchData} />
      </div>
    </div>
  );
}
