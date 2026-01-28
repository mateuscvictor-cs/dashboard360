"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Building2,
  Video,
  FileText,
  Sparkles,
  RefreshCw,
  Save,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Booking = {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: string;
  eventType: string;
  meetingUrl?: string;
  attendeeName: string;
  attendeeEmail: string;
  notes?: string;
  fathomUrl?: string;
  fathomRecordingId?: string;
  transcript?: string;
  summary?: string;
  actionItems?: Array<{
    description: string;
    completed?: boolean;
    assignee?: { name: string };
  }>;
  csOwner?: {
    id: string;
    user: { id: string; name: string; email: string; image?: string };
  };
  company?: { id: string; name: string; logo?: string };
  delivery?: { id: string; title: string };
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  SCHEDULED: "Agendado",
  COMPLETED: "Realizado",
  CANCELLED: "Cancelado",
  RESCHEDULED: "Reagendado",
  NO_SHOW: "Não compareceu",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  ONBOARDING: "Onboarding",
  DELIVERY: "Entrega",
  CHECKIN: "Check-in",
  GENERAL: "Geral",
};

export default function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [notes, setNotes] = useState("");
  const [fathomUrl, setFathomUrl] = useState("");

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    try {
      const res = await fetch(`/api/calendly/bookings/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/admin/agenda");
          return;
        }
        throw new Error("Erro ao carregar");
      }
      const data = await res.json();
      setBooking(data);
      setNotes(data.notes || "");
      setFathomUrl(data.fathomUrl || "");
    } catch {
      setError("Erro ao carregar detalhes");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/calendly/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, fathomUrl }),
      });

      if (!res.ok) throw new Error("Erro ao salvar");

      const data = await res.json();
      setBooking(data);
      setSuccess("Salvo com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFathom = async () => {
    setSyncing(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/calendly/bookings/${id}/sync-fathom`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao sincronizar");
        return;
      }

      setBooking(data.booking);
      setFathomUrl(data.booking.fathomUrl || "");
      setSuccess("Sincronizado com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao sincronizar com Fathom");
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerateDemands = async () => {
    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/calendly/bookings/${id}/generate-demands`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao gerar demandas");
        return;
      }

      setSuccess(data.message);
      setTimeout(() => setSuccess(""), 5000);
    } catch {
      setError("Erro ao gerar demandas");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Agendamento não encontrado</p>
      </div>
    );
  }

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/agenda">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{booking.title}</h1>
          <p className="text-muted-foreground">Detalhes da reunião</p>
        </div>
        <Badge variant={booking.status === "SCHEDULED" ? "default" : "secondary"}>
          {STATUS_LABELS[booking.status] || booking.status}
        </Badge>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {startDate.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">
                      {startDate.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {endDate.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Participante</p>
                    <p className="font-medium">{booking.attendeeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.attendeeEmail}
                    </p>
                  </div>
                </div>
                {booking.company && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Empresa</p>
                      <p className="font-medium">{booking.company.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {booking.meetingUrl && (
                <div className="pt-4 border-t">
                  <Button variant="outline" asChild>
                    <a
                      href={booking.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Acessar Reunião
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Fathom</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncFathom}
                disabled={syncing}
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sincronizar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Link do Fathom</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={fathomUrl}
                    onChange={(e) => setFathomUrl(e.target.value)}
                    placeholder="https://fathom.video/..."
                  />
                  {fathomUrl && (
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href={fathomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {booking.summary && (
                <div>
                  <label className="text-sm font-medium">Resumo</label>
                  <div className="mt-1 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                    {booking.summary}
                  </div>
                </div>
              )}

              {booking.transcript && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="transcript">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Transcrição
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {booking.transcript}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {booking.actionItems && booking.actionItems.length > 0 && (
                <div>
                  <label className="text-sm font-medium">
                    Action Items ({booking.actionItems.length})
                  </label>
                  <ul className="mt-2 space-y-2">
                    {booking.actionItems.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 p-2 bg-muted rounded-lg text-sm"
                      >
                        <CheckCircle2
                          className={`h-4 w-4 mt-0.5 ${
                            item.completed
                              ? "text-green-500"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span>{item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre a reunião..."
                rows={6}
              />
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Responsável</CardTitle>
            </CardHeader>
            <CardContent>
              {booking.csOwner?.user && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {booking.csOwner.user.image ? (
                      <img
                        src={booking.csOwner.user.image}
                        alt=""
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{booking.csOwner.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.csOwner.user.email}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-sm">
                {EVENT_TYPE_LABELS[booking.eventType] || booking.eventType}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">IA</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGenerateDemands}
                disabled={generating || (!booking.summary && !booking.transcript)}
                className="w-full"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Gerar Demandas
              </Button>
              {!booking.summary && !booking.transcript && (
                <p className="text-xs text-muted-foreground mt-2">
                  Sincronize com o Fathom primeiro para habilitar
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
