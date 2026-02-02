"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

interface PerformanceCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "stable";
  trendValue?: number;
  format?: "number" | "percent" | "score";
  colorScheme?: "primary" | "success" | "warning" | "danger";
}

const colorSchemes = {
  primary: {
    gradient: "from-blue-500 to-cyan-600",
    shadow: "shadow-blue-500/25",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  success: {
    gradient: "from-emerald-500 to-teal-500",
    shadow: "shadow-emerald-500/25",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  warning: {
    gradient: "from-amber-500 to-orange-500",
    shadow: "shadow-amber-500/25",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  danger: {
    gradient: "from-red-500 to-rose-500",
    shadow: "shadow-red-500/25",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
  },
};

export function PerformanceCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  format = "number",
  colorScheme = "primary",
}: PerformanceCardProps) {
  const colors = colorSchemes[colorScheme];

  const formatValue = (val: number) => {
    switch (format) {
      case "percent":
        return `${val.toFixed(1)}%`;
      case "score":
        return val.toFixed(1);
      default:
        return val.toLocaleString();
    }
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg",
                colors.gradient,
                colors.shadow
              )}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">
                {formatValue(value)}
              </span>
              {trend && (
                <div className={cn("flex items-center gap-0.5", trendColor)}>
                  <TrendIcon className="h-4 w-4" />
                  {trendValue !== undefined && (
                    <span className="text-xs font-medium">
                      {trendValue > 0 ? "+" : ""}{trendValue.toFixed(1)}
                    </span>
                  )}
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
