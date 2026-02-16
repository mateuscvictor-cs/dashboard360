"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  AlertTriangle,
  Building2,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ChecklistItem = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: string;
  date: string;
};

type Demand = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  company: { id: string; name: string } | null;
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  HIGH: { label: "Alta", color: "bg-red-500/10 text-red-500 border-red-500/30" },
  MEDIUM: { label: "Média", color: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  LOW: { label: "Baixa", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
};

export default function CSTarefasPage() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [checklistRes, meRes] = await Promise.all([
        fetch("/api/cs/me/checklist"),
        fetch("/api/cs/me"),
      ]);

      if (checklistRes.ok) {
        const data = await checklistRes.json();
        setChecklist(data);
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        setDemands(meData.assignedDemands || []);
      }
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    setToggling(id);
    try {
      const response = await fetch(`/api/checklist/${id}/toggle`, {
        method: "POST",
      });

      if (response.ok) {
        setChecklist(prev =>
          prev.map(item =>
            item.id === id ? { ...item, completed: !completed } : item
          )
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
    } finally {
      setToggling(null);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    setSaving(true);
    try {
      const response = await fetch("/api/cs/me/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description || null,
          priority: newTask.priority,
        }),
      });

      if (response.ok) {
        const item = await response.json();
        setChecklist(prev => [item, ...prev]);
        setShowAddModal(false);
        setNewTask({ title: "", description: "", priority: "MEDIUM" });
      }
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
    } finally {
      setSaving(false);
    }
  };

  const pendingTasks = checklist.filter(t => !t.completed);
  const completedTasks = checklist.filter(t => t.completed);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Minhas Tarefas" subtitle="Gerencie suas tarefas e demandas" showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Minhas Tarefas" subtitle="Gerencie suas tarefas e demandas" showFilters={false} />

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              {pendingTasks.length} pendentes
            </Badge>
            <Badge variant="outline" className="text-sm">
              {completedTasks.length} concluídas
            </Badge>
            {demands.length > 0 && (
              <Badge variant="default" className="text-sm">
                {demands.length} demandas
              </Badge>
            )}
          </div>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        {demands.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Demandas Atribuídas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {demands.map((demand) => (
                <Link
                  key={demand.id}
                  href={`/cs/demandas/${demand.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 transition-colors"
                >
                  <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{demand.title}</p>
                    {demand.company && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {demand.company.name}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={priorityConfig[demand.priority]?.color}>
                    {priorityConfig[demand.priority]?.label || demand.priority}
                  </Badge>
                  {demand.dueDate && (
                    <span className="text-sm text-muted-foreground">
                      {new Date(demand.dueDate).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tarefas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-center">
                  Nenhuma tarefa pendente. Bom trabalho!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <button
                      onClick={() => handleToggle(task.id, task.completed)}
                      disabled={toggling === task.id}
                      className="shrink-0"
                    >
                      {toggling === task.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={priorityConfig[task.priority]?.color}>
                      {priorityConfig[task.priority]?.label || task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {completedTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-muted-foreground">Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg border opacity-60"
                  >
                    <button
                      onClick={() => handleToggle(task.id, task.completed)}
                      disabled={toggling === task.id}
                      className="shrink-0"
                    >
                      {toggling === task.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-through">{task.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {checklist.length === 0 && demands.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Você ainda não tem tarefas. Crie sua primeira tarefa para começar a organizar seu dia.
              </p>
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeira Tarefa
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                placeholder="Ex: Fazer follow-up com cliente"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                placeholder="Detalhes da tarefa..."
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridade</label>
              <Select
                value={newTask.priority}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="LOW">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTask} disabled={saving || !newTask.title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
