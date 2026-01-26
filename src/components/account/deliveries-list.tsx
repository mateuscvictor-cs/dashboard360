"use client";

import { CheckCircle2, Clock, AlertCircle, Pause, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Delivery } from "@/types";
import { cn } from "@/lib/utils";

interface DeliveriesListProps {
  deliveries: Delivery[];
}

const statusConfig = {
  completed: { label: "Concluído", icon: CheckCircle2, color: "text-health-healthy" },
  in_progress: { label: "Em andamento", icon: Clock, color: "text-health-attention" },
  pending: { label: "Pendente", icon: Circle, color: "text-muted-foreground" },
  blocked: { label: "Bloqueado", icon: Pause, color: "text-health-risk" },
  delayed: { label: "Atrasado", icon: AlertCircle, color: "text-health-critical" },
};

const impactBadge = {
  high: "danger",
  medium: "warning",
  low: "secondary",
} as const;

export function DeliveriesList({ deliveries }: DeliveriesListProps) {
  if (deliveries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Nenhuma entrega pendente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deliveries.map((delivery) => {
        const status = statusConfig[delivery.status];
        const StatusIcon = status.icon;

        return (
          <div key={delivery.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-start gap-3">
                <StatusIcon className={cn("h-5 w-5 mt-0.5", status.color)} />
                <div>
                  <p className="font-medium">{delivery.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Responsável: {delivery.assignee}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={impactBadge[delivery.impact]}>
                  Impacto {delivery.impact === "high" ? "Alto" : delivery.impact === "medium" ? "Médio" : "Baixo"}
                </Badge>
                <Badge variant="secondary">{status.label}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Progress
                value={delivery.progress}
                className="flex-1 h-2"
                indicatorClassName={cn(
                  delivery.status === "completed" && "bg-health-healthy",
                  delivery.status === "blocked" && "bg-health-risk",
                  delivery.status === "delayed" && "bg-health-critical"
                )}
              />
              <span className="text-sm font-medium w-12 text-right">{delivery.progress}%</span>
              <span className="text-sm text-muted-foreground">
                {new Date(delivery.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </span>
            </div>

            {delivery.blockers && delivery.blockers.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-health-risk/5 border border-health-risk/20">
                <p className="text-xs font-medium text-health-risk mb-1">Bloqueios:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {delivery.blockers.map((blocker, index) => (
                    <li key={index}>• {blocker}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
