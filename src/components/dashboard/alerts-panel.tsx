"use client";

import {
  Activity,
  Clock,
  Frown,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Bell,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Alert } from "@/types";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

interface AlertsPanelProps {
  alerts: Alert[];
}

const alertIcons = {
  activity_drop: Activity,
  delivery_delay: Clock,
  negative_sentiment: Frown,
  no_response: AlertCircle,
  churn_risk: AlertCircle,
  expansion_opportunity: TrendingUp,
};

const alertConfig = {
  activity_drop: { gradient: "from-purple-500 to-indigo-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
  delivery_delay: { gradient: "from-orange-500 to-amber-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
  negative_sentiment: { gradient: "from-pink-500 to-rose-500", bg: "bg-pink-50 dark:bg-pink-500/10" },
  no_response: { gradient: "from-slate-500 to-zinc-500", bg: "bg-slate-50 dark:bg-slate-500/10" },
  churn_risk: { gradient: "from-red-500 to-rose-500", bg: "bg-red-50 dark:bg-red-500/10" },
  expansion_opportunity: { gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
};

const severityBadge = {
  critical: "critical",
  high: "risk",
  medium: "attention",
  low: "healthy",
} as const;

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-500 shadow-sm">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Alertas</CardTitle>
          </div>
          <Badge variant="danger-soft" size="sm">{alerts.length} ativos</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.slice(0, 4).map((alert) => {
          const Icon = alertIcons[alert.type];
          const config = alertConfig[alert.type];

          return (
            <div
              key={alert.id}
              className={cn(
                "group relative flex items-start gap-3 rounded-xl p-3 transition-all duration-200 hover:shadow-md cursor-pointer",
                config.bg
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm",
                config.gradient
              )}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold truncate">{alert.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {alert.accountName}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {formatRelativeTime(alert.detectedAt)}
                  </span>
                  {alert.action && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs font-semibold">
                      {alert.action}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {alerts.length > 4 && (
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
            Ver mais {alerts.length - 4} alertas
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
