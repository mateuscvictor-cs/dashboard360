"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Calendar,
  Building2,
  Users,
  FileText,
  Plus,
  Filter,
  User,
} from "lucide-react";
import { Header } from "@/components/layout/header";
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
import { cn } from "@/lib/utils";

type Delivery = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  dueDate: string | null;
  assignee: string | null;
  blockers: string[];
  impact: string;
  createdAt: string;
  company: {
    id: string;
    name: string;
    csOwner: { id: string; name: string } | null;
  };
  completion: {
    id: string;
    completedAt: string;
    completedBy: { name: string };
  } | null;
  _count: {
    meetings: number;
    documents: number;
  };
};

type CSOwner = {
  id: string;
  name: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle; variant: "healthy" | "attention" | "risk" | "critical" | "secondary" }> = {
  PENDING: { label: "Pendente", color: "text-slate-500", icon: Clock, variant: "secondary" },
  IN_PROGRESS: { label: "Em Andamento", color: "text-blue-500", icon: Package, variant: "attention" },
  BLOCKED: { label: "Bloqueada", color: "text-red-500", icon: XCircle, variant: "critical" },
  COMPLETED: { label: "Concluída", color: "text-emerald-500", icon: CheckCircle, variant: "healthy" },
  DELAYED: { label: "Atrasada", color: "text-orange-500", icon: AlertTriangle, variant: "risk" },
};

const impactConfig: Record<string, { label: string; variant: "critical" | "risk" | "attention" | "secondary" }> = {
  URGENT: { label: "Urgente", variant: "critical" },
  HIGH: { label: "Alta", variant: "risk" },
  MEDIUM: { label: "Média", variant: "attention" },
  LOW: { label: "Baixa", variant: "secondary" },
};

export default function AdminEntregasPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [csOwners, setCSOwners] = useState<CSOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [csOwnerFilter, setCSOwnerFilter] = useState<string>("all");

  useEffect(() => {
    fetchCSOwners();
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter, csOwnerFilter]);

  const fetchCSOwners = async () => {
    try {
      const response = await fetch("/api/cs-owners");
      if (response.ok) {
        const data = await response.json();
        setCSOwners(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar CS Owners:", error);
    }
  };

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (csOwnerFilter !== "all") {
        params.set("csOwnerId", csOwnerFilter);
      }
      const response = await fetch(`/api/deliveries?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.deliveries || []);
      }
    } catch (error) {
      console.error("Erro ao carregar entregas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter(delivery =>
    delivery.title.toLowerCase().includes(search.toLowerCase()) ||
    delivery.company.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Não definido";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "COMPLETED") return false;
    return new Date(dueDate) < new Date();
  };

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === "PENDING").length,
    inProgress: deliveries.filter(d => d.status === "IN_PROGRESS").length,
    completed: deliveries.filter(d => d.status === "COMPLETED").length,
    blocked: deliveries.filter(d => d.status === "BLOCKED").length,
    delayed: deliveries.filter(d => d.status === "DELAYED").length,
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Entregas"
        subtitle="Visão geral de todas as entregas do portfólio"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card className={cn("cursor-pointer transition-all", statusFilter === "all" && "ring-2 ring-primary")} onClick={() => setStatusFilter("all")}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer transition-all", statusFilter === "PENDING" && "ring-2 ring-primary")} onClick={() => setStatusFilter("PENDING")}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-500">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pendentes</div>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer transition-all", statusFilter === "IN_PROGRESS" && "ring-2 ring-primary")} onClick={() => setStatusFilter("IN_PROGRESS")}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
              <div className="text-xs text-muted-foreground">Em Andamento</div>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer transition-all", statusFilter === "COMPLETED" && "ring-2 ring-primary")} onClick={() => setStatusFilter("COMPLETED")}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-500">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Concluídas</div>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer transition-all", statusFilter === "BLOCKED" && "ring-2 ring-primary")} onClick={() => setStatusFilter("BLOCKED")}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{stats.blocked}</div>
              <div className="text-xs text-muted-foreground">Bloqueadas</div>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer transition-all", statusFilter === "DELAYED" && "ring-2 ring-primary")} onClick={() => setStatusFilter("DELAYED")}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-500">{stats.delayed}</div>
              <div className="text-xs text-muted-foreground">Atrasadas</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={csOwnerFilter} onValueChange={setCSOwnerFilter}>
            <SelectTrigger className="w-[200px]">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="CS Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os CS</SelectItem>
              {csOwners.map((cs) => (
                <SelectItem key={cs.id} value={cs.id}>{cs.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma entrega encontrada</h3>
              <p className="text-sm text-muted-foreground">
                {search ? "Tente ajustar sua busca ou filtros" : "Não há entregas no momento"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDeliveries.map((delivery) => {
              const status = statusConfig[delivery.status] || statusConfig.PENDING;
              const impact = impactConfig[delivery.impact] || impactConfig.MEDIUM;
              const StatusIcon = status.icon;
              const overdue = isOverdue(delivery.dueDate, delivery.status);

              return (
                <Link key={delivery.id} href={`/admin/entregas/${delivery.id}`}>
                  <Card className="hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn("p-2 rounded-lg", status.color.replace("text-", "bg-").replace("500", "100"))}>
                          <StatusIcon className={cn("h-5 w-5", status.color)} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-semibold truncate">{delivery.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="h-3.5 w-3.5" />
                                  <span>{delivery.company.name}</span>
                                </div>
                                {delivery.company.csOwner && (
                                  <div className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    <span>{delivery.company.csOwner.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={status.variant}>{status.label}</Badge>
                              <Badge variant={impact.variant}>{impact.label}</Badge>
                            </div>
                          </div>

                          {delivery.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                              {delivery.description}
                            </p>
                          )}

                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Calendar className={cn("h-3.5 w-3.5", overdue ? "text-red-500" : "text-muted-foreground")} />
                              <span className={cn(overdue && "text-red-500 font-medium")}>
                                {formatDate(delivery.dueDate)}
                              </span>
                            </div>
                            
                            {delivery._count.meetings > 0 && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Users className="h-3.5 w-3.5" />
                                <span>{delivery._count.meetings} reuniões</span>
                              </div>
                            )}

                            {delivery._count.documents > 0 && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <FileText className="h-3.5 w-3.5" />
                                <span>{delivery._count.documents} documentos</span>
                              </div>
                            )}

                            {delivery.progress > 0 && (
                              <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                                <Progress value={delivery.progress} className="h-2" />
                                <span className="text-muted-foreground">{delivery.progress}%</span>
                              </div>
                            )}
                          </div>
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
