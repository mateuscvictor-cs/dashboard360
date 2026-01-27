"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  User,
  Video,
  CalendarPlus,
  Loader2,
  ExternalLink,
} from "lucide-react";

type Booking = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  eventType: string;
  meetingUrl?: string;
  csOwner?: { id: string; name: string; avatar?: string };
};

type CompanyInfo = {
  csOwner?: { id: string; name: string };
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  ONBOARDING: "Onboarding",
  DELIVERY: "Entrega",
  CHECKIN: "Check-in",
  GENERAL: "Geral",
};

export default function ClienteAgendaPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [schedulingUrl, setSchedulingUrl] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, companyRes] = await Promise.all([
        fetch("/api/calcom/upcoming?limit=20"),
        fetch("/api/cliente/company"),
      ]);

      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (companyRes.ok) setCompany(await companyRes.json());
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleWithCS = async () => {
    if (!company?.csOwner?.id) return;
    setGeneratingLink(true);
    try {
      const res = await fetch("/api/calcom/booking-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "GENERAL",
          csOwnerId: company.csOwner.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSchedulingUrl(data.link);
        window.open(data.link, "_blank");
      }
    } catch (error) {
      console.error("Erro ao gerar link:", error);
    } finally {
      setGeneratingLink(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
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
        <Header title="Agenda" subtitle="Suas reuniões" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Agenda" subtitle="Suas reuniões com o CS" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {company?.csOwner && (
          <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Agendar reunião com seu CS</h3>
                  <p className="text-sm text-muted-foreground">
                    Responsável: {company.csOwner.name}
                  </p>
                </div>
                <Button onClick={scheduleWithCS} disabled={generatingLink}>
                  {generatingLink ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CalendarPlus className="h-4 w-4 mr-2" />
                  )}
                  Agendar Reunião
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximas Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">Nenhuma reunião agendada</p>
                {company?.csOwner && (
                  <Button variant="outline" onClick={scheduleWithCS} disabled={generatingLink}>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Agendar sua primeira reunião
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-primary/10 text-primary">
                      <span className="text-xs font-medium uppercase">
                        {new Date(booking.startTime).toLocaleDateString("pt-BR", { weekday: "short" })}
                      </span>
                      <span className="text-xl font-bold">
                        {new Date(booking.startTime).getDate()}
                      </span>
                      <span className="text-xs">
                        {new Date(booking.startTime).toLocaleDateString("pt-BR", { month: "short" })}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{booking.title}</span>
                        <Badge variant="secondary" size="sm">
                          {EVENT_TYPE_LABELS[booking.eventType] || booking.eventType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(booking.startTime)}
                        </span>
                        {booking.csOwner && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {booking.csOwner.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {booking.meetingUrl && (
                      <Button variant="default" size="sm" asChild>
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
      </div>
    </div>
  );
}
