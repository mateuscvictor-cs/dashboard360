"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TimelineDelivery = {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  startDate: string;
  dueDate: string;
  status: string;
  progress: number;
};

interface DeliveryTimelineProps {
  deliveries: TimelineDelivery[];
}

const statusConfig = {
  completed: { 
    icon: CheckCircle2, 
    color: "bg-health-healthy", 
    text: "text-health-healthy",
    label: "Concluída" 
  },
  in_progress: { 
    icon: Loader2, 
    color: "bg-primary", 
    text: "text-primary",
    label: "Em andamento" 
  },
  pending: { 
    icon: Clock, 
    color: "bg-muted-foreground", 
    text: "text-muted-foreground",
    label: "Pendente" 
  },
  delayed: { 
    icon: AlertTriangle, 
    color: "bg-health-risk", 
    text: "text-health-risk",
    label: "Atrasada" 
  },
  blocked: { 
    icon: XCircle, 
    color: "bg-health-critical", 
    text: "text-health-critical",
    label: "Bloqueada" 
  },
};

export function DeliveryTimeline({ deliveries }: DeliveryTimelineProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
  
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  const getDeliveriesForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return deliveries.filter(d => d.dueDate === dateStr);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { day: "2-digit" });
  };

  const formatWeekday = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  };

  const isToday = (date: Date) => {
    const todayStr = today.toISOString().split("T")[0];
    const dateStr = date.toISOString().split("T")[0];
    return todayStr === dateStr;
  };

  const isWeekend = (date: Date) => {
    return date.getDay() === 0 || date.getDay() === 6;
  };

  if (deliveries.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Timeline de Entregas
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhuma entrega programada para as próximas 2 semanas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Timeline de Entregas
            <Badge variant="secondary" size="sm">
              {deliveries.length} {deliveries.length === 1 ? "entrega" : "entregas"}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={() => setWeekOffset(weekOffset - 1)}
              disabled={weekOffset <= -2}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setWeekOffset(0)}
              className="text-xs"
            >
              Hoje
            </Button>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={() => setWeekOffset(weekOffset + 1)}
              disabled={weekOffset >= 2}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-14 gap-1 mb-2">
              {days.map((date, i) => (
                <div 
                  key={i}
                  className={cn(
                    "text-center py-1 rounded-md",
                    isToday(date) && "bg-primary text-primary-foreground",
                    isWeekend(date) && !isToday(date) && "bg-muted/50"
                  )}
                >
                  <div className="text-[10px] uppercase">{formatWeekday(date)}</div>
                  <div className="text-xs font-semibold">{formatDate(date)}</div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-14 gap-1 min-h-[100px]">
              {days.map((date, i) => {
                const dayDeliveries = getDeliveriesForDay(date);
                return (
                  <div 
                    key={i}
                    className={cn(
                      "border rounded-md p-1 min-h-[80px]",
                      isToday(date) && "border-primary",
                      isWeekend(date) && "bg-muted/30"
                    )}
                  >
                    {dayDeliveries.slice(0, 3).map((delivery) => {
                      const config = statusConfig[delivery.status as keyof typeof statusConfig] || statusConfig.pending;
                      const Icon = config.icon;
                      return (
                        <Link
                          key={delivery.id}
                          href={`/admin/conta/${delivery.companyId}`}
                          className={cn(
                            "block mb-1 p-1.5 rounded text-[10px] transition-all hover:shadow-sm",
                            config.color + "/10",
                            "border border-transparent hover:border-current",
                            config.text
                          )}
                          title={`${delivery.title} - ${delivery.companyName}`}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <Icon className="h-2.5 w-2.5 shrink-0" />
                            <span className="font-medium truncate">{delivery.companyName}</span>
                          </div>
                          <div className="truncate text-foreground/70">
                            {delivery.title}
                          </div>
                          {delivery.progress > 0 && delivery.progress < 100 && (
                            <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full", config.color)}
                                style={{ width: `${delivery.progress}%` }}
                              />
                            </div>
                          )}
                        </Link>
                      );
                    })}
                    {dayDeliveries.length > 3 && (
                      <div className="text-[10px] text-muted-foreground text-center">
                        +{dayDeliveries.length - 3} mais
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          {Object.entries(statusConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <div className={cn("h-2.5 w-2.5 rounded-full", config.color)} />
                <span className="text-muted-foreground">{config.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
