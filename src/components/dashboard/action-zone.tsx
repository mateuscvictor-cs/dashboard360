"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  TrendingDown,
  Package,
  Users,
  MessageSquare,
  Zap,
  ArrowRight,
  Target,
  Clock,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ActionItem = {
  id: string;
  accountId: string;
  accountName: string;
  reason: string;
  reasonType: string;
  priority: string;
  action: string;
};

interface ActionZoneProps {
  actions: ActionItem[];
}

const reasonConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  risk: { icon: AlertTriangle, color: "#ef4444", bg: "bg-red-500/10", label: "Risco" },
  delivery: { icon: Package, color: "#8b5cf6", bg: "bg-violet-500/10", label: "Entrega" },
  adoption: { icon: TrendingDown, color: "#f59e0b", bg: "bg-amber-500/10", label: "Adoção" },
  sentiment: { icon: MessageSquare, color: "#3b82f6", bg: "bg-blue-500/10", label: "Sentimento" },
  expansion: { icon: Zap, color: "#10b981", bg: "bg-emerald-500/10", label: "Expansão" },
  silence: { icon: Users, color: "#6b7280", bg: "bg-gray-500/10", label: "Silêncio" },
};

const priorityConfig = {
  critical: {
    gradient: "from-red-500 to-rose-600",
    border: "border-l-red-500",
    bg: "bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent",
    badge: "danger",
    glow: "shadow-red-500/20",
  },
  high: {
    gradient: "from-orange-500 to-amber-500",
    border: "border-l-orange-500",
    bg: "bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent",
    badge: "warning",
    glow: "shadow-orange-500/20",
  },
  medium: {
    gradient: "from-amber-400 to-yellow-500",
    border: "border-l-amber-400",
    bg: "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent",
    badge: "attention",
    glow: "shadow-amber-500/20",
  },
  low: {
    gradient: "from-gray-400 to-gray-500",
    border: "border-l-gray-400",
    bg: "bg-muted/30",
    badge: "secondary",
    glow: "",
  },
} as const;

export function ActionZone({ actions }: ActionZoneProps) {
  const criticalCount = actions.filter(a => a.priority === "critical").length;
  const highCount = actions.filter(a => a.priority === "high").length;

  if (actions.length === 0) {
    return (
      <Card className="border-dashed border-2 border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
        <CardContent className="py-10 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">Tudo sob controle!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Nenhuma ação urgente no momento. Continue monitorando seu portfólio.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-2 border-dashed border-primary/20">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/25">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">O que fazer agora</CardTitle>
              <p className="text-xs text-muted-foreground">Ações prioritárias do dia</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="danger" className="gap-1 animate-pulse">
                <Flame className="h-3 w-3" />
                {criticalCount} crítico{criticalCount > 1 ? "s" : ""}
              </Badge>
            )}
            {highCount > 0 && (
              <Badge variant="warning" className="gap-1">
                <Clock className="h-3 w-3" />
                {highCount} urgente{highCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action, index) => {
            const reason = reasonConfig[action.reasonType] || reasonConfig.risk;
            const priority = priorityConfig[action.priority as keyof typeof priorityConfig] || priorityConfig.medium;
            const Icon = reason.icon;
            
            return (
              <div
                key={action.id}
                className={cn(
                  "relative rounded-xl border-l-4 p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                  priority.border,
                  priority.bg,
                  priority.glow && `shadow-md ${priority.glow}`
                )}
              >
                {index === 0 && action.priority === "critical" && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="relative flex h-6 w-6">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-gradient-to-br from-red-500 to-rose-600 items-center justify-center shadow-lg">
                        <Flame className="h-3 w-3 text-white" />
                      </span>
                    </span>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div 
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
                      reason.bg
                    )}
                  >
                    <Icon className="h-5 w-5" style={{ color: reason.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant={priority.badge as "danger" | "warning" | "attention" | "secondary"} 
                        size="sm"
                        className="text-[10px]"
                      >
                        {action.priority === "critical" ? "CRÍTICO" : 
                         action.priority === "high" ? "URGENTE" : 
                         action.priority === "medium" ? "MÉDIO" : "BAIXO"}
                      </Badge>
                      <Badge variant="outline" size="sm" className="text-[10px]">
                        {reason.label}
                      </Badge>
                    </div>
                    <Link 
                      href={`/admin/conta/${action.accountId}`}
                      className="font-semibold text-sm hover:underline block truncate mb-1"
                    >
                      {action.accountName}
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {action.reason}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-dashed">
                      <p className="text-[11px] font-medium text-primary flex items-center gap-1 truncate max-w-[60%]">
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <span className="truncate">{action.action}</span>
                      </p>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className={cn(
                          "h-7 text-xs px-3 shadow-sm",
                          `bg-gradient-to-r ${priority.gradient} hover:opacity-90`
                        )}
                        asChild
                      >
                        <Link href={`/admin/conta/${action.accountId}`}>
                          Executar
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
