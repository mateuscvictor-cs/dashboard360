"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, CheckCircle2, Clock, TrendingUp, Building2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type CSMetric = {
  id: string;
  name: string;
  avatar: string | null;
  companiesCount: number;
  completedToday: number;
  pendingTasks: number;
  totalTasks: number;
  accountsAtRisk: number;
  weeklyCompletionRate: number;
  capacityUsed: number;
};

interface CSOwnerCardsProps {
  metrics: CSMetric[];
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-600",
];

function CapacityGauge({ value, size = 56 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  const getGradient = () => {
    if (value >= 90) return { start: "#ef4444", end: "#dc2626" };
    if (value >= 75) return { start: "#f97316", end: "#ea580c" };
    if (value >= 50) return { start: "#f59e0b", end: "#d97706" };
    return { start: "#10b981", end: "#059669" };
  };

  const gradient = getGradient();
  const gradientId = `gauge-gradient-${value}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" style={{ width: size, height: size }} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradient.start} />
            <stop offset="100%" stopColor={gradient.end} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 drop-shadow-sm"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold">{value}%</span>
        <span className="text-[8px] text-muted-foreground">carga</span>
      </div>
    </div>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const height = 24;
  const width = 60;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg className="h-6 w-[60px]" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sparkline-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#sparkline-fill-${color})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={color}
      />
    </svg>
  );
}

export function CSOwnerCards({ metrics }: CSOwnerCardsProps) {
  if (metrics.length === 0) {
    return null;
  }

  const totalCompanies = metrics.reduce((sum, m) => sum + m.companiesCount, 0);
  const totalAtRisk = metrics.reduce((sum, m) => sum + m.accountsAtRisk, 0);
  const avgCompletion = metrics.length > 0 
    ? Math.round(metrics.reduce((sum, m) => sum + m.weeklyCompletionRate, 0) / metrics.length)
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Performance do Time</CardTitle>
              <p className="text-xs text-muted-foreground">{metrics.length} CS Owners ativos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" size="sm" className="gap-1">
              <Building2 className="h-3 w-3" />
              {totalCompanies} empresas
            </Badge>
            {totalAtRisk > 0 && (
              <Badge variant="danger" size="sm" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {totalAtRisk} em risco
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((cs, index) => {
            const progressToday = cs.totalTasks > 0 
              ? Math.round((cs.completedToday / cs.totalTasks) * 100) 
              : 0;
            
            const weeklyData = [
              Math.max(0, cs.weeklyCompletionRate - 20 + Math.random() * 10),
              Math.max(0, cs.weeklyCompletionRate - 15 + Math.random() * 10),
              Math.max(0, cs.weeklyCompletionRate - 10 + Math.random() * 10),
              Math.max(0, cs.weeklyCompletionRate - 5 + Math.random() * 10),
              cs.weeklyCompletionRate,
            ];

            const gradientClass = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
            const sparklineColor = progressToday >= 75 ? "#10b981" : progressToday >= 50 ? "#f59e0b" : "#ef4444";
            const isTopPerformer = cs.weeklyCompletionRate >= 80;

            return (
              <div
                key={cs.id}
                className={cn(
                  "relative rounded-xl border bg-card p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                  isTopPerformer && "border-emerald-200 dark:border-emerald-500/30"
                )}
              >
                {isTopPerformer && (
                  <div className="absolute -top-2 -right-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
                      <Zap className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white text-sm font-bold shadow-md",
                      gradientClass
                    )}>
                      {cs.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold truncate max-w-[110px]">{cs.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">
                          {cs.companiesCount} {cs.companiesCount === 1 ? "empresa" : "empresas"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <CapacityGauge value={cs.capacityUsed} />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="font-medium">Progresso hoje</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{cs.completedToday}/{cs.totalTasks}</span>
                        <Badge 
                          variant={progressToday >= 75 ? "healthy" : progressToday >= 50 ? "attention" : "danger"}
                          size="sm"
                          className="text-[10px] h-5"
                        >
                          {progressToday}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          progressToday >= 75 ? "bg-gradient-to-r from-emerald-500 to-teal-500" :
                          progressToday >= 50 ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
                          "bg-gradient-to-r from-red-500 to-rose-500"
                        )}
                        style={{ width: `${progressToday}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      {cs.accountsAtRisk > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          <span className="text-[10px] font-semibold text-red-500">
                            {cs.accountsAtRisk}
                          </span>
                        </div>
                      )}
                      {cs.pendingTasks > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {cs.pendingTasks}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <MiniSparkline data={weeklyData} color={sparklineColor} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
          <div className="text-center px-3 py-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Empresas</p>
            <p className="text-xl font-bold">{totalCompanies}</p>
          </div>
          <div className="text-center px-3 py-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Em Risco</p>
            <p className={cn("text-xl font-bold", totalAtRisk > 0 ? "text-red-500" : "text-emerald-500")}>
              {totalAtRisk}
            </p>
          </div>
          <div className="text-center px-3 py-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Taxa Média</p>
            <p className={cn(
              "text-xl font-bold",
              avgCompletion >= 75 ? "text-emerald-500" : avgCompletion >= 50 ? "text-amber-500" : "text-red-500"
            )}>
              {avgCompletion}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
