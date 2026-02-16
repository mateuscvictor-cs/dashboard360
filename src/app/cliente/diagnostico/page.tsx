"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  Clock,
  ArrowRight,
  CheckCircle2,
  Users,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import Link from "next/link";

interface DiagnosticResponse {
  id: string;
  fullName: string;
  position: string;
  area: string;
  email: string | null;
  completedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface DiagnosticForm {
  id: string;
  status: string;
  sentAt: string;
  expiresAt: string | null;
  targetAudience: string;
  company: {
    id: string;
    name: string;
  };
  responses: DiagnosticResponse[];
  _count: {
    responses: number;
  };
}

export default function DiagnosticListPage() {
  const [pendingDiagnostics, setPendingDiagnostics] = useState<DiagnosticForm[]>([]);
  const [companyDiagnostics, setCompanyDiagnostics] = useState<DiagnosticForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [expandedDiagnostic, setExpandedDiagnostic] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [pendingRes, companyRes, sessionRes] = await Promise.all([
          fetch("/api/cliente/diagnostic"),
          fetch("/api/cliente/diagnostic?all=true"),
          fetch("/api/auth/session"),
        ]);

        if (pendingRes.ok) {
          const data = await pendingRes.json();
          setPendingDiagnostics(data);
        }

        if (companyRes.ok) {
          const data = await companyRes.json();
          setCompanyDiagnostics(data);
        }

        if (sessionRes.ok) {
          const session = await sessionRes.json();
          setIsClient(session?.user?.role === "CLIENT");
        }
      } catch (error) {
        console.error("Error fetching diagnostics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Pendente</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary">Em andamento</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Completo</Badge>;
      case "ANALYZED":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30">Analisado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const hasPending = pendingDiagnostics.length > 0;
  const hasCompanyData = isClient && companyDiagnostics.length > 0;

  if (!hasPending && !hasCompanyData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="p-4 bg-muted rounded-full mb-4">
          <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Nenhum diagnóstico pendente</h2>
        <p className="text-muted-foreground max-w-md">
          Você não possui diagnósticos operacionais pendentes no momento. Quando houver
          um novo diagnóstico disponível, ele aparecerá aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Diagnósticos Operacionais</h1>
        <p className="text-muted-foreground">
          Complete os diagnósticos para ajudar na identificação de oportunidades de automação
        </p>
      </div>

      {isClient && hasCompanyData ? (
        <Tabs defaultValue={hasPending ? "pending" : "company"}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Pendentes
              {hasPending && (
                <Badge variant="secondary" className="text-xs">
                  {pendingDiagnostics.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              Respostas da Equipe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {hasPending ? (
              <div className="grid gap-4">
                {pendingDiagnostics.map((diagnostic, index) => (
                  <motion.div
                    key={diagnostic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-6 hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
                            <ClipboardList className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Diagnóstico Operacional</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>Enviado em {formatDate(diagnostic.sentAt)}</span>
                              {diagnostic.expiresAt && (
                                <>
                                  <span>·</span>
                                  <span>Expira em {formatDate(diagnostic.expiresAt)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {getStatusBadge(diagnostic.status)}
                          <Link href={`/cliente/diagnostico/${diagnostic.id}`}>
                            <Button className="gap-2">
                              Responder
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum diagnóstico pendente para você</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="company" className="mt-4">
            <div className="space-y-4">
              {companyDiagnostics.map((diagnostic) => (
                <Card key={diagnostic.id}>
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() =>
                      setExpandedDiagnostic(
                        expandedDiagnostic === diagnostic.id ? null : diagnostic.id
                      )
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                          <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Diagnóstico</span>
                            {getStatusBadge(diagnostic.status)}
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
                        {expandedDiagnostic === diagnostic.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
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
                        <div className="px-4 pb-4 border-t pt-4">
                          {diagnostic.responses.length > 0 ? (
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium">Respostas dos membros</h4>
                              {diagnostic.responses.map((response) => (
                                <div
                                  key={response.id}
                                  className="rounded-lg border bg-muted/30 p-3"
                                >
                                  <div className="flex items-center justify-between">
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
                                        <p className="text-xs text-muted-foreground">
                                          {response.user?.email || response.email}
                                        </p>
                                      </div>
                                    </div>
                                    {response.completedAt && (
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(response.completedAt)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Aguardando respostas dos membros</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid gap-4">
          {pendingDiagnostics.map((diagnostic, index) => (
            <motion.div
              key={diagnostic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
                      <ClipboardList className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Diagnóstico Operacional</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Enviado em {formatDate(diagnostic.sentAt)}</span>
                        {diagnostic.expiresAt && (
                          <>
                            <span>·</span>
                            <span>Expira em {formatDate(diagnostic.expiresAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getStatusBadge(diagnostic.status)}
                    <Link href={`/cliente/diagnostico/${diagnostic.id}`}>
                      <Button className="gap-2">
                        Responder
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
