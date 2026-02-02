"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface DataPoint {
  date: string;
  performanceScore: number;
  scoreExecution?: number;
  scorePortfolio?: number;
  scoreEngagement?: number;
  scoreSatisfaction?: number;
}

interface PerformanceChartProps {
  data: DataPoint[];
  showBreakdown?: boolean;
  height?: number;
}

const COLORS = {
  total: "#3b82f6",
  execution: "#10b981",
  portfolio: "#8b5cf6",
  engagement: "#f59e0b",
  satisfaction: "#ec4899",
};

export function PerformanceChart({ 
  data, 
  showBreakdown = false,
  height = 200 
}: PerformanceChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Evolução da Performance</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Sem dados para exibir
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = 100;
  const minValue = 0;
  const range = maxValue - minValue || 1;

  const getY = (value: number) => height - ((value - minValue) / range) * height;

  const width = 100;
  const stepX = width / (data.length - 1 || 1);

  const createPath = (values: number[]) => {
    return values.map((val, i) => {
      const x = i * stepX;
      const y = getY(val);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  const createAreaPath = (values: number[]) => {
    const linePath = values.map((val, i) => {
      const x = i * stepX;
      const y = getY(val);
      return `${x},${y}`;
    }).join(" ");
    return `M 0,${height} L ${linePath} L ${width},${height} Z`;
  };

  const totalValues = data.map(d => d.performanceScore);
  const latestScore = totalValues[totalValues.length - 1] || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Evolução da Performance</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{latestScore.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Score atual</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height }}>
          <svg
            className="w-full h-full"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.total} stopOpacity="0.3" />
                <stop offset="100%" stopColor={COLORS.total} stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 25, 50, 75, 100].map((tick) => (
              <line
                key={tick}
                x1="0"
                y1={getY(tick)}
                x2={width}
                y2={getY(tick)}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-muted/30"
                strokeDasharray="2,2"
              />
            ))}

            <path
              d={createAreaPath(totalValues)}
              fill="url(#areaGradient)"
            />

            <path
              d={createPath(totalValues)}
              fill="none"
              stroke={COLORS.total}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {showBreakdown && data[0]?.scoreExecution !== undefined && (
              <>
                <path
                  d={createPath(data.map(d => d.scoreExecution || 0))}
                  fill="none"
                  stroke={COLORS.execution}
                  strokeWidth="1"
                  strokeDasharray="4,2"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.7"
                />
                <path
                  d={createPath(data.map(d => d.scorePortfolio || 0))}
                  fill="none"
                  stroke={COLORS.portfolio}
                  strokeWidth="1"
                  strokeDasharray="4,2"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.7"
                />
              </>
            )}

            <circle
              cx={(data.length - 1) * stepX}
              cy={getY(latestScore)}
              r="4"
              fill={COLORS.total}
              className="drop-shadow-md"
            />
          </svg>

          <div className="absolute left-0 top-0 flex flex-col justify-between h-full text-[10px] text-muted-foreground -ml-6">
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: COLORS.total }} />
              <span className="text-xs text-muted-foreground">Score Total</span>
            </div>
            {showBreakdown && (
              <>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: COLORS.execution }} />
                  <span className="text-xs text-muted-foreground">Execução</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: COLORS.portfolio }} />
                  <span className="text-xs text-muted-foreground">Portfólio</span>
                </div>
              </>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            Últimos {data.length} dias
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
