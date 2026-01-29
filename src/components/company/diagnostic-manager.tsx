"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Send,
  Eye,
  Sparkles,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Brain,
  Link as LinkIcon,
  Copy,
  Check,
  Mail,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DiagnosticResponse {
  id: string;
  fullName: string;
  position: string;
  area: string;
  completedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface SuggestedItem {
  name?: string;
}

interface DiagnosticAnalysis {
  id: string;
  summary: string;
  suggestedIPCs: SuggestedItem[];
  suggestedAutomations: SuggestedItem[];
  priorityTasks: unknown[];
  estimatedSavings: unknown;
  presentationPrompt: string | null;
  analyzedAt: string;
}

interface DiagnosticForm {
  id: string;
  status: string;
  sentAt: string;
  expiresAt: string | null;
  publicToken: string | null;
  targetAudience: "ALL" | "CLIENT_ONLY" | "MEMBER_ONLY";
  responses: DiagnosticResponse[];
  aiAnalysis: DiagnosticAnalysis | null;
  _count: {
    responses: number;
  };
}

type TargetAudience = "ALL" | "CLIENT_ONLY" | "MEMBER_ONLY";

const AUDIENCE_LABELS: Record<TargetAudience, string> = {
  ALL: "Todos",
  CLIENT_ONLY: "Apenas Gestores",
  MEMBER_ONLY: "Apenas Membros",
};

interface DiagnosticManagerProps {
  companyId: string;
}

export function DiagnosticManager({ companyId }: DiagnosticManagerProps) {
  const pathname = usePathname();
  const [diagnostics, setDiagnostics] = useState<DiagnosticForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [expandedDiagnostic, setExpandedDiagnostic] = useState<string | null>(null);
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("ALL");
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [createdDiagnosticUrl, setCreatedDiagnosticUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [generatingToken, setGeneratingToken] = useState<string | null>(null);

  const isAdmin = pathname?.startsWith("/admin");

  const getAnalyticsUrl = (diagnosticId: string) => {
    return isAdmin ? `/admin/diagnosticos/${diagnosticId}` : `/cs/diagnosticos/${diagnosticId}`;
  };

  useEffect(() => {
    fetchDiagnostics();
  }, [companyId]);

  const fetchDiagnostics = async () => {
    try {
      const response = await fetch(`/api/diagnostics/company/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setDiagnostics(data);
      }
    } catch (error) {
      console.error("Error fetching diagnostics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendDiagnostic = async () => {
    setSending(true);
    try {
      const response = await fetch("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, targetAudience }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.publicUrl) {
          setCreatedDiagnosticUrl(data.publicUrl);
          setShowLinkDialog(true);
        }
        await fetchDiagnostics();
      }
    } catch (error) {
      console.error("Error sending diagnostic:", error);
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = async (url: string, diagnosticId?: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(diagnosticId || "dialog");
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  const getPublicUrl = (token: string | null) => {
    if (!token) return null;
    const baseUrl = window.location.origin;
    return `${baseUrl}/diagnostico/${token}`;
  };

  const handleGenerateToken = async (diagnosticId: string) => {
    setGeneratingToken(diagnosticId);
    try {
      const response = await fetch(`/api/diagnostics/${diagnosticId}/generate-token`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setCreatedDiagnosticUrl(data.publicUrl);
        setShowLinkDialog(true);
        await fetchDiagnostics();
      }
    } catch (error) {
      console.error("Error generating token:", error);
    } finally {
      setGeneratingToken(null);
    }
  };

  const handleAnalyze = async (diagnosticId: string) => {
    setAnalyzing(diagnosticId);
    try {
      const response = await fetch(`/api/diagnostics/${diagnosticId}/analyze`, {
        method: "POST",
      });

      if (response.ok) {
        await fetchDiagnostics();
      }
    } catch (error) {
      console.error("Error analyzing diagnostic:", error);
    } finally {
      setAnalyzing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pendente</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Em andamento</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Completo</Badge>;
      case "ANALYZED":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">Analisado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle>Diagnóstico Operacional</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={targetAudience}
              onValueChange={(v) => setTargetAudience(v as TargetAudience)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="CLIENT_ONLY">Apenas Gestores</SelectItem>
                <SelectItem value="MEMBER_ONLY">Apenas Membros</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleSendDiagnostic}
              disabled={sending}
              className="gap-2"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Disparar
            </Button>
          </div>
        </div>
        <CardDescription>
          Envie diagnósticos para mapear tarefas repetitivas e oportunidades de automação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {diagnostics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum diagnóstico enviado</p>
            <p className="text-xs mt-1">Clique em "Disparar Diagnóstico" para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {diagnostics.map((diagnostic) => (
              <motion.div
                key={diagnostic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border bg-card"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() =>
                    setExpandedDiagnostic(
                      expandedDiagnostic === diagnostic.id ? null : diagnostic.id
                    )
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                      <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Diagnóstico</span>
                        {getStatusBadge(diagnostic.status)}
                        <Badge variant="outline" className="text-xs">
                          {AUDIENCE_LABELS[diagnostic.targetAudience] || "Todos"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(diagnostic.sentAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {diagnostic._count.responses} respostas
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {diagnostic.publicToken ? (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = getPublicUrl(diagnostic.publicToken);
                          if (url) handleCopyLink(url, diagnostic.id);
                        }}
                        className="gap-2"
                      >
                        {copied === diagnostic.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copied === diagnostic.id ? "Copiado!" : "Copiar Link"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateToken(diagnostic.id);
                        }}
                        disabled={generatingToken === diagnostic.id}
                        className="gap-2"
                      >
                        {generatingToken === diagnostic.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LinkIcon className="h-4 w-4" />
                        )}
                        {generatingToken === diagnostic.id ? "Gerando..." : "Gerar Link"}
                      </Button>
                    )}
                    <Link
                      href={getAnalyticsUrl(diagnostic.id)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button size="sm" variant="outline" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Ver Análise
                      </Button>
                    </Link>
                    {diagnostic._count.responses > 0 && !diagnostic.aiAnalysis && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyze(diagnostic.id);
                        }}
                        disabled={analyzing === diagnostic.id}
                        className="gap-2"
                      >
                        {analyzing === diagnostic.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Brain className="h-4 w-4" />
                        )}
                        Analisar com IA
                      </Button>
                    )}
                    {expandedDiagnostic === diagnostic.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedDiagnostic === diagnostic.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4 border-t pt-4">
                        {diagnostic.aiAnalysis && (
                          <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-4 space-y-4">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-purple-500" />
                              <span className="font-medium text-purple-600">Análise IA</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(diagnostic.aiAnalysis.analyzedAt)}
                              </span>
                            </div>
                            <p className="text-sm">{diagnostic.aiAnalysis.summary}</p>

                            {Array.isArray(diagnostic.aiAnalysis.suggestedIPCs) &&
                              diagnostic.aiAnalysis.suggestedIPCs.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium mb-2">IPCs Sugeridos</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {diagnostic.aiAnalysis.suggestedIPCs.map((ipc, index) => (
                                      <Badge key={index} variant="secondary">
                                        {ipc.name || `IPC ${index + 1}`}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {Array.isArray(diagnostic.aiAnalysis.suggestedAutomations) &&
                              diagnostic.aiAnalysis.suggestedAutomations.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Automações Sugeridas</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {diagnostic.aiAnalysis.suggestedAutomations.map((automation, index) => (
                                      <Badge key={index} variant="outline">
                                        {automation.name || `Automação ${index + 1}`}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {diagnostic.responses.length > 0 ? (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Respostas</h4>
                            {diagnostic.responses.map((response) => (
                              <div
                                key={response.id}
                                className="rounded-lg border bg-muted/30 p-3"
                              >
                                <div
                                  className="flex items-center justify-between cursor-pointer"
                                  onClick={() =>
                                    setExpandedResponse(
                                      expandedResponse === response.id ? null : response.id
                                    )
                                  }
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                                      <span className="text-sm font-medium text-primary">
                                        {response.fullName?.charAt(0) || "?"}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{response.fullName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {response.position} · {response.area}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {response.completedAt && (
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(response.completedAt)}
                                      </span>
                                    )}
                                    <Button size="sm" variant="ghost">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Aguardando respostas</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            Diagnóstico criado!
          </DialogTitle>
          <DialogDescription>
            Compartilhe o link abaixo com os colaboradores que devem responder o diagnóstico.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg overflow-hidden">
            <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-mono truncate flex-1 min-w-0">
              {createdDiagnosticUrl}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0"
              onClick={() => createdDiagnosticUrl && handleCopyLink(createdDiagnosticUrl, "dialog")}
            >
              {copied === "dialog" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Os usuários da empresa com acesso ao sistema já foram notificados automaticamente.
              Use o link acima para convidar colaboradores que não possuem conta.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setShowLinkDialog(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
