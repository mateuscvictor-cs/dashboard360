"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Briefcase,
  Building2,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  Wrench,
  Target,
  MessageSquare,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import type { TaskDetail, SystemsData, PriorityData } from "@/services/diagnostic.service";

interface DiagnosticResponse {
  id: string;
  fullName: string;
  position: string;
  area: string;
  email: string | null;
  timeInCompany: string;
  directlyInvolved: string;
  directManager: string | null;
  completedAt: string | null;
  taskDetails: unknown;
  systemsData: unknown;
  priorityData: unknown;
  topFiveTasks: string[];
  topTwoTimeTasks: string[];
  copyPasteTask: string | null;
  reworkArea: string | null;
  humanErrorArea: string | null;
  dependencyArea: string | null;
  frustration: string | null;
  user: { id: string; name: string | null; email: string } | null;
}

interface DiagnosticResponseViewProps {
  response: DiagnosticResponse;
  companyName: string;
  onBack: () => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  diaria: "Diária",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  "sob-demanda": "Sob demanda",
};

const TIME_LABELS: Record<string, string> = {
  "ate-5m": "Até 5 min",
  "5-15m": "5-15 min",
  "15-30m": "15-30 min",
  "30-60m": "30-60 min",
  "1-2h": "1-2 horas",
  "2h+": "Mais de 2h",
};

const PROBLEM_LABELS: Record<string, string> = {
  demora: "Demora",
  erros: "Erros frequentes",
  retrabalho: "Retrabalho",
  "falta-clareza": "Falta de clareza",
  "falta-dados": "Falta de dados",
  dependencia: "Dependência externa",
  outro: "Outro",
};

const GAIN_LABELS: Record<string, string> = {
  tempo: "Economia de tempo",
  "reduzir-erros": "Reduzir erros",
  "reduzir-retrabalho": "Reduzir retrabalho",
  velocidade: "Mais velocidade",
  qualidade: "Mais qualidade",
  outro: "Outro",
};

const YES_NO_LABELS: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  sim: { label: "Sim", icon: CheckCircle2, color: "text-green-500" },
  nao: { label: "Não", icon: XCircle, color: "text-red-500" },
  "nao-sei": { label: "Não sei", icon: HelpCircle, color: "text-yellow-500" },
  "as-vezes": { label: "Às vezes", icon: HelpCircle, color: "text-yellow-500" },
  parcial: { label: "Parcialmente", icon: HelpCircle, color: "text-yellow-500" },
};

function YesNoIndicator({ value }: { value: string }) {
  const config = YES_NO_LABELS[value] || { label: value, icon: HelpCircle, color: "text-muted-foreground" };
  const Icon = config.icon;
  return (
    <span className={`flex items-center gap-1 ${config.color}`}>
      <Icon className="h-4 w-4" />
      {config.label}
    </span>
  );
}

export function DiagnosticResponseView({ response, companyName, onBack }: DiagnosticResponseViewProps) {
  const [expandedTask, setExpandedTask] = useState<number | null>(0);

  const tasks = (response.taskDetails as TaskDetail[]) || [];
  const systems = (response.systemsData as SystemsData) || {};
  const priority = (response.priorityData as PriorityData) || {};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{response.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            Resposta do diagnóstico - {companyName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Identificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Nome</p>
              <p className="font-medium">{response.fullName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Cargo</p>
              <p className="font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                {response.position}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Área</p>
              <p className="font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {response.area}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tempo na empresa</p>
              <p className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {response.timeInCompany}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{response.user?.email || response.email || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Gestor direto</p>
              <p className="font-medium">{response.directManager || "-"}</p>
            </div>
            {response.completedAt && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Respondido em</p>
                <p className="font-medium">{formatDate(response.completedAt)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCw className="h-4 w-4" />
            Rotina e Tarefas
          </CardTitle>
          <CardDescription>
            Principais atividades e tarefas que mais consomem tempo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {response.topFiveTasks.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">5 Principais Tarefas do Dia a Dia</p>
              <div className="flex flex-wrap gap-2">
                {response.topFiveTasks.map((task, i) => (
                  <Badge key={i} variant="secondary">{task}</Badge>
                ))}
              </div>
            </div>
          )}

          {response.topTwoTimeTasks.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">2 Tarefas que Mais Consomem Tempo</p>
              <div className="flex flex-wrap gap-2">
                {response.topTwoTimeTasks.map((task, i) => (
                  <Badge key={i} variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                    {task}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {response.copyPasteTask && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Tarefa de Copiar/Colar</p>
                <p className="text-sm">{response.copyPasteTask}</p>
              </div>
            )}
            {response.reworkArea && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Área com Retrabalho</p>
                <p className="text-sm">{response.reworkArea}</p>
              </div>
            )}
            {response.humanErrorArea && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Área com Erros Humanos</p>
                <p className="text-sm">{response.humanErrorArea}</p>
              </div>
            )}
            {response.dependencyArea && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Área com Dependência Externa</p>
                <p className="text-sm">{response.dependencyArea}</p>
              </div>
            )}
          </div>

          {response.frustration && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-xs text-orange-600 mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Principal Frustração
              </p>
              <p className="text-sm">{response.frustration}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhamento das Tarefas ({tasks.length})</CardTitle>
            <CardDescription>
              Análise detalhada de cada tarefa mapeada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedTask(expandedTask === index ? null : index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{task.taskName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{FREQUENCY_LABELS[task.frequency] || task.frequency}</span>
                        <span>·</span>
                        <span>{TIME_LABELS[task.timePerExecution] || task.timePerExecution}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {PROBLEM_LABELS[task.mainProblem] || task.mainProblem}
                    </Badge>
                    {expandedTask === index ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedTask === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4 border-t pt-4 bg-muted/30">
                        {task.stepByStep && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Passo a Passo</p>
                            <p className="text-sm whitespace-pre-wrap">{task.stepByStep}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Frequência</p>
                            <p className="text-sm font-medium">{FREQUENCY_LABELS[task.frequency] || task.frequency}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Tempo por Execução</p>
                            <p className="text-sm font-medium">{TIME_LABELS[task.timePerExecution] || task.timePerExecution}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Pessoas Fazendo</p>
                            <p className="text-sm font-medium">{task.peopleDoingSame}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Economia Estimada/Semana</p>
                            <p className="text-sm font-medium">{task.timeSavedPerWeek || "-"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Onde Começa</p>
                            <p className="text-sm">{task.whereStarts}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Onde Termina</p>
                            <p className="text-sm">{task.whereEnds}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Padrão Claro?</p>
                            <YesNoIndicator value={task.hasClearPattern} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Tem Dono do Processo?</p>
                            <YesNoIndicator value={task.hasProcessOwner} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Outra Pessoa Continuaria?</p>
                            <YesNoIndicator value={task.canContinueIfOtherPerson} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-red-500/10 rounded-lg">
                            <p className="text-xs text-red-600 mb-1">Principal Problema</p>
                            <p className="text-sm font-medium">{PROBLEM_LABELS[task.mainProblem] || task.mainProblem}</p>
                          </div>
                          <div className="p-3 bg-green-500/10 rounded-lg">
                            <p className="text-xs text-green-600 mb-1">Ganho se Melhorar</p>
                            <p className="text-sm font-medium">{GAIN_LABELS[task.mainGainIfImproved] || task.mainGainIfImproved}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4" />
            Sistemas e Ferramentas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {systems.dailyTools && systems.dailyTools.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Ferramentas Usadas Diariamente</p>
              <div className="flex flex-wrap gap-2">
                {systems.dailyTools.map((tool, i) => (
                  <Badge key={i} variant="secondary">{tool}</Badge>
                ))}
              </div>
            </div>
          )}

          {systems.indispensableSystems && systems.indispensableSystems.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Sistemas Indispensáveis</p>
              <div className="flex flex-wrap gap-2">
                {systems.indispensableSystems.map((sys, i) => (
                  <Badge key={i} variant="outline">{sys}</Badge>
                ))}
              </div>
            </div>
          )}

          {systems.mainDataLocation && systems.mainDataLocation.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Onde Ficam os Dados Principais</p>
              <div className="flex flex-wrap gap-2">
                {systems.mainDataLocation.map((loc, i) => (
                  <Badge key={i} variant="outline">{loc}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Possui Integrações?</p>
              <YesNoIndicator value={systems.hasIntegration || "nao-sei"} />
              {systems.integrationDetails && (
                <p className="text-sm mt-2">{systems.integrationDetails}</p>
              )}
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">TI Bloqueia Acessos?</p>
              <YesNoIndicator value={systems.itBlocksAccess || "nao-sei"} />
              {systems.itBlocksDetails && (
                <p className="text-sm mt-2">{systems.itBlocksDetails}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            Prioridades e Observações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {priority.taskToEliminate && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-xs text-primary mb-1 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Tarefa que Gostaria de Eliminar
              </p>
              <p className="text-sm font-medium">{priority.taskToEliminate}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Disposto a Testar Soluções?</p>
              <YesNoIndicator value={priority.willingToTest || "nao-sei"} />
            </div>
            {priority.bestTimeForTest && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Melhor Horário para Testes</p>
                <p className="text-sm">{priority.bestTimeForTest}</p>
              </div>
            )}
          </div>

          {priority.finalObservation && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Observações Finais
              </p>
              <p className="text-sm whitespace-pre-wrap">{priority.finalObservation}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
