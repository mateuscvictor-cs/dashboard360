"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, XCircle, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function VerificarEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "resend">("loading");
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (token && email) {
      verifyEmail();
    } else if (email) {
      setStatus("resend");
    } else {
      setStatus("error");
      setError("Link inválido");
    }
  }, [token, email]);

  const verifyEmail = async () => {
    if (!token || !email) return;

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });

      if (response.ok) {
        setStatus("success");
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Erro na verificação");
      }
    } catch {
      setStatus("error");
      setError("Link expirado ou inválido.");
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setResendLoading(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendSuccess(true);
      } else {
        throw new Error("Erro ao reenviar");
      }
    } catch {
      setError("Erro ao reenviar email. Tente novamente.");
    } finally {
      setResendLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        
        <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-background/95 backdrop-blur-xl">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
            <p className="text-sm text-muted-foreground">Verificando seu email...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        
        <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-background/95 backdrop-blur-xl">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Email verificado!</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Sua conta foi verificada com sucesso. Você será redirecionado para o login.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "resend") {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        
        <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-background/95 backdrop-blur-xl">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <Image
                src="/logo-vanguardia.png"
                alt="Vanguardia"
                width={140}
                height={36}
                className="h-9 w-auto"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Verifique seu email</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Enviamos um link de verificação para <span className="font-medium">{email}</span>.
                Verifique sua caixa de entrada e spam.
              </p>
            </div>

            {resendSuccess ? (
              <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-sm text-success">
                Email reenviado com sucesso!
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={resendLoading}
                className="gap-2"
              >
                {resendLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Reenviando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Reenviar email
                  </>
                )}
              </Button>
            )}

            <Link href="/" className="block">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar para login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-background/95 backdrop-blur-xl">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
              <XCircle className="h-8 w-8 text-danger" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Erro na verificação</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {error}
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="mt-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <VerificarEmailContent />
    </Suspense>
  );
}
