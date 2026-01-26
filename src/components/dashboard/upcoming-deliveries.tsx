"use client";

import { Calendar, AlertCircle, Clock, CheckCircle2, Pause, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Delivery {
  id: string;
  account: string;
  title: string;
  dueDate: string;
  status: string;
  risk: string;
}

interface UpcomingDeliveriesProps {
  deliveries: Delivery[];
}

const statusConfig = {
  delayed: { icon: AlertCircle, gradient: "from-red-500 to-rose-500", bg: "bg-red-50 dark:bg-red-500/10" },
  blocked: { icon: Pause, gradient: "from-orange-500 to-amber-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
  in_progress: { icon: Clock, gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
  pending: { icon: Calendar, gradient: "from-slate-400 to-zinc-400", bg: "bg-slate-50 dark:bg-slate-500/10" },
  completed: { icon: CheckCircle2, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
};

const riskBadge = {
  high: "danger-soft",
  medium: "warning-soft",
  low: "secondary",
} as const;

export function UpcomingDeliveries({ deliveries }: UpcomingDeliveriesProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-sm">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Entregas</CardTitle>
          </div>
          <Badge variant="secondary" size="sm">{deliveries.length} próximas</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {deliveries.map((delivery, index) => {
            const config = statusConfig[delivery.status as keyof typeof statusConfig] || statusConfig.pending;
            const Icon = config.icon;
            const isUrgent = delivery.status === "delayed" || delivery.status === "blocked";

            return (
              <div
                key={delivery.id}
                className={cn(
                  "group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:shadow-md cursor-pointer",
                  config.bg,
                  isUrgent && index === 0 && "ring-1 ring-health-critical/20"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm",
                  config.gradient
                )}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{delivery.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{delivery.account}</p>
                </div>
                
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={riskBadge[delivery.risk as keyof typeof riskBadge] || "secondary"} size="sm">
                    {delivery.risk === "high" ? "Urgente" : delivery.risk === "medium" ? "Atenção" : "Normal"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {new Date(delivery.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        <Button variant="ghost" size="sm" className="w-full mt-4 text-muted-foreground group">
          Ver calendário completo
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
