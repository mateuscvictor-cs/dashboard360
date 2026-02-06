"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Search,
  Calendar,
  Edit2,
  Eye,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Company = {
  id: string;
  name: string;
  logo: string | null;
  segment: string | null;
  plan: string | null;
  mrr: number;
  healthScore: number;
  healthStatus: string;
  lastInteraction: string | null;
  nextDelivery: string | null;
  canEdit: boolean;
  csOwner: { id: string; name: string } | null;
};

const healthStatusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  HEALTHY: { label: "Saudável", color: "text-emerald-500", icon: CheckCircle },
  STABLE: { label: "Estável", color: "text-blue-500", icon: TrendingUp },
  ATTENTION: { label: "Atenção", color: "text-amber-500", icon: TrendingDown },
  RISK: { label: "Em Risco", color: "text-orange-500", icon: AlertTriangle },
  CRITICAL: { label: "Crítico", color: "text-red-500", icon: AlertTriangle },
};

export default function CSEmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"mine" | "all">("mine");

  useEffect(() => {
    fetchCompanies();
  }, [view]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const url = view === "all" ? "/api/cs/empresas?all=true" : "/api/cs/empresas";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Não definido";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Minhas Empresas" subtitle="Empresas sob sua responsabilidade" showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Minhas Empresas" subtitle="Empresas sob sua responsabilidade" showFilters={false} />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-1 p-1 rounded-lg bg-muted">
            <Button
              variant={view === "mine" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("mine")}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Minhas
            </Button>
            <Button
              variant={view === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("all")}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Todas
            </Button>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredCompanies.length} {filteredCompanies.length === 1 ? "empresa" : "empresas"}
          </Badge>
        </div>

        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {companies.length === 0 ? "Nenhuma empresa atribuída" : "Nenhuma empresa encontrada"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                {companies.length === 0
                  ? "Você ainda não tem empresas atribuídas. Entre em contato com seu líder para mais informações."
                  : "Nenhuma empresa corresponde à sua busca. Tente outro termo."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => {
              const statusConfig = healthStatusConfig[company.healthStatus] || healthStatusConfig.STABLE;
              const StatusIcon = statusConfig.icon;

              return (
                <Link key={company.id} href={`/cs/conta/${company.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold text-lg">
                          {company.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold">{company.name}</h3>
                          <p className="text-sm text-muted-foreground">{company.segment || "Sem segmento"}</p>
                          {view === "all" && company.csOwner && (
                            <p className="text-xs text-muted-foreground">CS: {company.csOwner.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className={cn("gap-1", statusConfig.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                        {!company.canEdit && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Eye className="h-3 w-3" />
                            Visualizar
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Health Score</span>
                        <span className="font-semibold">{company.healthScore}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            company.healthScore >= 80 ? "bg-emerald-500" :
                            company.healthScore >= 60 ? "bg-blue-500" :
                            company.healthScore >= 40 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${company.healthScore}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2 text-sm">
                        <span className="text-muted-foreground">MRR</span>
                        <span className="font-medium">{formatCurrency(company.mrr)}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Última interação
                        </span>
                        <span className="font-medium">{formatDate(company.lastInteraction)}</span>
                      </div>
                    </div>
                  </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
