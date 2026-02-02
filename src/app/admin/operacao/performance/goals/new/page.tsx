"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Target,
  Users,
  User,
  Calendar,
  Save,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CSOwner = {
  id: string;
  name: string;
  email: string;
};

const METRICS = [
  { value: "DELIVERIES_ON_TIME", label: "Entregas no Prazo", description: "% de entregas concluídas no prazo", category: "execution" },
  { value: "DELIVERIES_COMPLETION", label: "Taxa de Conclusão", description: "% de entregas concluídas", category: "execution" },
  { value: "CHECKLIST_COMPLETION", label: "Checklist Completo", description: "% do checklist diário concluído", category: "execution" },
  { value: "DEMANDS_RESOLVED", label: "Demandas Resolvidas", description: "% de demandas resolvidas", category: "execution" },
  { value: "HEALTH_SCORE_AVG", label: "Health Score Médio", description: "Média de health score das empresas", category: "portfolio" },
  { value: "ACCOUNTS_HEALTHY", label: "Contas Saudáveis", description: "% de contas com status saudável", category: "portfolio" },
  { value: "RISK_REDUCTION", label: "Redução de Risco", description: "Contas que saíram de risco", category: "portfolio" },
  { value: "ACTIVITIES_COUNT", label: "Atividades", description: "Quantidade de atividades registradas", category: "engagement" },
  { value: "MEETINGS_COUNT", label: "Reuniões", description: "Quantidade de reuniões realizadas", category: "engagement" },
  { value: "NPS_AVERAGE", label: "NPS Médio", description: "Média do NPS das empresas", category: "satisfaction" },
  { value: "CSAT_AVERAGE", label: "CSAT Médio", description: "Média do CSAT das empresas", category: "satisfaction" },
];

const PERIODS = [
  { value: "WEEKLY", label: "Semanal" },
  { value: "MONTHLY", label: "Mensal" },
  { value: "QUARTERLY", label: "Trimestral" },
];

const CATEGORY_COLORS: Record<string, string> = {
  execution: "from-emerald-500 to-teal-500",
  portfolio: "from-red-500 to-rose-500",
  engagement: "from-blue-500 to-cyan-500",
  satisfaction: "from-amber-500 to-orange-500",
};

export default function NewGoalPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [csOwners, setCsOwners] = useState<CSOwner[]>([]);
  const [loadingCS, setLoadingCS] = useState(true);

  const [formData, setFormData] = useState({
    assignType: "team" as "team" | "individual",
    csOwnerId: "",
    metric: "",
    targetValue: "",
    period: "MONTHLY",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  useEffect(() => {
    async function loadCSOwners() {
      try {
        const res = await fetch("/api/cs-owners");
        if (res.ok) {
          setCsOwners(await res.json());
        }
      } catch (error) {
        console.error("Erro ao carregar CS Owners:", error);
      }
      setLoadingCS(false);
    }
    loadCSOwners();
  }, []);

  useEffect(() => {
    if (formData.startDate && formData.period) {
      const start = new Date(formData.startDate);
      let end = new Date(start);

      switch (formData.period) {
        case "WEEKLY":
          end.setDate(end.getDate() + 7);
          break;
        case "MONTHLY":
          end.setMonth(end.getMonth() + 1);
          break;
        case "QUARTERLY":
          end.setMonth(end.getMonth() + 3);
          break;
      }

      setFormData(prev => ({
        ...prev,
        endDate: end.toISOString().split("T")[0],
      }));
    }
  }, [formData.startDate, formData.period]);

  const selectedMetric = METRICS.find(m => m.value === formData.metric);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.metric || !formData.targetValue || !formData.startDate || !formData.endDate) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/cs-performance/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csOwnerId: formData.assignType === "individual" ? formData.csOwnerId : null,
          metric: formData.metric,
          targetValue: parseFloat(formData.targetValue),
          period: formData.period,
          startDate: formData.startDate,
          endDate: formData.endDate,
        }),
      });

      if (res.ok) {
        router.push("/admin/operacao/performance?tab=goals");
      }
    } catch (error) {
      console.error("Erro ao criar meta:", error);
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Nova Meta" subtitle="Defina uma meta de performance" showFilters={false} />

      <div className="flex-1 overflow-auto p-6">
        <Link href="/admin/operacao/performance" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Performance
        </Link>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atribuição</CardTitle>
              <CardDescription>Defina se a meta é para a equipe ou individual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.assignType === "team" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => setFormData(prev => ({ ...prev, assignType: "team", csOwnerId: "" }))}
                >
                  <Users className="h-4 w-4" />
                  Meta da Equipe
                </Button>
                <Button
                  type="button"
                  variant={formData.assignType === "individual" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => setFormData(prev => ({ ...prev, assignType: "individual" }))}
                >
                  <User className="h-4 w-4" />
                  Meta Individual
                </Button>
              </div>

              {formData.assignType === "individual" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">CS Owner</label>
                  <Select
                    value={formData.csOwnerId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, csOwnerId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um CS..." />
                    </SelectTrigger>
                    <SelectContent>
                      {csOwners.map(cs => (
                        <SelectItem key={cs.id} value={cs.id}>{cs.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Métrica</CardTitle>
              <CardDescription>Escolha o indicador que deseja acompanhar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {METRICS.map(metric => (
                  <div
                    key={metric.value}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                      formData.metric === metric.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    )}
                    onClick={() => setFormData(prev => ({ ...prev, metric: metric.value }))}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br",
                        CATEGORY_COLORS[metric.category]
                      )}>
                        <Target className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{metric.label}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{metric.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valor Alvo</CardTitle>
              <CardDescription>Defina o valor que deseja atingir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Valor {selectedMetric?.label && `(${selectedMetric.label})`}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.targetValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetValue: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border bg-background"
                  placeholder={
                    selectedMetric?.category === "execution" || selectedMetric?.category === "portfolio"
                      ? "Ex: 85 (para 85%)"
                      : "Ex: 50"
                  }
                />
                {selectedMetric && (
                  <p className="text-xs text-muted-foreground">
                    {selectedMetric.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Período</CardTitle>
              <CardDescription>Defina o período de vigência da meta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Período</label>
                <Select
                  value={formData.period}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map(period => (
                      <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Início</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Fim</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border bg-background"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Link href="/admin/operacao/performance">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button
              type="submit"
              disabled={saving || !formData.metric || !formData.targetValue || (formData.assignType === "individual" && !formData.csOwnerId)}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Criar Meta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
