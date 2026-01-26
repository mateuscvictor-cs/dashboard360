"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, ArrowUpDown, Edit, MoreHorizontal, AlertTriangle, Building2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, getHealthLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
  segment: string | null;
  plan: string | null;
  mrr: number;
  healthScore: number;
  healthStatus: string;
  csOwner: { id: string; name: string } | null;
  squad: { id: string; name: string } | null;
}

const healthBadgeVariant: Record<string, "critical" | "risk" | "attention" | "healthy"> = {
  CRITICAL: "critical",
  RISK: "risk",
  ATTENTION: "attention",
  HEALTHY: "healthy",
};

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "health" | "mrr">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      } else {
        setError("Erro ao carregar empresas");
      }
    } catch (err) {
      console.error("Erro:", err);
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies
    .filter((company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "health") {
        comparison = a.healthScore - b.healthScore;
      } else if (sortBy === "mrr") {
        comparison = a.mrr - b.mrr;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSort = (field: "name" | "health" | "mrr") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Empresas" subtitle="Carregando..." showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Empresas" subtitle="" showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="flex flex-col items-center py-8">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <p className="text-center text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchCompanies}>Tentar novamente</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Empresas" subtitle={`${companies.length} empresas cadastradas`} showFilters={false} />

      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
          <Link href="/admin/empresas/nova">
            <Button className="gap-2 bg-gradient-brand hover:brightness-110">
              <Plus className="h-4 w-4" />
              Nova Empresa
            </Button>
          </Link>
        </div>

        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhuma empresa encontrada</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm ? "Tente alterar os termos de busca" : "Comece cadastrando sua primeira empresa"}
              </p>
              {!searchTerm && (
                <Link href="/admin/empresas/nova">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Empresa
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left">
                      <button
                        onClick={() => toggleSort("name")}
                        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        Empresa
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      Segmento
                    </th>
                    <th className="p-4 text-left">
                      <button
                        onClick={() => toggleSort("health")}
                        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        Saúde
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="p-4 text-left">
                      <button
                        onClick={() => toggleSort("mrr")}
                        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        MRR
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      CS Owner
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      Squad
                    </th>
                    <th className="p-4 w-20 text-right text-sm font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company) => (
                    <tr
                      key={company.id}
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold">
                            {company.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/admin/conta/${company.id}`}
                              className="font-medium hover:underline"
                            >
                              {company.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {company.plan || "Sem plano"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{company.segment || "-"}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={company.healthScore}
                            className="w-16 h-2"
                            indicatorClassName={cn(
                              company.healthScore >= 80 && "bg-health-healthy",
                              company.healthScore >= 60 && company.healthScore < 80 && "bg-health-attention",
                              company.healthScore >= 40 && company.healthScore < 60 && "bg-health-risk",
                              company.healthScore < 40 && "bg-health-critical"
                            )}
                          />
                          <Badge variant={healthBadgeVariant[company.healthStatus] || "healthy"}>
                            {getHealthLabel(company.healthScore)}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium">
                          {formatCurrency(company.mrr)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{company.csOwner?.name || "-"}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {company.squad?.name || "-"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/empresas/${company.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
