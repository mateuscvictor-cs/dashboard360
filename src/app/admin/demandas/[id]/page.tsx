"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  User,
  Calendar,
  FileText,
  ExternalLink,
  Loader2,
  MessageSquare,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemandComments, DemandTasks } from "@/components/demand";
import { MarkdownContent } from "@/components/markdown-content";
import { cn } from "@/lib/utils";

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: "Urgente",
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

const TYPE_LABELS: Record<string, string> = {
  SUPPORT: "Suporte",
  ESCALATION: "Escalação",
  REQUEST: "Solicitação",
  INTERNAL: "Interna",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

export default function AdminDemandaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [demand, setDemand] = useState<{
    id: string;
    title: string;
    description: string | null;
    type: string;
    priority: string;
    status: string;
    dueDate: string | null;
    contextExcerpt: string | null;
    company: { id: string; name: string } | null;
    assignedTo: { user: { id: string; name: string | null; email: string } } | null;
    sourceBooking: { id: string; title: string; startTime: string } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/demands/${id}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404 || res.status === 403) router.push("/admin/operacao");
          return null;
        }
        return res.json();
      })
      .then(setDemand)
      .catch(() => router.push("/admin/operacao"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!demand) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/operacao">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{demand.title}</h1>
          <p className="text-muted-foreground">Detalhes da demanda</p>
        </div>
        <Badge
          variant={demand.status === "COMPLETED" ? "secondary" : "default"}
          className={cn(
            demand.priority === "URGENT" && "border-destructive text-destructive"
          )}
        >
          {STATUS_LABELS[demand.status] ?? demand.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              {demand.description ? (
                <div className="prose prose-sm max-w-none">
                  <MarkdownContent content={demand.description} />
                </div>
              ) : (
                <p className="text-muted-foreground">Sem descrição</p>
              )}
            </CardContent>
          </Card>

          {demand.contextExcerpt && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Contexto da reunião
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">
                  &ldquo;{demand.contextExcerpt}&rdquo;
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comentários e Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tasks">
                <TabsList>
                  <TabsTrigger value="tasks" className="gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Tarefas
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comentários
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="tasks" className="mt-4">
                  <DemandTasks demandId={demand.id} />
                </TabsContent>
                <TabsContent value="comments" className="mt-4">
                  <DemandComments demandId={demand.id} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Tipo</p>
                <Badge variant="outline">{TYPE_LABELS[demand.type] ?? demand.type}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Prioridade</p>
                <Badge
                  variant={
                    demand.priority === "URGENT"
                      ? "destructive"
                      : demand.priority === "HIGH"
                        ? "default"
                        : "secondary"
                  }
                >
                  {PRIORITY_LABELS[demand.priority] ?? demand.priority}
                </Badge>
              </div>
              {demand.company && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Empresa
                  </p>
                  <Link
                    href={`/admin/empresas/${demand.company.id}`}
                    className="flex items-center gap-2 text-sm font-medium hover:underline"
                  >
                    <Building2 className="h-4 w-4" />
                    {demand.company.name}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
              {demand.assignedTo?.user && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Responsável
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    {demand.assignedTo.user.name ?? demand.assignedTo.user.email}
                  </div>
                </div>
              )}
              {demand.dueDate && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Prazo
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {new Date(demand.dueDate).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              )}
              {demand.sourceBooking && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Reunião de origem
                  </p>
                  <Link
                    href={`/admin/agenda/${demand.sourceBooking.id}`}
                    className="flex items-center gap-2 text-sm font-medium hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    {demand.sourceBooking.title}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
