"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus, Building2, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioHealth {
  total: number;
  healthy: number;
  attention: number;
  risk: number;
  critical: number;
  trend: "up" | "down" | "stable";
  trendValue: number;
}

interface PortfolioDonutProps {
  data: PortfolioHealth;
  onSegmentClick?: (status: string) => void;
}

const COLORS = {
  healthy: "#10b981",
  attention: "#f59e0b",
  risk: "#f97316",
  critical: "#ef4444",
};

const GRADIENTS = {
  healthy: ["#10b981", "#059669"],
  attention: ["#f59e0b", "#d97706"],
  risk: ["#f97316", "#ea580c"],
  critical: ["#ef4444", "#dc2626"],
};

const LABELS = {
  healthy: "Saudável",
  attention: "Atenção",
  risk: "Risco",
  critical: "Crítico",
};

const ICONS = {
  healthy: ShieldCheck,
  attention: AlertTriangle,
  risk: AlertTriangle,
  critical: AlertTriangle,
};

export function PortfolioDonut({ data, onSegmentClick }: PortfolioDonutProps) {
  const chartData = [
    { name: "healthy", value: data.healthy, label: LABELS.healthy, color: COLORS.healthy },
    { name: "attention", value: data.attention, label: LABELS.attention, color: COLORS.attention },
    { name: "risk", value: data.risk, label: LABELS.risk, color: COLORS.risk },
    { name: "critical", value: data.critical, label: LABELS.critical, color: COLORS.critical },
  ].filter(item => item.value > 0);

  const TrendIcon = data.trend === "up" ? TrendingUp : data.trend === "down" ? TrendingDown : Minus;
  const healthyPercentage = data.total > 0 ? Math.round((data.healthy / data.total) * 100) : 0;
  const atRiskCount = data.risk + data.critical;

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; value: number; name: string } }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = data.total > 0 ? Math.round((item.value / data.total) * 100) : 0;
      return (
        <div className="rounded-lg border bg-background/95 backdrop-blur-sm px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="h-3 w-3 rounded-full" 
              style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }}
            />
            <p className="text-sm font-semibold">{item.label}</p>
          </div>
          <p className="text-lg font-bold">{item.value}</p>
          <p className="text-xs text-muted-foreground">
            {percentage}% do portfólio
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Saúde do Portfólio</CardTitle>
          </div>
          {atRiskCount > 0 && (
            <Badge variant="danger" size="sm" className="animate-pulse">
              {atRiskCount} em risco
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative h-36 w-36">
            <svg className="absolute inset-0 h-full w-full">
              <defs>
                {Object.entries(GRADIENTS).map(([key, [start, end]]) => (
                  <linearGradient key={key} id={`gradient-${key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={start} />
                    <stop offset="100%" stopColor={end} />
                  </linearGradient>
                ))}
              </defs>
            </svg>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                  onClick={(entry) => onSegmentClick?.(entry.name)}
                  style={{ cursor: onSegmentClick ? "pointer" : "default" }}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-${entry.name})`}
                      stroke="hsl(var(--background))"
                      strokeWidth={3}
                      className="drop-shadow-sm"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{data.total}</span>
              <span className="text-[10px] text-muted-foreground font-medium">EMPRESAS</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-1.5">
            {[
              { key: "healthy", value: data.healthy },
              { key: "attention", value: data.attention },
              { key: "risk", value: data.risk },
              { key: "critical", value: data.critical },
            ].map((item) => {
              const Icon = ICONS[item.key as keyof typeof ICONS];
              const percentage = data.total > 0 ? Math.round((item.value / data.total) * 100) : 0;
              const isAlert = item.key === "risk" || item.key === "critical";
              
              return (
                <button
                  key={item.key}
                  onClick={() => onSegmentClick?.(item.key)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all",
                    onSegmentClick && "hover:scale-[1.02] hover:shadow-md cursor-pointer",
                    item.value > 0 && isAlert && "bg-gradient-to-r from-transparent to-red-500/5"
                  )}
                  style={{ 
                    backgroundColor: item.value > 0 ? `${COLORS[item.key as keyof typeof COLORS]}10` : undefined 
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="h-8 w-8 rounded-lg flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${COLORS[item.key as keyof typeof COLORS]}20` }}
                    >
                      <Icon 
                        className="h-4 w-4" 
                        style={{ color: COLORS[item.key as keyof typeof COLORS] }}
                      />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-medium block">{LABELS[item.key as keyof typeof LABELS]}</span>
                      <span className="text-[10px] text-muted-foreground">{percentage}% do total</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span 
                      className="text-lg font-bold"
                      style={{ color: item.value > 0 ? COLORS[item.key as keyof typeof COLORS] : undefined }}
                    >
                      {item.value}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            healthyPercentage >= 70 ? "bg-emerald-500/10" : healthyPercentage >= 50 ? "bg-amber-500/10" : "bg-red-500/10"
          )}>
            <ShieldCheck className={cn(
              "h-5 w-5",
              healthyPercentage >= 70 ? "text-emerald-500" : healthyPercentage >= 50 ? "text-amber-500" : "text-red-500"
            )} />
            <div>
              <p className="text-xs text-muted-foreground">Taxa de Saúde</p>
              <p className={cn(
                "text-sm font-bold",
                healthyPercentage >= 70 ? "text-emerald-500" : healthyPercentage >= 50 ? "text-amber-500" : "text-red-500"
              )}>
                {healthyPercentage}%
              </p>
            </div>
          </div>
          
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            data.trend === "up" ? "bg-emerald-500/10" : data.trend === "down" ? "bg-red-500/10" : "bg-muted"
          )}>
            <TrendIcon className={cn(
              "h-5 w-5",
              data.trend === "up" ? "text-emerald-500" : data.trend === "down" ? "text-red-500" : "text-muted-foreground"
            )} />
            <div>
              <p className="text-xs text-muted-foreground">vs. Semana</p>
              <p className={cn(
                "text-sm font-bold",
                data.trend === "up" ? "text-emerald-500" : data.trend === "down" ? "text-red-500" : "text-muted-foreground"
              )}>
                {data.trend === "up" ? "+" : data.trend === "down" ? "-" : ""}
                {Math.abs(data.trendValue)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
