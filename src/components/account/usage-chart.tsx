"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { UsageDataPoint } from "@/types";

interface UsageChartProps {
  data: UsageDataPoint[];
}

export function UsageChart({ data }: UsageChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Minus className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Dados de uso indisponíveis</p>
      </div>
    );
  }

  const chartData = data.map((point) => ({
    date: new Date(point.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    usuarios: point.activeUsers,
    sessoes: point.sessions,
  }));

  const firstValue = data[0]?.activeUsers || 0;
  const lastValue = data[data.length - 1]?.activeUsers || 0;
  const trend = lastValue > firstValue ? "up" : lastValue < firstValue ? "down" : "stable";
  const trendPercentage = firstValue > 0 ? Math.round(((lastValue - firstValue) / firstValue) * 100) : 0;

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-health-healthy" : trend === "down" ? "text-health-critical" : "text-muted-foreground";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-2xl font-bold">{lastValue}</p>
          <p className="text-sm text-muted-foreground">Usuários ativos</p>
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{trendPercentage}%</span>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="usuarios"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={false}
              name="Usuários"
            />
            <Line
              type="monotone"
              dataKey="sessoes"
              stroke="var(--color-info)"
              strokeWidth={2}
              dot={false}
              name="Sessões"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
