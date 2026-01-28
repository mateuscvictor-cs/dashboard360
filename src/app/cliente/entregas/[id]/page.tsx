"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  FileText,
  ArrowLeft,
  ExternalLink,
  Video,
  User,
  Key,
  MessageSquare,
  Link as LinkIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientDependencyCard } from "@/components/delivery/client-dependency-card";
import { DeliveryComments } from "@/components/delivery/delivery-comments";
import { DeliveryApprovalActions } from "@/components/delivery/delivery-approval-actions";

type Dependency = {
  id: string;
  title: string;
  description: string | null;
  type: "ACCESS" | "DOCUMENT" | "APPROVAL" | "INFORMATION";
  status: "PENDING" | "PROVIDED" | "OVERDUE" | "NOT_NEEDED";
  dueDate: string | null;
  providedAt: string | null;
  providedNote: string | null;
};

type Comment = {
  id: string;
  content: string;
  type: "COMMENT" | "CHANGE_REQUEST" | "APPROVAL" | "REJECTION" | "RESPONSE";
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
  };
};

type Document = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  type: string;
  createdAt: string;
  uploadedBy: { id: string; name: string } | null;
};

type Meeting = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  status: string;
  fathomLink: string | null;
  meetingLink: string | null;
  participants: { id: string; name: string; email: string | null; attended: boolean }[];
};

type Delivery = {
  id: string;
  title: string;
  description: string | null;
  impactDescription: string | null;
  status: string;
  progress: number;
  dueDate: string | null;
  assignee: string | null;
  blockers: string[];
  impact: string;
  clientApprovalStatus: string | null;
  clientApprovedAt: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    csOwner: { id: string; name: string; email: string; avatar: string | null } | null;
  };
  dependencies: Dependency[];
  comments: Comment[];
  documents: Document[];
  meetings: Meeting[];
  completion: {
    feedback: string;
    completedAt: string;
    completedBy: { name: string };
  } | null;
  pendingDependenciesCount: number;
  hasPendingDependencies: boolean;
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle; variant: "healthy" | "attention" | "risk" | "critical" | "secondary" }> = {
  PENDING: { label: "Pendente", color: "text-slate-500", icon: Clock, variant: "secondary" },
  IN_PROGRESS: { label: "Em Andamento", color: "text-blue-500", icon: Package, variant: "attention" },
  BLOCKED: { label: "Aguardando Você", color: "text-red-500", icon: XCircle, variant: "critical" },
  COMPLETED: { label: "Concluída", color: "text-emerald-500", icon: CheckCircle, variant: "healthy" },
  DELAYED: { label: "Atrasada", color: "text-orange-500", icon: AlertTriangle, variant: "risk" },
};

const documentTypeConfig: Record<string, { label: string; icon: typeof FileText }> = {
  PRESENTATION: { label: "Apresentação", icon: FileText },
  SPREADSHEET: { label: "Planilha", icon: FileText },
  PDF: { label: "PDF", icon: FileText },
  VIDEO: { label: "Vídeo", icon: Video },
  LINK: { label: "Link", icon: LinkIcon },
  OTHER: { label: "Outro", icon: FileText },
};

export default function ClienteDeliveryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchDelivery();
  }, [id]);

  const fetchDelivery = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cliente/deliveries/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDelivery(data);
      } else if (response.status === 404) {
        router.push("/cliente/entregas");
      }
    } catch (error) {
      console.error("Erro ao carregar entrega:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Não definido";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Entrega não encontrada</p>
      </div>
    );
  }

  const status = statusConfig[delivery.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  const pendingDependencies = delivery.dependencies.filter(
    (d) => d.status === "PENDING" || d.status === "OVERDUE"
  );

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="px-6 py-4">
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/cliente/entregas">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{delivery.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={status.variant}>
              <StatusIcon className="h-3.5 w-3.5 mr-1" />
              {status.label}
            </Badge>
            {delivery.hasPendingDependencies && (
              <Badge variant="destructive">
                <Key className="h-3.5 w-3.5 mr-1" />
                {delivery.pendingDependenciesCount} pendência{delivery.pendingDependenciesCount > 1 ? "s" : ""} sua{delivery.pendingDependenciesCount > 1 ? "s" : ""}
              </Badge>
            )}
            {delivery.dueDate && (
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(delivery.dueDate)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="dependencies" className="relative">
              Suas Pendências
              {pendingDependencies.length > 0 && (
                <span className="ml-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {pendingDependencies.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents">
              Documentos ({delivery.documents.length})
            </TabsTrigger>
            <TabsTrigger value="communication">
              Comunicação ({delivery.comments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {(delivery.status === "COMPLETED" || delivery.clientApprovalStatus) && (
              <DeliveryApprovalActions
                deliveryId={delivery.id}
                status={delivery.status}
                clientApprovalStatus={delivery.clientApprovalStatus}
                onApproved={fetchDelivery}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detalhes da Entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {delivery.description && (
                    <div>
                      <label className="text-sm text-muted-foreground">Descrição</label>
                      <p className="mt-1">{delivery.description}</p>
                    </div>
                  )}

                  {delivery.impactDescription && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <label className="text-sm font-medium text-green-700 dark:text-green-400">
                        Impacto/Valor
                      </label>
                      <p className="mt-1 text-sm">{delivery.impactDescription}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold">{delivery.progress}%</span>
                    </div>
                    <Progress value={delivery.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-muted-foreground">Responsável</label>
                      <p className="font-medium">{delivery.assignee || "Não definido"}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Prazo</label>
                      <p className="font-medium">{formatDate(delivery.dueDate)}</p>
                    </div>
                  </div>

                  {delivery.blockers.length > 0 && (
                    <div>
                      <label className="text-sm text-muted-foreground">Bloqueios</label>
                      <div className="mt-1 space-y-1">
                        {delivery.blockers.map((blocker, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-red-600">
                            <XCircle className="h-3.5 w-3.5" />
                            {blocker}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Seu CS</CardTitle>
                </CardHeader>
                <CardContent>
                  {delivery.company.csOwner ? (
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {delivery.company.csOwner.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{delivery.company.csOwner.name}</p>
                        <p className="text-sm text-muted-foreground">{delivery.company.csOwner.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">CS não definido</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {delivery.completion && (
              <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/5">
                <CardHeader>
                  <CardTitle className="text-base text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="h-4 w-4 inline mr-2" />
                    Entrega Concluída
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">
                    Concluída por <strong>{delivery.completion.completedBy.name}</strong> em{" "}
                    {formatDateTime(delivery.completion.completedAt)}
                  </p>
                  <div>
                    <label className="text-sm text-muted-foreground">Feedback da Equipe</label>
                    <p className="mt-1 text-sm">{delivery.completion.feedback}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {pendingDependencies.length > 0 && (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <AlertTriangle className="h-4 w-4" />
                    Ação Necessária
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Esta entrega está aguardando {pendingDependencies.length} item(s) do seu lado.
                    Por favor, forneça as informações necessárias para continuar o projeto.
                  </p>
                  <Button onClick={() => setActiveTab("dependencies")}>
                    Ver Pendências
                  </Button>
                </CardContent>
              </Card>
            )}

            {delivery.meetings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Últimas Reuniões</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {delivery.meetings.slice(0, 3).map((meeting) => (
                    <div key={meeting.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(meeting.date)}
                        </p>
                      </div>
                      {meeting.fathomLink && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={meeting.fathomLink} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-1" />
                            Gravação
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="dependencies" className="space-y-4">
            <div className="mb-4">
              <h3 className="font-medium">Suas Pendências</h3>
              <p className="text-sm text-muted-foreground">
                Itens que precisam da sua ação para o projeto continuar
              </p>
            </div>

            {delivery.dependencies.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="font-medium">Nenhuma pendência!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Não há nada aguardando sua ação nesta entrega.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingDependencies.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      Aguardando Você ({pendingDependencies.length})
                    </h4>
                    {pendingDependencies.map((dep) => (
                      <ClientDependencyCard
                        key={dep.id}
                        deliveryId={delivery.id}
                        dependency={dep}
                        onProvided={fetchDelivery}
                      />
                    ))}
                  </div>
                )}

                {delivery.dependencies.filter((d) => d.status === "PROVIDED").length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h4 className="text-sm font-medium text-green-700 dark:text-green-400">
                      Já Fornecidos
                    </h4>
                    {delivery.dependencies
                      .filter((d) => d.status === "PROVIDED")
                      .map((dep) => (
                        <ClientDependencyCard
                          key={dep.id}
                          deliveryId={delivery.id}
                          dependency={dep}
                          onProvided={fetchDelivery}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="mb-4">
              <h3 className="font-medium">Documentos</h3>
              <p className="text-sm text-muted-foreground">
                Materiais e arquivos relacionados a esta entrega
              </p>
            </div>

            {delivery.documents.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum documento disponível</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {delivery.documents.map((doc) => {
                  const docType = documentTypeConfig[doc.type] || documentTypeConfig.OTHER;
                  const DocIcon = docType.icon;
                  return (
                    <Card key={doc.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <DocIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium truncate">{doc.title}</h4>
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  {docType.label}
                                </Badge>
                              </div>
                              <Button variant="ghost" size="icon" asChild>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {doc.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDate(doc.createdAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="communication" className="space-y-4">
            <DeliveryComments
              deliveryId={delivery.id}
              comments={delivery.comments}
              onRefresh={fetchDelivery}
              isClient={true}
              apiBasePath="/api/cliente/deliveries"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
