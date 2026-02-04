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
  Building2,
  Users,
  FileText,
  ArrowLeft,
  ExternalLink,
  Video,
  Plus,
  Edit,
  Trash2,
  User,
  Mail,
  Link as LinkIcon,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { DeliveryMeetingForm } from "@/components/delivery/delivery-meeting-form";
import { DeliveryDocumentForm } from "@/components/delivery/delivery-document-form";
import { DeliveryDependenciesList } from "@/components/delivery/delivery-dependencies-list";
import { DeliveryComments } from "@/components/delivery/delivery-comments";

type Participant = {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  attended: boolean;
  contact: { id: string; name: string; email: string } | null;
};

type Meeting = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  duration: number | null;
  meetingLink: string | null;
  fathomLink: string | null;
  notes: string | null;
  status: string;
  participants: Participant[];
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
  type: string | null;
  typeOtherSpec: string | null;
  adminApprovalStatus: string | null;
  adminScore: number | null;
  adminApprovedAt: string | null;
  adminApprovedBy: { id: string; name: string } | null;
  clientApprovalStatus: string | null;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
    logo: string | null;
    csOwner: { id: string; name: string; avatar: string | null } | null;
  };
  completion: {
    id: string;
    feedback: string;
    fathomLink: string | null;
    completedAt: string;
    completedBy: { id: string; name: string };
  } | null;
  meetings: Meeting[];
  documents: Document[];
  dependencies: Dependency[];
  comments: Comment[];
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

const meetingStatusConfig: Record<string, { label: string; variant: "healthy" | "secondary" | "risk" | "attention" }> = {
  SCHEDULED: { label: "Agendada", variant: "attention" },
  COMPLETED: { label: "Realizada", variant: "healthy" },
  CANCELLED: { label: "Cancelada", variant: "risk" },
  RESCHEDULED: { label: "Reagendada", variant: "secondary" },
};

const documentTypeConfig: Record<string, { label: string; icon: typeof FileText }> = {
  PRESENTATION: { label: "Apresentação", icon: FileText },
  SPREADSHEET: { label: "Planilha", icon: FileText },
  PDF: { label: "PDF", icon: FileText },
  VIDEO: { label: "Vídeo", icon: Video },
  IMAGE: { label: "Imagem", icon: FileText },
  LINK: { label: "Link", icon: LinkIcon },
  OTHER: { label: "Outro", icon: FileText },
};

const deliveryTypeConfig: Record<string, string> = {
  AUTOMATION: "Automação",
  IPC: "IPC",
  OTHER: "Outro",
};

export default function AdminDeliveryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [approving, setApproving] = useState(false);
  const [adminScore, setAdminScore] = useState("");

  useEffect(() => {
    fetchDelivery();
  }, [id]);

  const fetchDelivery = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/deliveries/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDelivery(data);
      } else if (response.status === 404) {
        router.push("/admin/entregas");
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

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm("Deseja realmente excluir esta reunião?")) return;
    
    try {
      const response = await fetch(`/api/deliveries/${id}/meetings/${meetingId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchDelivery();
      }
    } catch (error) {
      console.error("Erro ao excluir reunião:", error);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Deseja realmente excluir este documento?")) return;
    
    try {
      const response = await fetch(`/api/deliveries/${id}/documents/${docId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchDelivery();
      }
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
    }
  };

  const handleAdminApprove = async (action: "approve" | "request_changes") => {
    if (action === "approve") {
      const score = Number(adminScore);
      if (Number.isNaN(score) || score < 0 || score > 10) {
        alert("Informe uma nota entre 0 e 10.");
        return;
      }
    }
    setApproving(true);
    try {
      const response = await fetch(`/api/admin/deliveries/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "approve"
            ? { action: "approve", score: Number(adminScore) }
            : { action: "request_changes" }
        ),
      });
      const data = await response.json();
      if (response.ok) {
        setAdminScore("");
        fetchDelivery();
      } else {
        alert(data.error || "Erro ao processar aprovação.");
      }
    } catch (error) {
      console.error("Erro ao aprovar entrega:", error);
      alert("Erro ao processar aprovação.");
    } finally {
      setApproving(false);
    }
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
  const impact = impactConfig[delivery.impact] || impactConfig.MEDIUM;
  const StatusIcon = status.icon;

  return (
    <div className="flex flex-col h-full">
      <Header
        title={delivery.title}
        subtitle={
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>{delivery.company.name}</span>
            {delivery.company.csOwner && (
              <>
                <span className="text-muted-foreground">•</span>
                <User className="h-4 w-4" />
                <span>{delivery.company.csOwner.name}</span>
              </>
            )}
          </div>
        }
        backLink="/admin/entregas"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Badge variant={status.variant} className="text-sm">
            <StatusIcon className="h-3.5 w-3.5 mr-1" />
            {status.label}
          </Badge>
          <Badge variant={impact.variant}>{impact.label}</Badge>
          {delivery.dueDate && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(delivery.dueDate)}
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="dependencies" className="relative">
              Dependências
              {delivery.dependencies.filter((d) => d.status === "PENDING" || d.status === "OVERDUE").length > 0 && (
                <span className="ml-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {delivery.dependencies.filter((d) => d.status === "PENDING" || d.status === "OVERDUE").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="meetings">
              Reuniões ({delivery.meetings.length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              Documentos ({delivery.documents.length})
            </TabsTrigger>
            <TabsTrigger value="comments">
              Comunicação ({delivery.comments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detalhes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {delivery.description && (
                    <div>
                      <label className="text-sm text-muted-foreground">Descrição</label>
                      <p className="mt-1">{delivery.description}</p>
                    </div>
                  )}
                  
                  {(delivery.type || delivery.typeOtherSpec) && (
                    <div>
                      <label className="text-sm text-muted-foreground">Tipo da entrega</label>
                      <p className="mt-1">
                        {delivery.type ? deliveryTypeConfig[delivery.type] ?? delivery.type : "—"}
                        {delivery.type === "OTHER" && delivery.typeOtherSpec ? ` — ${delivery.typeOtherSpec}` : ""}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Progresso</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={delivery.progress} className="h-2 flex-1" />
                        <span className="text-sm font-medium">{delivery.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Responsável</label>
                      <p className="mt-1">{delivery.assignee || "Não definido"}</p>
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
                  <CardTitle className="text-base">Empresa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {delivery.company.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <Link href={`/admin/empresas/${delivery.company.id}`} className="font-medium hover:underline">
                        {delivery.company.name}
                      </Link>
                      {delivery.company.csOwner && (
                        <p className="text-sm text-muted-foreground">
                          CS: {delivery.company.csOwner.name}
                        </p>
                      )}
                    </div>
                  </div>
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
                    <label className="text-sm text-muted-foreground">Feedback</label>
                    <p className="mt-1 text-sm">{delivery.completion.feedback}</p>
                  </div>
                  {delivery.completion.fathomLink && (
                    <div>
                      <label className="text-sm text-muted-foreground">Fathom</label>
                      <p className="mt-1">
                        <a
                          href={delivery.completion.fathomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          Abrir gravação
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    </div>
                  )}
                  {delivery.documents.length > 0 && (
                    <div>
                      <label className="text-sm text-muted-foreground">Provas / Documentos</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {delivery.documents.map((doc) => {
                          const docType = documentTypeConfig[doc.type] || documentTypeConfig.OTHER;
                          return (
                            <a
                              key={doc.id}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline px-2 py-1 rounded border border-border"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {doc.title}
                              <span className="text-muted-foreground text-xs">({docType})</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {delivery.adminApprovalStatus === "PENDING_ADMIN_APPROVAL" && delivery.completion && (
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="text-base text-amber-800 dark:text-amber-400 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Aprovar entrega (admin)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Revise o feedback, o Fathom e as provas acima. Aprove para enviar ao cliente ou solicite alterações.
                  </p>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Nota (0 a 10)</label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        step={0.5}
                        value={adminScore}
                        onChange={(e) => setAdminScore(e.target.value)}
                        placeholder="Ex: 8.5"
                        className="w-24"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        disabled={approving}
                        onClick={() => handleAdminApprove("approve")}
                      >
                        {approving ? "..." : "Aprovar e enviar ao cliente"}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={approving}
                        onClick={() => handleAdminApprove("request_changes")}
                      >
                        Solicitar alterações
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {delivery.adminApprovalStatus === "APPROVED_BY_ADMIN" && (
              <Card className="border-green-200 bg-green-50/50 dark:border-green-500/30 dark:bg-green-500/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-300">
                      Aprovado pelo admin
                      {delivery.adminScore != null && (
                        <span className="ml-2 inline-flex items-center gap-0.5">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                          {delivery.adminScore}
                        </span>
                      )}
                    </p>
                    {delivery.adminApprovedBy && (
                      <p className="text-sm text-muted-foreground">
                        Por {delivery.adminApprovedBy.name}
                        {delivery.adminApprovedAt && ` em ${formatDateTime(delivery.adminApprovedAt)}`}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {delivery.clientApprovalStatus && (
              <Card className={`${
                delivery.clientApprovalStatus === "APPROVED"
                  ? "border-green-200 bg-green-50/50 dark:border-green-500/30 dark:bg-green-500/5"
                  : delivery.clientApprovalStatus === "CHANGES_REQUESTED"
                  ? "border-orange-200 bg-orange-50/50 dark:border-orange-500/30 dark:bg-orange-500/5"
                  : "border-yellow-200 bg-yellow-50/50 dark:border-yellow-500/30 dark:bg-yellow-500/5"
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    {delivery.clientApprovalStatus === "APPROVED" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : delivery.clientApprovalStatus === "CHANGES_REQUESTED" ? (
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="font-medium">
                      {delivery.clientApprovalStatus === "APPROVED"
                        ? "Aprovado pelo cliente"
                        : delivery.clientApprovalStatus === "CHANGES_REQUESTED"
                        ? "Cliente solicitou alterações"
                        : "Aguardando aprovação do cliente"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="dependencies" className="space-y-4">
            <DeliveryDependenciesList
              deliveryId={id}
              dependencies={delivery.dependencies}
              onRefresh={fetchDelivery}
            />
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Reuniões da Entrega</h3>
              <Button size="sm" onClick={() => setShowMeetingForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Reunião
              </Button>
            </div>

            {delivery.meetings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhuma reunião registrada</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowMeetingForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Reunião
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {delivery.meetings.map((meeting) => {
                  const meetingStatus = meetingStatusConfig[meeting.status] || meetingStatusConfig.SCHEDULED;
                  return (
                    <Card key={meeting.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{meeting.title}</h4>
                              <Badge variant={meetingStatus.variant} size="sm">
                                {meetingStatus.label}
                              </Badge>
                            </div>
                            
                            {meeting.description && (
                              <p className="text-sm text-muted-foreground mb-3">{meeting.description}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDateTime(meeting.date)}
                              </div>
                              
                              {meeting.duration && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  {meeting.duration} min
                                </div>
                              )}

                              {meeting.participants.length > 0 && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Users className="h-3.5 w-3.5" />
                                  {meeting.participants.length} participantes
                                </div>
                              )}
                            </div>

                            {(meeting.meetingLink || meeting.fathomLink) && (
                              <div className="flex items-center gap-3 mt-3">
                                {meeting.meetingLink && (
                                  <a
                                    href={meeting.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <Video className="h-3.5 w-3.5" />
                                    Link da reunião
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                {meeting.fathomLink && (
                                  <a
                                    href={meeting.fathomLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    Fathom
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            )}

                            {meeting.participants.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <label className="text-xs text-muted-foreground mb-2 block">Participantes</label>
                                <div className="flex flex-wrap gap-2">
                                  {meeting.participants.map((p) => (
                                    <div
                                      key={p.id}
                                      className={cn(
                                        "text-xs px-2 py-1 rounded-full flex items-center gap-1",
                                        p.attended ? "bg-emerald-100 text-emerald-700" : "bg-muted"
                                      )}
                                    >
                                      <User className="h-3 w-3" />
                                      {p.name}
                                      {p.attended && <CheckCircle className="h-3 w-3" />}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {meeting.notes && (
                              <div className="mt-3 pt-3 border-t">
                                <label className="text-xs text-muted-foreground mb-1 block">Notas</label>
                                <p className="text-sm">{meeting.notes}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingMeeting(meeting);
                                setShowMeetingForm(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMeeting(meeting.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Documentos da Entrega</h3>
              <Button size="sm" onClick={() => setShowDocumentForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Documento
              </Button>
            </div>

            {delivery.documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum documento registrado</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowDocumentForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Documento
                  </Button>
                </CardContent>
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
                                <Badge variant="secondary" size="sm" className="mt-1">
                                  {docType.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {doc.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {doc.uploadedBy ? `Por ${doc.uploadedBy.name} • ` : ""}
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

          <TabsContent value="comments" className="space-y-4">
            <DeliveryComments
              deliveryId={id}
              comments={delivery.comments}
              onRefresh={fetchDelivery}
              isClient={false}
              apiBasePath="/api/deliveries"
            />
          </TabsContent>
        </Tabs>
      </div>

      {showMeetingForm && (
        <DeliveryMeetingForm
          deliveryId={id}
          companyId={delivery.company.id}
          meeting={editingMeeting}
          onClose={() => {
            setShowMeetingForm(false);
            setEditingMeeting(null);
          }}
          onSuccess={() => {
            setShowMeetingForm(false);
            setEditingMeeting(null);
            fetchDelivery();
          }}
        />
      )}

      {showDocumentForm && (
        <DeliveryDocumentForm
          deliveryId={id}
          onClose={() => setShowDocumentForm(false)}
          onSuccess={() => {
            setShowDocumentForm(false);
            fetchDelivery();
          }}
        />
      )}
    </div>
  );
}
