"use client";

import Link from "next/link";
import {
  AlertTriangle,
  TrendingDown,
  Clock,
  MessageSquare,
  TrendingUp,
  UserX,
  ArrowRight,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PriorityItem, Priority } from "@/types";
import { cn } from "@/lib/utils";

interface PriorityFeedProps {
  items: PriorityItem[];
}

const reasonIcons = {
  risk: AlertTriangle,
  delivery: Clock,
  adoption: TrendingDown,
  sentiment: MessageSquare,
  expansion: TrendingUp,
  silence: UserX,
};

const reasonGradients = {
  risk: "from-red-500 to-rose-500",
  delivery: "from-orange-500 to-amber-500",
  adoption: "from-purple-500 to-indigo-500",
  sentiment: "from-pink-500 to-rose-400",
  expansion: "from-emerald-500 to-teal-500",
  silence: "from-slate-500 to-zinc-500",
};

const priorityConfig: Record<Priority, { label: string; variant: "critical" | "risk" | "attention" | "healthy"; dotColor: string }> = {
  critical: { label: "Crítico", variant: "critical", dotColor: "bg-health-critical" },
  high: { label: "Alto", variant: "risk", dotColor: "bg-health-risk" },
  medium: { label: "Médio", variant: "attention", dotColor: "bg-health-attention" },
  low: { label: "Baixo", variant: "healthy", dotColor: "bg-health-healthy" },
};

export function PriorityFeed({ items }: PriorityFeedProps) {
  return (
    <Card className="col-span-2 overflow-hidden">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-muted/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-orange-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Hoje em Foco</CardTitle>
              <p className="text-xs text-muted-foreground">Ações prioritárias do dia</p>
            </div>
          </div>
          <Badge variant="secondary" className="font-semibold">{items.length} itens</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {items.slice(0, 6).map((item, index) => {
            const Icon = reasonIcons[item.reasonType];
            const gradient = reasonGradients[item.reasonType];
            const priority = priorityConfig[item.priority];

            return (
              <div
                key={item.id}
                className={cn(
                  "group relative flex items-start gap-4 p-4 transition-all duration-200 hover:bg-muted/50",
                  index === 0 && "bg-gradient-to-r from-danger-light/50 to-transparent"
                )}
              >
                {index === 0 && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-health-critical to-health-critical/50 rounded-r-full" />
                )}
                
                <div className="relative">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md",
                    gradient,
                    `shadow-${item.reasonType === 'expansion' ? 'emerald' : item.reasonType === 'delivery' ? 'orange' : 'red'}-500/20`
                  )}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card", priority.dotColor)} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/conta/${item.accountId}`}
                      className="font-semibold hover:text-primary transition-colors truncate"
                    >
                      {item.accountName}
                    </Link>
                    <Badge variant={`${priority.variant}-soft`} size="sm" dot pulse={priority.variant === "critical"}>
                      {priority.label}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.reason}</p>
                  
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 rounded-md bg-muted font-medium">{item.recommendedAction.split(" ").slice(0, 3).join(" ")}...</span>
                      <span>•</span>
                      <span className="text-muted-foreground/70">{item.impact.substring(0, 30)}...</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 opacity-0 group-hover:opacity-100 transition-all text-primary hover:text-primary hover:bg-primary/10"
                    >
                      Executar
                      <ChevronRight className="h-4 w-4 ml-0.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="p-4 border-t bg-muted/30">
          <Button variant="outline" className="w-full group">
            Ver todas as {items.length} ações pendentes
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
