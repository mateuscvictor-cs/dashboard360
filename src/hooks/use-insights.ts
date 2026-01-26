"use client";

import { useState, useEffect, useCallback } from "react";
import type { AIInsight, InsightScope } from "@/types";

type InsightStats = {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byScope: Record<string, number>;
};

type UseInsightsReturn = {
  insights: AIInsight[];
  stats: InsightStats | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  generate: (scope: InsightScope, targetId?: string) => Promise<AIInsight[]>;
  markAsRead: (id: string) => Promise<void>;
  markAsActioned: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  addFeedback: (id: string, feedback: "positive" | "negative") => Promise<void>;
  deleteInsight: (id: string) => Promise<void>;
};

export function useInsights(limit: number = 50): UseInsightsReturn {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [stats, setStats] = useState<InsightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/insights?limit=${limit}&includeStats=true`);

      if (!response.ok) {
        throw new Error("Erro ao carregar insights");
      }

      const data = await response.json();
      setInsights(data.insights || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const generate = useCallback(
    async (scope: InsightScope, targetId?: string): Promise<AIInsight[]> => {
      try {
        setGenerating(true);
        setError(null);

        const response = await fetch("/api/insights/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope, targetId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao gerar insights");
        }

        const newInsights = data.insights || [];

        if (newInsights.length > 0) {
          await fetchInsights();
        }

        return newInsights;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        throw err;
      } finally {
        setGenerating(false);
      }
    },
    [fetchInsights]
  );

  const updateInsightLocally = useCallback(
    (id: string, updates: Partial<AIInsight>) => {
      setInsights((prev) =>
        prev.map((insight) =>
          insight.id === id ? { ...insight, ...updates } : insight
        )
      );
    },
    []
  );

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/insights/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "read" }),
        });

        if (!response.ok) throw new Error("Erro ao marcar como lido");

        updateInsightLocally(id, { status: "read" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    },
    [updateInsightLocally]
  );

  const markAsActioned = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/insights/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "actioned" }),
        });

        if (!response.ok) throw new Error("Erro ao marcar como acionado");

        updateInsightLocally(id, { status: "actioned", actionTaken: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    },
    [updateInsightLocally]
  );

  const dismiss = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/insights/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "dismiss" }),
        });

        if (!response.ok) throw new Error("Erro ao dispensar");

        updateInsightLocally(id, { status: "dismissed" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    },
    [updateInsightLocally]
  );

  const addFeedback = useCallback(
    async (id: string, feedback: "positive" | "negative") => {
      try {
        const response = await fetch(`/api/insights/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback }),
        });

        if (!response.ok) throw new Error("Erro ao adicionar feedback");

        updateInsightLocally(id, { feedback });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    },
    [updateInsightLocally]
  );

  const deleteInsight = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/insights/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao deletar");

      setInsights((prev) => prev.filter((insight) => insight.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  }, []);

  useEffect(() => {
    if (initialized) return;
    setInitialized(true);
    fetchInsights();
  }, [initialized, fetchInsights]);

  return {
    insights,
    stats,
    loading,
    generating,
    error,
    refresh: fetchInsights,
    generate,
    markAsRead,
    markAsActioned,
    dismiss,
    addFeedback,
    deleteInsight,
  };
}
