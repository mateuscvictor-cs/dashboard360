"use client";

import { useParams, notFound } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  AlertCircle,
  FileText,
  Send,
  TrendingUp,
  Target,
  Building2,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

type CSOwner = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: string;
  weeklyCompletion: number;
  avgResponseTime: number;
  npsScore: number;
  accountsAtRisk: number;
  companies: { id: string; name: string }[];
};

type Demand = {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  dueDate?: string;
  company?: { id: string; name: string };
};

type ChecklistItem = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: string;
};

type Company = {
  id: string;
  name: string;
};

export default function CSProfilePage() {
  const params = useParams();
  const csId = params.id as string;
  
  const [csOwner, setCsOwner] = useState<CSOwner | null>(null);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newDemand, setNewDemand] = useState({
    title: "",
    description: "",
    type: "REQUEST",
    priority: "MEDIUM",
    dueDate: "",
    companyId: "",
  });
  
  const [newChecklist, setNewChecklist] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
  });

  useEffect(() => {
    loadData();
  }, [csId]);

  async function loadData() {
    setLoading(true);
    try {
      const [csRes, demandsRes, checklistRes, companiesRes] = await Promise.all([
        fetch(`/api/cs-owners/${csId}`),
        fetch(`/api/cs-owners/${csId}/demands`),
        fetch(`/api/cs-owners/${csId}/checklist`),
        fetch(`/api/companies`),
      ]);
      
      if (csRes.ok) setCsOwner(await csRes.json());
      if (demandsRes.ok) setDemands(await demandsRes.json());
      if (checklistRes.ok) setChecklist(await checklistRes.json());
      if (companiesRes.ok) setCompanies(await companiesRes.json());
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setLoading(false);
  }

  async function handleCreateDemand() {
    if (!newDemand.title.trim()) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/cs-owners/${csId}/demands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDemand,
          companyId: newDemand.companyId || undefined,
          dueDate: newDemand.dueDate || undefined,
        }),
      });
      
      if (res.ok) {
        const demand = await res.json();
        setDemands(prev => [demand, ...prev]);
        setShowDemandModal(false);
        setNewDemand({
          title: "",
          description: "",
          type: "REQUEST",
          priority: "MEDIUM",
          dueDate: "",
          companyId: "",
        });
      }
    } catch (error) {
      console.error("Erro ao criar demanda:", error);
    }
    setSaving(false);
  }

  async function handleCreateChecklist() {
    if (!newChecklist.title.trim()) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/cs-owners/${csId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChecklist),
      });
      
      if (res.ok) {
        const item = await res.json();
        setChecklist(prev => [item, ...prev]);
        setShowChecklistModal(false);
        setNewChecklist({ title: "", description: "", priority: "MEDIUM" });
      }
    } catch (error) {
      console.error("Erro ao criar checklist:", error);
    }
    setSaving(false);
  }

  async function toggleChecklistItem(id: string) {
    try {
      const res = await fetch(`/api/checklist/${id}/toggle`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setChecklist(prev => prev.map(item => item.id === id ? updated : item));
      }
    } catch (error) {
      console.error("Erro ao atualizar checklist:", error);
    }
  }

  async function deleteChecklist(id: string) {
    try {
      const res = await fetch(`/api/checklist/${id}`, { method: "DELETE" });
      if (res.ok) {
        setChecklist(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error("Erro ao deletar checklist:", error);
    }
  }

  async function deleteDemand(id: string) {
    try {
      const res = await fetch(`/api/demands/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDemands(prev => prev.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error("Erro ao deletar demanda:", error);
    }
  }

  async function markDemandCompleted(id: string) {
    try {
      const res = await fetch(`/api/demands/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDemands(prev => prev.map(d => d.id === id ? updated : d));
      }
    } catch (error) {
      console.error("Erro ao completar demanda:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Carregando..." showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!csOwner) {
    notFound();
  }

  const completedTasks = checklist.filter(item => item.completed).length;
  const totalTasks = checklist.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const openDemands = demands.filter(d => d.status !== "COMPLETED" && d.status !== "CANCELLED").length;

  return (
    <div className="flex flex-col h-full">
      <Header 
        title={csOwner.name} 
        subtitle={csOwner.role}
        showFilters={false}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Link href="/admin/operacao" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Operação
        </Link>

        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-2xl font-bold shadow-lg">
              {csOwner.avatar}
            </div>
            <div className={cn(
              "absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background",
              csOwner.status === "ONLINE" && "bg-success",
              csOwner.status === "BUSY" && "bg-warning",
              csOwner.status === "OFFLINE" && "bg-muted-foreground"
            )} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{csOwner.name}</h1>
              <Badge variant={csOwner.status === "ONLINE" ? "success" : csOwner.status === "BUSY" ? "warning" : "secondary"}>
                {csOwner.status === "ONLINE" ? "Online" : csOwner.status === "BUSY" ? "Ocupado" : "Offline"}
              </Badge>
            </div>
            <p className="text-muted-foreground mb-2">{csOwner.role}</p>
            <p className="text-sm text-muted-foreground">{csOwner.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowChecklistModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Checklist
            </Button>
            <Button onClick={() => setShowDemandModal(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Demanda
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            label="Progresso do Dia"
            value={progressPercentage}
            suffix="%"
            icon={Target}
            gradient="from-emerald-500 to-teal-500"
          />
          <MetricCard
            label="Contas"
            value={csOwner.companies?.length || 0}
            suffix={csOwner.accountsAtRisk > 0 ? ` (${csOwner.accountsAtRisk} em risco)` : ""}
            icon={Building2}
            gradient="from-blue-500 to-cyan-500"
          />
          <MetricCard
            label="Demandas Abertas"
            value={openDemands}
            icon={Clock}
            gradient="from-orange-500 to-amber-500"
            alert={openDemands > 5}
          />
          <MetricCard
            label="Checklist"
            value={`${completedTasks}/${totalTasks}`}
            icon={CheckCircle2}
            gradient="from-green-500 to-emerald-500"
          />
          <MetricCard
            label="NPS Score"
            value={csOwner.npsScore}
            icon={TrendingUp}
            gradient="from-violet-500 to-purple-500"
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{csOwner.weeklyCompletion}%</p>
              <p className="text-xs text-muted-foreground">Conclusão Semanal</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{csOwner.avgResponseTime}min</p>
              <p className="text-xs text-muted-foreground">Tempo Médio Resposta</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{demands.length}</p>
              <p className="text-xs text-muted-foreground">Total Demandas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{csOwner.accountsAtRisk}</p>
              <p className="text-xs text-muted-foreground">Contas em Risco</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="checklist">Checklist ({checklist.length})</TabsTrigger>
            <TabsTrigger value="demands">Demandas ({demands.length})</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Checklist</CardTitle>
                          <CardDescription>{completedTasks} de {totalTasks} tarefas</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowChecklistModal(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {checklist.slice(0, 5).map((item) => (
                        <ChecklistRow 
                          key={item.id} 
                          item={item} 
                          onToggle={() => toggleChecklistItem(item.id)}
                        />
                      ))}
                      {checklist.length > 5 && (
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("checklist")}>
                          Ver todos ({checklist.length})
                        </Button>
                      )}
                      {checklist.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum item no checklist</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Demandas Recentes</CardTitle>
                          <CardDescription>{openDemands} abertas</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowDemandModal(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {demands.slice(0, 5).map((demand) => (
                        <DemandRow key={demand.id} demand={demand} />
                      ))}
                      {demands.length > 5 && (
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("demands")}>
                          Ver todas ({demands.length})
                        </Button>
                      )}
                      {demands.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma demanda</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="checklist" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Checklist Completo</CardTitle>
                        <CardDescription>{completedTasks} de {totalTasks} tarefas concluídas</CardDescription>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Progress value={progressPercentage} className="w-32 h-2" />
                          <span className="font-semibold">{progressPercentage}%</span>
                        </div>
                        <Button onClick={() => setShowChecklistModal(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Item
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className="flex-1">
                          <ChecklistRow 
                            item={item} 
                            onToggle={() => toggleChecklistItem(item.id)}
                            showDescription
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-danger"
                          onClick={() => deleteChecklist(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {checklist.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhum item no checklist</p>
                        <Button variant="outline" className="mt-4" onClick={() => setShowChecklistModal(true)}>
                          Criar primeiro item
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="demands" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Demandas Atribuídas</CardTitle>
                        <CardDescription>{demands.length} demandas ({openDemands} abertas)</CardDescription>
                      </div>
                      <Button onClick={() => setShowDemandModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Demanda
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {demands.map((demand) => (
                      <DemandCard 
                        key={demand.id} 
                        demand={demand}
                        onComplete={() => markDemandCompleted(demand.id)}
                        onDelete={() => deleteDemand(demand.id)}
                      />
                    ))}
                    {demands.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhuma demanda atribuída</p>
                        <Button variant="outline" className="mt-4" onClick={() => setShowDemandModal(true)}>
                          Criar primeira demanda
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>

      <Dialog open={showChecklistModal} onOpenChange={setShowChecklistModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Item de Checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <input
                type="text"
                value={newChecklist.title}
                onChange={(e) => setNewChecklist(prev => ({ ...prev, title: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border bg-background"
                placeholder="Ex: Ligar para cliente X"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <textarea
                value={newChecklist.description}
                onChange={(e) => setNewChecklist(prev => ({ ...prev, description: e.target.value }))}
                className="w-full h-20 px-3 py-2 rounded-lg border bg-background resize-none"
                placeholder="Detalhes adicionais..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridade</label>
              <Select
                value={newChecklist.priority}
                onValueChange={(value) => setNewChecklist(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="LOW">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChecklistModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateChecklist} disabled={saving || !newChecklist.title.trim()}>
              {saving ? "Salvando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDemandModal} onOpenChange={setShowDemandModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Demanda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <input
                type="text"
                value={newDemand.title}
                onChange={(e) => setNewDemand(prev => ({ ...prev, title: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border bg-background"
                placeholder="Ex: Atualizar documentação"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                value={newDemand.description}
                onChange={(e) => setNewDemand(prev => ({ ...prev, description: e.target.value }))}
                className="w-full h-20 px-3 py-2 rounded-lg border bg-background resize-none"
                placeholder="Detalhes da demanda..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={newDemand.type}
                  onValueChange={(value) => setNewDemand(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REQUEST">Solicitação</SelectItem>
                    <SelectItem value="SUPPORT">Suporte</SelectItem>
                    <SelectItem value="ESCALATION">Escalação</SelectItem>
                    <SelectItem value="INTERNAL">Interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <Select
                  value={newDemand.priority}
                  onValueChange={(value) => setNewDemand(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="LOW">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Empresa (opcional)</label>
                <Select
                  value={newDemand.companyId}
                  onValueChange={(value) => setNewDemand(prev => ({ ...prev, companyId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prazo (opcional)</label>
                <input
                  type="date"
                  value={newDemand.dueDate}
                  onChange={(e) => setNewDemand(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border bg-background"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDemandModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateDemand} disabled={saving || !newDemand.title.trim()}>
              {saving ? "Salvando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  icon: Icon,
  gradient,
  alert,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  alert?: boolean;
}) {
  return (
    <Card className={alert ? "border-danger/30" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm", gradient)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          {alert && <AlertCircle className="h-4 w-4 text-danger" />}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{value}</span>
          {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function ChecklistRow({ 
  item, 
  onToggle,
  showDescription = false,
}: { 
  item: ChecklistItem;
  onToggle: () => void;
  showDescription?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm",
        item.completed ? "bg-muted/50 opacity-60" : "bg-background"
      )}
      onClick={onToggle}
    >
      {item.completed ? (
        <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
      ) : (
        <Circle className={cn(
          "h-5 w-5 shrink-0 mt-0.5",
          item.priority === "URGENT" && "text-danger",
          item.priority === "HIGH" && "text-warning",
          item.priority === "MEDIUM" && "text-primary",
          item.priority === "LOW" && "text-muted-foreground"
        )} />
      )}
      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-sm font-medium",
          item.completed && "line-through text-muted-foreground"
        )}>
          {item.title}
        </span>
        {showDescription && item.description && (
          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
        )}
      </div>
      <Badge
        variant={
          item.priority === "URGENT" ? "danger" :
          item.priority === "HIGH" ? "warning" : 
          "secondary"
        }
        size="sm"
      >
        {item.priority === "URGENT" ? "Urgente" : 
         item.priority === "HIGH" ? "Alta" : 
         item.priority === "MEDIUM" ? "Média" : "Baixa"}
      </Badge>
    </div>
  );
}

function DemandRow({ demand }: { demand: Demand }) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      demand.status === "COMPLETED" && "opacity-60",
      demand.priority === "URGENT" && demand.status !== "COMPLETED" && "border-danger/30"
    )}>
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg",
        demand.type === "ESCALATION" && "bg-danger/10 text-danger",
        demand.type === "SUPPORT" && "bg-blue-100 text-blue-600",
        demand.type === "REQUEST" && "bg-purple-100 text-purple-600",
        demand.type === "INTERNAL" && "bg-slate-100 text-slate-600"
      )}>
        {demand.type === "ESCALATION" && <AlertCircle className="h-4 w-4" />}
        {demand.type === "SUPPORT" && <MessageSquare className="h-4 w-4" />}
        {demand.type === "REQUEST" && <FileText className="h-4 w-4" />}
        {demand.type === "INTERNAL" && <Target className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm truncate", demand.status === "COMPLETED" && "line-through")}>
          {demand.title}
        </p>
        {demand.company && (
          <p className="text-xs text-muted-foreground">{demand.company.name}</p>
        )}
      </div>
      <Badge
        variant={
          demand.status === "COMPLETED" ? "success" :
          demand.priority === "URGENT" ? "danger" :
          demand.priority === "HIGH" ? "warning" :
          "secondary"
        }
        size="sm"
      >
        {demand.status === "COMPLETED" ? "Concluída" :
         demand.priority === "URGENT" ? "Urgente" :
         demand.priority === "HIGH" ? "Alta" : "Normal"}
      </Badge>
    </div>
  );
}

function DemandCard({ 
  demand, 
  onComplete, 
  onDelete 
}: { 
  demand: Demand;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const isCompleted = demand.status === "COMPLETED";
  
  return (
    <div className={cn(
      "rounded-xl border p-4",
      isCompleted && "opacity-60",
      demand.priority === "URGENT" && !isCompleted && "border-danger/30 bg-danger/5"
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            demand.type === "ESCALATION" && "bg-danger/10 text-danger",
            demand.type === "SUPPORT" && "bg-blue-100 text-blue-600",
            demand.type === "REQUEST" && "bg-purple-100 text-purple-600",
            demand.type === "INTERNAL" && "bg-slate-100 text-slate-600"
          )}>
            {demand.type === "ESCALATION" && <AlertCircle className="h-5 w-5" />}
            {demand.type === "SUPPORT" && <MessageSquare className="h-5 w-5" />}
            {demand.type === "REQUEST" && <FileText className="h-5 w-5" />}
            {demand.type === "INTERNAL" && <Target className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className={cn("font-semibold", isCompleted && "line-through")}>{demand.title}</p>
              <Badge
                variant={
                  isCompleted ? "success" :
                  demand.priority === "URGENT" ? "danger" :
                  demand.priority === "HIGH" ? "warning" :
                  "secondary"
                }
                size="sm"
              >
                {isCompleted ? "Concluída" :
                 demand.priority === "URGENT" ? "Urgente" :
                 demand.priority === "HIGH" ? "Alta" :
                 demand.priority === "MEDIUM" ? "Média" : "Baixa"}
              </Badge>
            </div>
            {demand.description && (
              <p className="text-sm text-muted-foreground">{demand.description}</p>
            )}
            {demand.company && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {demand.company.name}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-danger" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        <span className="text-xs text-muted-foreground">
          {demand.dueDate ? `Prazo: ${formatDate(demand.dueDate)}` : "Sem prazo definido"}
        </span>
        {!isCompleted && (
          <Button variant="outline" size="sm" onClick={onComplete}>
            Marcar concluída
          </Button>
        )}
      </div>
    </div>
  );
}
