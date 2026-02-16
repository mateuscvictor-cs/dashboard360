"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, Reorder } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Users,
  ClipboardCheck,
  Video,
  Settings,
  CheckCircle2,
  Clock,
  Circle,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type OnboardingStepType = "GROUP_CREATION" | "DIAGNOSTIC_FORM" | "ONBOARDING_MEETING" | "CUSTOM";
type OnboardingStepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

interface OnboardingStep {
  id: string;
  type: OnboardingStepType;
  title: string;
  description: string | null;
  status: OnboardingStepStatus;
  order: number;
  completedAt: string | null;
  dueDate: string | null;
}

interface OnboardingProgress {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  percentage: number;
}

const stepIcons: Record<OnboardingStepType, typeof Users> = {
  GROUP_CREATION: Users,
  DIAGNOSTIC_FORM: ClipboardCheck,
  ONBOARDING_MEETING: Video,
  CUSTOM: Settings,
};

const stepTypeLabels: Record<OnboardingStepType, string> = {
  GROUP_CREATION: "Criação de Grupo",
  DIAGNOSTIC_FORM: "Formulário de Diagnóstico",
  ONBOARDING_MEETING: "Reunião de Onboarding",
  CUSTOM: "Personalizado",
};

const statusConfig: Record<OnboardingStepStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  COMPLETED: { label: "Concluído", color: "text-success bg-success/10 border-success/30", icon: CheckCircle2 },
  IN_PROGRESS: { label: "Em Andamento", color: "text-info bg-info/10 border-info/30", icon: Clock },
  PENDING: { label: "Pendente", color: "text-muted-foreground bg-muted border-muted-foreground/30", icon: Circle },
  SKIPPED: { label: "Pulado", color: "text-muted-foreground/50 bg-muted/50 border-muted-foreground/20", icon: Circle },
};

export default function CSOnboardingPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStep, setEditingStep] = useState<OnboardingStep | null>(null);
  const [deletingStep, setDeletingStep] = useState<OnboardingStep | null>(null);

  const [newStep, setNewStep] = useState({
    type: "CUSTOM" as OnboardingStepType,
    title: "",
    description: "",
    dueDate: "",
  });

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    try {
      const [onboardingRes, companyRes] = await Promise.all([
        fetch(`/api/cs/empresas/${companyId}/onboarding`),
        fetch(`/api/cs/empresas/${companyId}`),
      ]);

      if (onboardingRes.ok) {
        const data = await onboardingRes.json();
        setSteps(data.steps || []);
        setProgress(data.progress);
      }

      if (companyRes.ok) {
        const company = await companyRes.json();
        setCompanyName(company.name);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDefaults = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/cs/empresas/${companyId}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createDefaults: true }),
      });

      if (response.ok) {
        const data = await response.json();
        setSteps(data.steps || []);
        await fetchData();
      }
    } catch (error) {
      console.error("Erro ao criar etapas padrão:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = async () => {
    if (!newStep.title) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/cs/empresas/${companyId}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newStep.type,
          title: newStep.title,
          description: newStep.description || null,
          dueDate: newStep.dueDate || null,
        }),
      });

      if (response.ok) {
        await fetchData();
        setShowAddModal(false);
        setNewStep({ type: "CUSTOM", title: "", description: "", dueDate: "" });
      }
    } catch (error) {
      console.error("Erro ao adicionar etapa:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStep = async (stepId: string, data: Partial<OnboardingStep>) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/cs/empresas/${companyId}/onboarding/${stepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchData();
        setEditingStep(null);
      }
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStep = async () => {
    if (!deletingStep) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/cs/empresas/${companyId}/onboarding/${deletingStep.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchData();
        setDeletingStep(null);
      }
    } catch (error) {
      console.error("Erro ao remover etapa:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (newOrder: OnboardingStep[]) => {
    setSteps(newOrder);

    try {
      await fetch(`/api/cs/empresas/${companyId}/onboarding/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: newOrder.map((s) => s.id) }),
      });
    } catch (error) {
      console.error("Erro ao reordenar:", error);
      await fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Onboarding" subtitle="Carregando..." showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Configurar Onboarding"
        subtitle={companyName || "Empresa"}
        showFilters={false}
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link href={`/cs/empresas/${companyId}`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {steps.length === 0 && (
              <Button onClick={handleCreateDefaults} disabled={saving} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Criar Etapas Padrão
              </Button>
            )}
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Etapa
            </Button>
          </div>
        </div>

        {progress && steps.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Progresso do Onboarding</h3>
                  <p className="text-sm text-muted-foreground">
                    {progress.completed} de {progress.total} etapas concluídas
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-32 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.percentage}%` }}
                      className="h-full bg-gradient-to-r from-info to-success rounded-full"
                    />
                  </div>
                  <span className="text-lg font-bold">{progress.percentage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {steps.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma etapa configurada</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                Configure as etapas de onboarding para esta empresa. Você pode criar etapas
                personalizadas ou usar o modelo padrão.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleCreateDefaults} disabled={saving} variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Usar Modelo Padrão
                </Button>
                <Button onClick={() => setShowAddModal(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Manualmente
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Etapas do Onboarding</CardTitle>
              <CardDescription>Arraste para reordenar as etapas</CardDescription>
            </CardHeader>
            <CardContent>
              <Reorder.Group axis="y" values={steps} onReorder={handleReorder} className="space-y-3">
                {steps.map((step) => {
                  const Icon = stepIcons[step.type];
                  const status = statusConfig[step.status];
                  const StatusIcon = status.icon;

                  return (
                    <Reorder.Item
                      key={step.id}
                      value={step}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <motion.div
                        layout
                        className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="text-muted-foreground hover:text-foreground">
                          <GripVertical className="h-5 w-5" />
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold truncate">{step.title}</p>
                            <Badge variant="outline" className="text-xs">
                              {stepTypeLabels[step.type]}
                            </Badge>
                          </div>
                          {step.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {step.description}
                            </p>
                          )}
                          {step.dueDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Prazo: {new Date(step.dueDate).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={step.status}
                            onValueChange={(value) => handleUpdateStep(step.id, { status: value as OnboardingStepStatus })}
                          >
                            <SelectTrigger className={cn("w-[140px] h-9", status.color)}>
                              <div className="flex items-center gap-2">
                                <StatusIcon className="h-4 w-4" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pendente</SelectItem>
                              <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                              <SelectItem value="COMPLETED">Concluído</SelectItem>
                              <SelectItem value="SKIPPED">Pulado</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingStep(step)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingStep(step)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview da Timeline</CardTitle>
            <CardDescription>Como o cliente verá a timeline no dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {steps.map((step, index) => {
                const Icon = stepIcons[step.type];
                const isCompleted = step.status === "COMPLETED";
                const isInProgress = step.status === "IN_PROGRESS";

                return (
                  <div key={step.id} className="flex items-center flex-shrink-0">
                    <div
                      className={cn(
                        "flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg border-2 min-w-[100px]",
                        isCompleted && "bg-success/10 border-success",
                        isInProgress && "bg-info/10 border-info ring-2 ring-info/20",
                        !isCompleted && !isInProgress && "bg-muted border-muted-foreground/30"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center h-8 w-8 rounded-full",
                        isCompleted && "bg-success/10",
                        isInProgress && "bg-info/10",
                        !isCompleted && !isInProgress && "bg-muted"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          isCompleted && "text-success",
                          isInProgress && "text-info",
                          !isCompleted && !isInProgress && "text-muted-foreground"
                        )} />
                      </div>
                      <span className={cn(
                        "text-xs font-medium text-center leading-tight",
                        isCompleted && "text-success",
                        isInProgress && "text-info",
                        !isCompleted && !isInProgress && "text-muted-foreground"
                      )}>
                        {step.title}
                      </span>
                    </div>

                    {index < steps.length - 1 && (
                      <div className={cn(
                        "h-0.5 w-8 mx-1",
                        isCompleted ? "bg-success" : "bg-muted-foreground/30"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Etapa de Onboarding</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={newStep.type}
                onValueChange={(value) => setNewStep((prev) => ({
                  ...prev,
                  type: value as OnboardingStepType,
                  title: value !== "CUSTOM" ? stepTypeLabels[value as OnboardingStepType] : prev.title,
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GROUP_CREATION">Criação de Grupo</SelectItem>
                  <SelectItem value="DIAGNOSTIC_FORM">Formulário de Diagnóstico</SelectItem>
                  <SelectItem value="ONBOARDING_MEETING">Reunião de Onboarding</SelectItem>
                  <SelectItem value="CUSTOM">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input
                placeholder="Nome da etapa"
                value={newStep.title}
                onChange={(e) => setNewStep((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descreva a etapa..."
                value={newStep.description}
                onChange={(e) => setNewStep((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prazo</label>
              <Input
                type="date"
                value={newStep.dueDate}
                onChange={(e) => setNewStep((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddStep} disabled={saving || !newStep.title}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingStep} onOpenChange={() => setEditingStep(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Etapa</DialogTitle>
          </DialogHeader>
          {editingStep && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título *</label>
                <Input
                  value={editingStep.title}
                  onChange={(e) => setEditingStep((prev) => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={editingStep.description || ""}
                  onChange={(e) => setEditingStep((prev) => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prazo</label>
                <Input
                  type="date"
                  value={editingStep.dueDate?.split("T")[0] || ""}
                  onChange={(e) => setEditingStep((prev) => prev ? { ...prev, dueDate: e.target.value } : null)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStep(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => editingStep && handleUpdateStep(editingStep.id, {
                title: editingStep.title,
                description: editingStep.description,
                dueDate: editingStep.dueDate,
              })}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingStep} onOpenChange={() => setDeletingStep(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Etapa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a etapa &quot;{deletingStep?.title}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStep} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
