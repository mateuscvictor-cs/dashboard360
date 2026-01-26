"use client";

import { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Target,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AIInsight, ConfidenceLevel } from "@/types";
import { cn } from "@/lib/utils";

interface AIRecommendationsProps {
  insights: AIInsight[];
}

const confidenceConfig: Record<ConfidenceLevel, { label: string; color: string }> = {
  high: { label: "Alta confiança", color: "bg-health-healthy/10 text-health-healthy" },
  medium: { label: "Média confiança", color: "bg-health-attention/10 text-health-attention" },
  low: { label: "Baixa confiança", color: "bg-health-risk/10 text-health-risk" },
};

export function AIRecommendations({ insights }: AIRecommendationsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-info" />
            <CardTitle className="text-base font-medium">Recomendações IA</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhuma recomendação disponível no momento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-info" />
          <CardTitle className="text-base font-medium">Recomendações IA</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => {
          const confidence = confidenceConfig[insight.confidence];
          const isExpanded = expandedId === insight.id;

          return (
            <div
              key={insight.id}
              className="rounded-lg border overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium">{insight.actionSuggested}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.insight}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={cn("text-xs", confidence.color)}>
                      {confidence.label}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t p-4 space-y-4 bg-muted/30">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Evidências
                    </p>
                    <ul className="space-y-1">
                      {insight.evidence.map((ev, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          {ev}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-background border">
                      <div className="flex items-center gap-2 text-health-healthy mb-1">
                        <Target className="h-4 w-4" />
                        <span className="text-xs font-medium">Resultado esperado</span>
                      </div>
                      <p className="text-sm">{insight.expectedOutcome}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-background border">
                      <div className="flex items-center gap-2 text-health-critical mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-medium">Risco se ignorar</span>
                      </div>
                      <p className="text-sm">{insight.riskIfIgnored}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-background border">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-medium">Fonte</span>
                      </div>
                      <p className="text-sm">{insight.source}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Essa recomendação foi útil?</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Button size="sm">Executar ação</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
