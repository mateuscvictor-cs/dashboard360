"use client";

import { useEffect, useState, use } from "react";
import { DiagnosticWizard, type DiagnosticFormData } from "@/components/diagnostic";
import { Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PublicDiagnosticData {
  id: string;
  companyName: string;
  companyLogo: string | null;
  expiresAt: string | null;
  status: string;
  responsesCount: number;
}

type PageState = "loading" | "email-check" | "wizard" | "error" | "expired" | "already-responded" | "success";

export default function PublicDiagnosticPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [diagnostic, setDiagnostic] = useState<PublicDiagnosticData | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDiagnostic() {
      try {
        const response = await fetch(`/api/public/diagnostic/${token}`);
        if (!response.ok) {
          const data = await response.json();
          if (response.status === 410) {
            setPageState("expired");
            setError(data.error);
            return;
          }
          throw new Error(data.error || "Diagnóstico não encontrado");
        }
        const data = await response.json();
        setDiagnostic(data);
        setPageState("email-check");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setPageState("error");
      }
    }

    fetchDiagnostic();
  }, [token]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailCheck = async () => {
    if (!validateEmail(email)) {
      setEmailError("Digite um email válido");
      return;
    }

    setCheckingEmail(true);
    setEmailError(null);

    try {
      const response = await fetch(
        `/api/public/diagnostic/${token}?email=${encodeURIComponent(email)}`,
        { method: "HEAD" }
      );

      if (response.status === 409) {
        setPageState("already-responded");
        return;
      }

      if (response.status === 200) {
        setVerifiedEmail(email);
        setPageState("wizard");
      } else {
        setEmailError("Erro ao verificar email. Tente novamente.");
      }
    } catch {
      setEmailError("Erro ao verificar email. Tente novamente.");
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSubmit = async (formData: DiagnosticFormData) => {
    const response = await fetch(`/api/public/diagnostic/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: verifiedEmail,
        fullName: formData.identification.fullName,
        position: formData.identification.position,
        area: formData.identification.area,
        timeInCompany: formData.identification.timeInCompany,
        directlyInvolved: formData.identification.directlyInvolved,
        directManager: formData.identification.directManager,
        topFiveTasks: formData.routine.topFiveTasks,
        topTwoTimeTasks: formData.routine.topTwoTimeTasks,
        copyPasteTask: formData.routine.copyPasteTask,
        reworkArea: formData.routine.reworkArea,
        humanErrorArea: formData.routine.humanErrorArea,
        dependencyArea: formData.routine.dependencyArea,
        frustration: formData.routine.frustration,
        taskDetails: formData.taskDetails,
        systemsData: formData.systems,
        priorityData: formData.priority,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Erro ao enviar diagnóstico");
    }

    setPageState("success");
  };

  if (pageState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando diagnóstico...</p>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold">Diagnóstico não encontrado</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (pageState === "expired") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
          <div className="p-4 bg-muted rounded-full">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Link expirado</h1>
          <p className="text-muted-foreground">
            Este link de diagnóstico não está mais disponível.
            Entre em contato com a empresa para solicitar um novo link.
          </p>
        </div>
      </div>
    );
  }

  if (pageState === "already-responded") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Diagnóstico já respondido</h1>
          <p className="text-muted-foreground">
            O email <strong>{email}</strong> já foi utilizado para responder este diagnóstico.
            Obrigado pela participação!
          </p>
        </div>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
          <div className="p-4 bg-green-500/10 rounded-full">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-xl font-semibold">Diagnóstico enviado!</h1>
          <p className="text-muted-foreground">
            Obrigado por responder o diagnóstico de automação. Suas respostas ajudarão a
            identificar oportunidades de melhoria nos processos da empresa.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Você pode fechar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (pageState === "email-check") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {diagnostic?.companyLogo && (
              <img
                src={diagnostic.companyLogo}
                alt={diagnostic.companyName}
                className="h-12 w-auto mx-auto mb-4"
              />
            )}
            <CardTitle>Diagnóstico de Automação</CardTitle>
            <CardDescription>
              {diagnostic?.companyName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Digite seu email corporativo para iniciar o diagnóstico.
              Este email será usado para identificar sua resposta.
            </p>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleEmailCheck()}
              />
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleEmailCheck}
              disabled={checkingEmail || !email}
            >
              {checkingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Continuar"
              )}
            </Button>
            {diagnostic?.expiresAt && (
              <p className="text-xs text-muted-foreground text-center">
                Este link expira em{" "}
                {new Date(diagnostic.expiresAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:h-screen md:overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <DiagnosticWizard
        diagnosticId={diagnostic?.id || ""}
        companyName={diagnostic?.companyName || ""}
        onSubmit={handleSubmit}
        publicMode
        userEmail={verifiedEmail || undefined}
      />
    </div>
  );
}
