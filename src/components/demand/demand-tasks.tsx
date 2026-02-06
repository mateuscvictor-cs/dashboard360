"use client";

import { useState, useCallback, useEffect } from "react";
import { CheckCircle2, Circle, Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DemandTask {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: string;
  orderIndex: number;
}

interface DemandTasksProps {
  demandId: string;
}

export function DemandTasks({ demandId }: DemandTasksProps) {
  const [tasks, setTasks] = useState<DemandTask[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchTasks = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/demands/${demandId}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } finally {
      setFetching(false);
    }
  }, [demandId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAdd = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/demands/${demandId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.ok) {
        setNewTitle("");
        fetchTasks();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao criar tarefa");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (taskId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/demands/${demandId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      if (res.ok) fetchTasks();
    } catch {
      alert("Erro ao atualizar tarefa");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Excluir esta tarefa?")) return;
    try {
      const res = await fetch(`/api/demands/${demandId}/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchTasks();
    } catch {
      alert("Erro ao excluir tarefa");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="font-medium">Tarefas da demanda</span>
        <span className="text-sm text-muted-foreground">
          ({tasks.filter((t) => t.completed).length}/{tasks.length} concluídas)
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Nova tarefa..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={loading || !newTitle.trim()} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {fetching ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Nenhuma tarefa ainda.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div
              key={t.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                t.completed && "opacity-60 bg-muted/30"
              )}
            >
              <button
                onClick={() => handleToggle(t.id, t.completed)}
                className="shrink-0"
              >
                {t.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    t.completed && "line-through text-muted-foreground"
                  )}
                >
                  {t.title}
                </p>
                {t.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(t.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
