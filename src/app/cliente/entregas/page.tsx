"use client";

import { useState } from "react";
import { Package, Calendar, CheckCircle2, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const mockDeliveries = {
  inProgress: [
    {
      id: "d1",
      title: "Integração com ERP",
      description: "Conectando sistema interno com plataforma Vanguardia",
      status: "in_progress",
      progress: 60,
      dueDate: "2026-01-25",
      assignee: "Squad Alpha",
    },
    {
      id: "d2",
      title: "Módulo de Relatórios Avançados",
      description: "Dashboard customizado com métricas do negócio",
      status: "in_progress",
      progress: 45,
      dueDate: "2026-02-10",
      assignee: "Squad Beta",
    },
  ],
  upcoming: [
    {
      id: "u1",
      title: "Treinamento da Equipe",
      scheduledDate: "2026-02-15",
      duration: "4 horas",
      type: "training",
    },
    {
      id: "u2",
      title: "Go-Live Fase 1",
      scheduledDate: "2026-02-28",
      type: "milestone",
    },
  ],
  completed: [
    {
      id: "c1",
      title: "Setup Inicial",
      completedDate: "2025-12-10",
    },
    {
      id: "c2",
      title: "Migração de Dados Históricos",
      completedDate: "2025-12-28",
    },
  ],
};

export default function EntregasPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold">Entregas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe o progresso de todas as entregas do seu projeto
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="in-progress" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="in-progress">Em Andamento</TabsTrigger>
            <TabsTrigger value="upcoming">Próximas</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
          </TabsList>

          <TabsContent value="in-progress" className="space-y-4">
            {mockDeliveries.inProgress.map((delivery) => (
              <Card key={delivery.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-base">{delivery.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{delivery.description}</p>
                        </div>
                        <Badge variant="info-soft">Em andamento</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-semibold">{delivery.progress}%</span>
                        </div>
                        <Progress
                          value={delivery.progress}
                          className="h-2"
                          indicatorClassName="bg-gradient-to-r from-blue-500 to-cyan-500"
                        />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Prazo: {formatDate(delivery.dueDate)}
                        </span>
                        <span>•</span>
                        <span>Responsável: {delivery.assignee}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {mockDeliveries.upcoming.map((delivery) => (
              <Card key={delivery.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{delivery.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(delivery.scheduledDate)}
                        {delivery.duration && (
                          <>
                            <span>•</span>
                            <span>{delivery.duration}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" size="sm">
                      {delivery.type === "training" ? "Treinamento" : "Marco"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {mockDeliveries.completed.map((delivery) => (
              <Card key={delivery.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{delivery.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Concluído em {formatDate(delivery.completedDate)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
