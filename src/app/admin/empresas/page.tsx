"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, ArrowUpDown, Edit, MoreHorizontal, AlertTriangle, Building2, UserX, Trash2, AlertCircle, CheckCircle2, DollarSign, X, HelpCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOUR_START_PARAM } from "@/lib/tour-nova-empresa-steps";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { formatCurrency, getHealthLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
  segment: string | null;
  plan: string | null;
  framework: string | null;
  mrr: number;
  healthScore: number;
  healthStatus: string;
  projectStatus: string | null;
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
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "health" | "mrr">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [companyToDeactivate, setCompanyToDeactivate] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filterSegment, setFilterSegment] = useState<string>("all");
  const [filterCsOwnerId, setFilterCsOwnerId] = useState<string>("all");
  const [filterSquadId, setFilterSquadId] = useState<string>("all");
  const [filterHealth, setFilterHealth] = useState<string>("all");
  const [filterFramework, setFilterFramework] = useState<string>("all");
  const [filterProjectStatus, setFilterProjectStatus] = useState<string>("all");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!menuOpenId) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpenId]);

  const filterOptions = useMemo(() => {
    const segments = Array.from(new Set(companies.map((c) => c.segment).filter(Boolean))) as string[];
    const csOwners = Array.from(
      new Map(companies.map((c) => c.csOwner).filter(Boolean).map((cs) => [cs!.id, cs!.name])).entries()
    );
    const squads = Array.from(
      new Map(companies.map((c) => c.squad).filter(Boolean).map((s) => [s!.id, s!.name])).entries()
    );
    const frameworks = Array.from(new Set(companies.map((c) => c.framework).filter(Boolean))) as string[];
    return { segments, csOwners, squads, frameworks };
  }, [companies]);

  const hasActiveFilters =
    filterSegment !== "all" ||
    filterCsOwnerId !== "all" ||
    filterSquadId !== "all" ||
    filterHealth !== "all" ||
    filterFramework !== "all" ||
    filterProjectStatus !== "all";

  const clearFilters = () => {
    setFilterSegment("all");
    setFilterCsOwnerId("all");
    setFilterSquadId("all");
    setFilterHealth("all");
    setFilterFramework("all");
    setFilterProjectStatus("all");
  };

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

  const filteredCompanies = useMemo(() => {
    let list = companies.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filterSegment !== "all") list = list.filter((c) => c.segment === filterSegment);
    if (filterCsOwnerId !== "all") list = list.filter((c) => c.csOwner?.id === filterCsOwnerId);
    if (filterSquadId !== "all") list = list.filter((c) => c.squad?.id === filterSquadId);
    if (filterHealth !== "all") {
      const status = filterHealth.toUpperCase();
      list = list.filter((c) => c.healthStatus === status);
    }
    if (filterFramework !== "all") list = list.filter((c) => c.framework === filterFramework);
    if (filterProjectStatus !== "all") {
      list = list.filter((c) => (c.projectStatus ?? "") === filterProjectStatus);
    }
    return [...list].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      else if (sortBy === "health") comparison = a.healthScore - b.healthScore;
      else if (sortBy === "mrr") comparison = a.mrr - b.mrr;
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [
    companies,
    searchTerm,
    filterSegment,
    filterCsOwnerId,
    filterSquadId,
    filterHealth,
    filterFramework,
    filterProjectStatus,
    sortBy,
    sortOrder,
  ]);

  const summary = useMemo(() => {
    const total = filteredCompanies.length;
    const atRisk = filteredCompanies.filter((c) =>
      ["CRITICAL", "RISK", "ATTENTION"].includes(c.healthStatus)
    ).length;
    const healthy = filteredCompanies.filter((c) => c.healthStatus === "HEALTHY").length;
    const mrrTotal = filteredCompanies.reduce((sum, c) => sum + c.mrr, 0);
    return { total, atRisk, healthy, mrrTotal };
  }, [filteredCompanies]);

  const toggleSort = (field: "name" | "health" | "mrr") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleDeleteCompany = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!companyToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/companies/${companyToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir");
      setCompanies((prev) => prev.filter((c) => c.id !== companyToDelete.id));
      setCompanyToDelete(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir empresa");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivateAccess = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!companyToDeactivate) return;
    setDeactivating(true);
    try {
      const res = await fetch(`/api/companies/${companyToDeactivate.id}/users-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao desativar acessos");
      setCompanyToDeactivate(null);
      if (data.updated !== undefined && data.updated > 0) {
        alert(`${data.updated} acesso(s) desativado(s).`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao desativar acessos");
    } finally {
      setDeactivating(false);
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

  const subtitle = hasActiveFilters
    ? `${filteredCompanies.length} de ${companies.length} empresas`
    : `${companies.length} empresas cadastradas`;

  const tourTriggerButton = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Aprenda a editar suas empresas"
            onClick={() => router.push(`/admin/empresas/nova?${TOUR_START_PARAM}=1`)}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          Aprenda a editar suas empresas
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="flex flex-col h-full">
      <Header title="Empresas" subtitle={subtitle} showFilters={false} action={tourTriggerButton} />

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold">{summary.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
                  <AlertCircle className="h-4 w-4 text-warning" />
                </div>
              </div>
              <div className="text-2xl font-bold">{summary.atRisk}</div>
              <p className="text-xs text-muted-foreground mt-1">Em risco ou atenção</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-health-healthy-light">
                  <CheckCircle2 className="h-4 w-4 text-health-healthy" />
                </div>
              </div>
              <div className="text-2xl font-bold">{summary.healthy}</div>
              <p className="text-xs text-muted-foreground mt-1">Saudáveis</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(summary.mrrTotal)}</div>
              <p className="text-xs text-muted-foreground mt-1">MRR total</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showFiltersPanel ? "secondary" : "outline"}
              className="gap-2 shrink-0"
              onClick={() => setShowFiltersPanel((v) => !v)}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {[filterSegment, filterCsOwnerId, filterSquadId, filterHealth, filterFramework, filterProjectStatus].filter((v) => v !== "all").length}
                </Badge>
              )}
            </Button>
          </div>
          <Link href="/admin/empresas/nova">
            <Button className="gap-2 bg-gradient-brand hover:brightness-110 shrink-0">
              <Plus className="h-4 w-4" />
              Nova Empresa
            </Button>
          </Link>
        </div>

        {showFiltersPanel && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Filtros</span>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="gap-1 h-8" onClick={clearFilters}>
                    <X className="h-3.5 w-3.5" />
                    Limpar filtros
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Segmento</label>
                  <Select value={filterSegment} onValueChange={setFilterSegment}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {filterOptions.segments.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">CS Owner</label>
                  <Select value={filterCsOwnerId} onValueChange={setFilterCsOwnerId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {filterOptions.csOwners.map(([id, name]) => (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Squad</label>
                  <Select value={filterSquadId} onValueChange={setFilterSquadId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {filterOptions.squads.map(([id, name]) => (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Saúde</label>
                  <Select value={filterHealth} onValueChange={setFilterHealth}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="HEALTHY">Saudável</SelectItem>
                      <SelectItem value="ATTENTION">Atenção</SelectItem>
                      <SelectItem value="RISK">Risco</SelectItem>
                      <SelectItem value="CRITICAL">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Framework</label>
                  <Select value={filterFramework} onValueChange={setFilterFramework}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {filterOptions.frameworks.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Status do projeto</label>
                  <Select value={filterProjectStatus} onValueChange={setFilterProjectStatus}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                      <SelectItem value="PAUSED">Em pausa</SelectItem>
                      <SelectItem value="CONCLUDED">Projeto concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhuma empresa encontrada</p>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                {hasActiveFilters
                  ? "Nenhuma empresa corresponde aos filtros. Tente alterar ou limpar os filtros."
                  : searchTerm
                    ? "Tente alterar os termos de busca"
                    : "Comece cadastrando sua primeira empresa"}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" className="gap-2" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                  Limpar filtros
                </Button>
              ) : !searchTerm ? (
                <Link href="/admin/empresas/nova">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Empresa
                  </Button>
                </Link>
              ) : null}
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
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      Status projeto
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
                              {company.framework || "Sem framework"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{company.segment || "-"}</span>
                      </td>
                      <td className="p-4">
                        {company.projectStatus ? (
                          <Badge
                            variant={
                              company.projectStatus === "CONCLUDED"
                                ? "healthy"
                                : company.projectStatus === "PAUSED"
                                  ? "attention"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {company.projectStatus === "CONCLUDED"
                              ? "Concluído"
                              : company.projectStatus === "PAUSED"
                                ? "Em pausa"
                                : "Em andamento"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
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
                          <div className="relative" ref={menuOpenId === company.id ? menuRef : undefined}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setMenuOpenId(menuOpenId === company.id ? null : company.id)}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            {menuOpenId === company.id && (
                              <div className="absolute right-0 top-full z-10 mt-1 min-w-[10rem] rounded-lg border bg-background py-1 shadow-lg">
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                  onClick={() => {
                                    setCompanyToDeactivate(company);
                                    setMenuOpenId(null);
                                  }}
                                >
                                  <UserX className="h-4 w-4" />
                                  Desativar acessos
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setCompanyToDelete(company);
                                    setMenuOpenId(null);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Excluir empresa
                                </button>
                              </div>
                            )}
                          </div>
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

      <AlertDialog
        open={!!companyToDelete}
        onOpenChange={(open) => {
          if (!open) setCompanyToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa {companyToDelete?.name}? Esta ação não pode ser desfeita e removerá todos os dados vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCompanyToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteCompany(e as unknown as React.MouseEvent);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!companyToDeactivate}
        onOpenChange={(open) => {
          if (!open) setCompanyToDeactivate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar acessos</AlertDialogTitle>
            <AlertDialogDescription>
              Desativar todos os usuários vinculados à empresa {companyToDeactivate?.name}? Eles não poderão mais acessar a plataforma até serem reativados na Gestão de Acessos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCompanyToDeactivate(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDeactivateAccess(e as unknown as React.MouseEvent);
              }}
              disabled={deactivating}
            >
              {deactivating ? "Desativando..." : "Desativar acessos"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
