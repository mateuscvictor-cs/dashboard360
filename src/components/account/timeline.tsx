"use client";

import {
  Video,
  MessageSquare,
  Package,
  AlertCircle,
  Flag,
  MessageCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TimelineEvent, Sentiment } from "@/types";
import { cn } from "@/lib/utils";

interface TimelineProps {
  events: TimelineEvent[];
}

const eventIcons = {
  meeting: Video,
  message: MessageSquare,
  delivery: Package,
  incident: AlertCircle,
  milestone: Flag,
  feedback: MessageCircle,
};

const eventLabels = {
  meeting: "Reunião",
  message: "Mensagem",
  delivery: "Entrega",
  incident: "Incidente",
  milestone: "Marco",
  feedback: "Feedback",
};

const sentimentColors: Record<Sentiment, string> = {
  positive: "border-l-health-healthy",
  neutral: "border-l-muted-foreground",
  negative: "border-l-health-critical",
};

export function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Nenhum evento registrado</p>
        <p className="text-xs text-muted-foreground mt-1">
          Registre interações para construir o histórico
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const Icon = eventIcons[event.type];
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className="relative flex gap-4">
            {!isLast && (
              <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
            )}

            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>

            <div
              className={cn(
                "flex-1 rounded-lg border border-l-4 p-4",
                event.sentiment ? sentimentColors[event.sentiment] : "border-l-muted-foreground"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge variant="secondary">{eventLabels[event.type]}</Badge>
              </div>

              <p className="text-sm text-muted-foreground">{event.description}</p>

              {event.participants && event.participants.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Participantes: {event.participants.join(", ")}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
