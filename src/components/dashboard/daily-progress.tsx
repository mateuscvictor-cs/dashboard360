"use client";

import { CheckCircle2, Target, Trophy, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyProgress as DailyProgressType } from "@/types";
import { formatRelativeTime, cn } from "@/lib/utils";

interface DailyProgressProps {
  data: DailyProgressType;
}

export function DailyProgress({ data }: DailyProgressProps) {
  const percentage = Math.round((data.completed / data.total) * 100);
  const isGreat = percentage >= 75;
  const isGood = percentage >= 50;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg shadow-sm bg-gradient-to-br",
              isGreat ? "from-emerald-500 to-teal-500" : isGood ? "from-amber-500 to-orange-500" : "from-slate-500 to-zinc-500"
            )}>
              <Target className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Progresso</CardTitle>
          </div>
          {isGreat && (
            <div className="flex items-center gap-1 text-health-healthy">
              <Flame className="h-4 w-4" />
              <span className="text-xs font-semibold">Em dia!</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                "text-4xl font-bold tracking-tight",
                isGreat ? "text-health-healthy" : isGood ? "text-health-attention" : "text-foreground"
              )}>
                {data.completed}
              </span>
              <span className="text-lg text-muted-foreground font-medium">/ {data.total}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">ações concluídas hoje</p>
          </div>
          
          <div className="relative h-16 w-16">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3"
                strokeDasharray={`${percentage}, 100`}
                strokeLinecap="round"
                className={cn(
                  isGreat ? "stroke-health-healthy" : isGood ? "stroke-health-attention" : "stroke-primary"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold">{percentage}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Últimas ações
          </p>
          {data.completedItems.slice(0, 3).map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-2 p-2 rounded-lg transition-colors",
                index === 0 ? "bg-health-healthy-light" : "hover:bg-muted/50"
              )}
            >
              <CheckCircle2 className={cn(
                "h-4 w-4 shrink-0 mt-0.5",
                index === 0 ? "text-health-healthy" : "text-muted-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.action}</p>
                <p className="text-[10px] text-muted-foreground">
                  {item.accountName} • {formatRelativeTime(item.completedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
