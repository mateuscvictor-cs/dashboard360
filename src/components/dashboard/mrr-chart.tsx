"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

type MRRDataPoint = {
  month: string;
  year: number;
  mrr: number;
};

interface MRRChartProps {
  data: MRRDataPoint[];
  currentMRR: number;
}

export function MRRChart({ data, currentMRR }: MRRChartProps) {
  const previousMRR = data.length > 1 ? data[data.length - 2].mrr : currentMRR;
  const firstMRR = data.length > 0 ? data[0].mrr : currentMRR;
  const variation = previousMRR > 0 ? ((currentMRR - previousMRR) / previousMRR) * 100 : 0;
  const totalGrowth = firstMRR > 0 ? ((currentMRR - firstMRR) / firstMRR) * 100 : 0;
  const isPositive = variation >= 0;
  const avgMRR = data.length > 0 ? data.reduce((sum, d) => sum + d.mrr, 0) / data.length : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const idx = data.findIndex(d => d.month === label);
      const prevValue = idx > 0 ? data[idx - 1].mrr : value;
      const change = prevValue > 0 ? ((value - prevValue) / prevValue) * 100 : 0;
      
      return (
        <div className="rounded-xl border bg-background/95 backdrop-blur-sm px-4 py-3 shadow-xl">
          <p className="text-xs text-muted-foreground capitalize font-medium mb-1">{label}</p>
          <p className="text-xl font-bold text-foreground">
            {formatCurrencyFull(value)}
          </p>
          <div className={cn(
            "flex items-center gap-1 text-xs mt-1",
            change >= 0 ? "text-emerald-500" : "text-red-500"
          )}>
            {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span>{change >= 0 ? "+" : ""}{change.toFixed(1)}% vs. mês anterior</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Receita Recorrente</CardTitle>
          </div>
          <Badge 
            variant={isPositive ? "healthy" : "danger"} 
            size="sm"
            className="gap-1"
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? "+" : ""}{variation.toFixed(1)}%
          </Badge>
        </div>
        <div className="mt-2">
          <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            {formatCurrency(currentMRR)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">MRR atual</p>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="mrrGradientNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#14b8a6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="mrrStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                dy={8}
              />
              <YAxis 
                hide
                domain={["dataMin - 5000", "dataMax + 5000"]}
              />
              <ReferenceLine 
                y={avgMRR} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="4 4" 
                strokeOpacity={0.3}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="url(#mrrStroke)"
                strokeWidth={3}
                fill="url(#mrrGradientNew)"
                dot={false}
                activeDot={{ 
                  r: 6, 
                  strokeWidth: 3, 
                  stroke: "#fff",
                  fill: "#10b981",
                  className: "drop-shadow-lg"
                }}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 pt-3 border-t grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="text-center px-2 py-1.5 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground font-medium">Média</p>
            <p className="text-sm font-bold">{formatCurrency(avgMRR)}</p>
          </div>
          <div className="text-center px-2 py-1.5 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground font-medium">Crescimento</p>
            <p className={cn(
              "text-sm font-bold",
              totalGrowth >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {totalGrowth >= 0 ? "+" : ""}{totalGrowth.toFixed(1)}%
            </p>
          </div>
          <div className="text-center px-2 py-1.5 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground font-medium">Período</p>
            <p className="text-sm font-bold">{data.length} meses</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
