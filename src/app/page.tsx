"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    console.log("1. handleLogin iniciado");
    
    if (!email || !password) {
      setError("Preencha todos os campos");
      return;
    }

    console.log("2. Campos preenchidos, iniciando login...");
    setLoading(true);
    setError("");

    try {
      console.log("3. Chamando signIn.email...");
      const result = await signIn.email({
        email,
        password,
      });
      console.log("4. Resultado do signIn:", result);

      if (result.error) {
        console.log("5. Erro no resultado:", result.error);
        if (result.error.message?.includes("verify")) {
          setError("Email não verificado. Verifique sua caixa de entrada.");
        } else if (result.error.message?.includes("credentials") || result.error.message?.includes("Invalid")) {
          setError("Email ou senha incorretos.");
        } else {
          setError(result.error.message || "Erro ao fazer login.");
        }
        setLoading(false);
        return;
      }

      if (result.data) {
        console.log("6. Login bem sucedido, redirecionando...");
        window.location.replace("/admin");
        return;
      }
    } catch (err) {
      console.error("ERRO CATCH:", err);
      setError("Erro ao conectar. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-background/95 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <Image
              src="/logo-vanguardia.png"
              alt="Vanguardia"
              width={180}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Vanguardia 360</CardTitle>
            <CardDescription className="text-base mt-2">
              Painel de Inteligência
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-lg bg-danger-light border border-danger/20 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 rounded-xl border bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Senha</label>
                <Link 
                  href="/esqueci-senha" 
                  className="text-xs text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && email && password) {
                      handleLogin();
                    }
                  }}
                  className="w-full h-11 rounded-xl border bg-background pl-10 pr-12 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-brand text-white shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:brightness-110 transition-all"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Ao entrar, você concorda com nossos{" "}
              <a href="#" className="text-primary hover:underline">Termos de Uso</a>
              {" "}e{" "}
              <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
        © 2026 Vanguardia. Todos os direitos reservados.
      </div>
    </div>
  );
}
