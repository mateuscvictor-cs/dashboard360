"use client";

import { Sparkles, ThumbsUp, ThumbsDown, ChevronRight, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AIInsight, ConfidenceLevel } from "@/types";
import { cn } from "@/lib/utils";

interface AIInsightsProps {
  insights: AIInsight[];
}

const confidenceConfig: Record<ConfidenceLevel, { label: string; variant: "healthy-soft" | "attention-soft" | "risk-soft" }> = {
  high: { label: "Alta confiança", variant: "healthy-soft" },
  medium: { label: "Média", variant: "attention-soft" },
  low: { label: "Baixa", variant: "risk-soft" },
};

export function AIInsights({ insights }: AIInsightsProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow-md shadow-purple-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-purple-500" />
            </div>
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Inteligência IA</CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Powered by AI</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {insights.slice(0, 3).map((insight, index) => {
          const confidence = confidenceConfig[insight.confidence];

          return (
            <div
              key={insight.id}
              className={cn(
                "group rounded-xl border p-3 space-y-2 transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer",
                index === 0 && "border-primary/20 bg-primary/[0.02]"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug line-clamp-2">
                  {insight.insight}
                </p>
                <Badge variant={confidence.variant} size="sm" className="shrink-0">
                  {confidence.label}
                </Badge>
              </div>

              {insight.accountName && (
                <p className="text-xs text-muted-foreground font-medium">
                  → {insight.accountName}
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                    {insight.source}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground hover:text-health-healthy hover:bg-health-healthy-light">
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground hover:text-health-critical hover:bg-health-critical-light">
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        
        <Button variant="outline" size="sm" className="w-full group border-dashed">
          <Wand2 className="h-4 w-4 mr-2 text-purple-500" />
          Gerar mais insights
          <ChevronRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
