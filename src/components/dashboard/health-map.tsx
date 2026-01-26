"use client";

import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PortfolioHealth } from "@/types";
import { cn } from "@/lib/utils";

interface HealthMapProps {
  data: PortfolioHealth;
}

const healthCategories = [
  { key: "healthy", label: "Saudável", color: "bg-health-healthy", gradient: "from-emerald-500 to-teal-500", textColor: "text-health-healthy" },
  { key: "attention", label: "Atenção", color: "bg-health-attention", gradient: "from-amber-500 to-yellow-500", textColor: "text-health-attention" },
  { key: "risk", label: "Risco", color: "bg-health-risk", gradient: "from-orange-500 to-red-400", textColor: "text-health-risk" },
  { key: "critical", label: "Crítico", color: "bg-health-critical", gradient: "from-red-500 to-rose-600", textColor: "text-health-critical" },
] as const;

export function HealthMap({ data }: HealthMapProps) {
  const TrendIcon = data.trend === "up" ? TrendingUp : data.trend === "down" ? TrendingDown : Minus;
  const trendColor = data.trend === "up" ? "text-health-healthy" : data.trend === "down" ? "text-health-critical" : "text-muted-foreground";
  const trendBg = data.trend === "up" ? "bg-health-healthy-light" : data.trend === "down" ? "bg-health-critical-light" : "bg-muted";

  return (
    <Card variant="gradient" className="overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <CardHeader className="pb-2 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Saúde do Portfólio</CardTitle>
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold", trendBg, trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span>{data.trend === "up" ? "+" : ""}{data.trendValue}%</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-4xl font-bold tracking-tight">{data.total}</span>
          <span className="text-sm text-muted-foreground font-medium">contas ativas</span>
        </div>

        <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-muted">
          {healthCategories.map((cat, index) => {
            const value = data[cat.key as keyof PortfolioHealth] as number;
            const percentage = (value / data.total) * 100;
            return (
              <div
                key={cat.key}
                className={cn(
                  "transition-all duration-500 relative",
                  `bg-gradient-to-r ${cat.gradient}`,
                  index === 0 && "rounded-l-full",
                  index === healthCategories.length - 1 && "rounded-r-full"
                )}
                style={{ width: `${percentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {healthCategories.map((cat) => {
            const value = data[cat.key as keyof PortfolioHealth] as number;
            const percentage = Math.round((value / data.total) * 100);
            return (
              <button
                key={cat.key}
                className="group text-center p-2 rounded-xl hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className={cn("h-2.5 w-2.5 rounded-full bg-gradient-to-br", cat.gradient)} />
                  <span className={cn("text-xl font-bold", cat.textColor)}>{value}</span>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium block">{cat.label}</span>
                <span className="text-[10px] text-muted-foreground/70">{percentage}%</span>
              </button>
            );
          })}
        </div>

        <Button variant="ghost" size="sm" className="w-full mt-4 text-muted-foreground hover:text-foreground group">
          Ver detalhes do portfólio
          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
