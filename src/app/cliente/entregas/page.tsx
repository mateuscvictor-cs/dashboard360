"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Key,
  XCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationBell } from "@/components/notifications";

type Delivery = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  dueDate: string | null;
  assignee: string | null;
  pendingDependenciesCount: number;
  hasPendingDependencies: boolean;
  completion: {
    completedAt: string;
  } | null;
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; variant: "info-soft" | "success-soft" | "warning-soft" | "destructive" | "secondary" }> = {
  PENDING: { label: "Pendente", icon: Clock, variant: "secondary" },
  IN_PROGRESS: { label: "Em andamento", icon: Package, variant: "info-soft" },
  BLOCKED: { label: "Aguardando você", icon: XCircle, variant: "destructive" },
  COMPLETED: { label: "Concluída", icon: CheckCircle2, variant: "success-soft" },
  DELAYED: { label: "Atrasada", icon: AlertCircle, variant: "warning-soft" },
};

export default function EntregasPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const response = await fetch("/api/cliente/deliveries");
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data);
      }
    } catch (error) {
      console.error("Erro ao carregar entregas:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Não definido";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const inProgress = deliveries.filter(
    (d) => d.status === "IN_PROGRESS" || d.status === "BLOCKED" || d.status === "PENDING"
  );
  const completed = deliveries.filter((d) => d.status === "COMPLETED");
  const needsAction = deliveries.filter((d) => d.hasPendingDependencies);

  const getFilteredDeliveries = () => {
    switch (activeTab) {
      case "in-progress":
        return inProgress;
      case "needs-action":
        return needsAction;
      case "completed":
        return completed;
      default:
        return deliveries;
    }
  };

  const renderDeliveryCard = (delivery: Delivery) => {
    const status = statusConfig[delivery.status] || statusConfig.PENDING;
    const StatusIcon = status.icon;

    return (
      <Link href={`/cliente/entregas/${delivery.id}`} key={delivery.id}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${
                delivery.status === "COMPLETED" 
                  ? "bg-gradient-to-br from-emerald-500 to-green-500" 
                  : delivery.hasPendingDependencies 
                    ? "bg-gradient-to-br from-red-500 to-orange-500"
                    : "bg-gradient-to-br from-blue-500 to-cyan-500"
              }`}>
                {delivery.hasPendingDependencies ? (
                  <Key className="h-5 w-5 text-white" />
                ) : (
                  <StatusIcon className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-base">{delivery.title}</h3>
                    {delivery.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {delivery.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {delivery.hasPendingDependencies && (
                      <Badge variant="destructive" className="text-xs">
                        <Key className="h-3 w-3 mr-1" />
                        {delivery.pendingDependenciesCount} pendência{delivery.pendingDependenciesCount > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>

                {delivery.status !== "COMPLETED" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold">{delivery.progress}%</span>
                    </div>
                    <Progress
                      value={delivery.progress}
                      className="h-2"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {delivery.status === "COMPLETED" && delivery.completion ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Concluído em {formatDate(delivery.completion.completedAt)}
                      </span>
                    ) : (
                      <>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Prazo: {formatDate(delivery.dueDate)}
                        </span>
                        {delivery.assignee && (
                          <>
                            <span>•</span>
                            <span>Responsável: {delivery.assignee}</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Entregas</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Acompanhe o progresso de todas as entregas do seu projeto
              </p>
            </div>
            <NotificationBell />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Entregas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhe o progresso de todas as entregas do seu projeto
            </p>
          </div>
          <NotificationBell />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {needsAction.length > 0 && (
          <Card className="mb-6 border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">Ação necessária</p>
                    <p className="text-sm text-muted-foreground">
                      {needsAction.length} entrega{needsAction.length > 1 ? "s" : ""} aguardando informações suas
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("needs-action")}
                >
                  Ver pendências
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              Todas ({deliveries.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              Em Andamento ({inProgress.length})
            </TabsTrigger>
            <TabsTrigger value="needs-action" className="relative">
              Aguardando Você
              {needsAction.length > 0 && (
                <span className="ml-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {needsAction.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Concluídas ({completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {getFilteredDeliveries().length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {activeTab === "needs-action"
                    ? "Nenhuma entrega aguardando sua ação"
                    : activeTab === "completed"
                    ? "Nenhuma entrega concluída ainda"
                    : activeTab === "in-progress"
                    ? "Nenhuma entrega em andamento"
                    : "Nenhuma entrega encontrada"}
                </p>
              </Card>
            ) : (
              getFilteredDeliveries().map(renderDeliveryCard)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
