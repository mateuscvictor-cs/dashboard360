"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, Check, X, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AccountStepProps {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  onNameChange: (name: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (confirmPassword: string) => void;
  onNext: () => void;
  onBack: () => void;
  error?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Fraca", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Razoável", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Boa", color: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Forte", color: "bg-emerald-500" };
  return { score, label: "Muito forte", color: "bg-emerald-600" };
}

export function AccountStep({
  email,
  name,
  password,
  confirmPassword,
  onNameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onNext,
  onBack,
  error,
}: AccountStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ name: false, password: false, confirmPassword: false });

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isValidPassword = password.length >= 8;
  const isValidName = name.trim().length >= 2;

  const canProceed = isValidName && isValidPassword && passwordsMatch;

  const requirements = [
    { met: password.length >= 8, text: "Mínimo 8 caracteres" },
    { met: /[A-Z]/.test(password), text: "Uma letra maiúscula" },
    { met: /[0-9]/.test(password), text: "Um número" },
    { met: passwordsMatch, text: "Senhas coincidem" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold"
        >
          Crie sua conta
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-muted-foreground"
        >
          Defina suas credenciais de acesso
        </motion.p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium">Email</label>
          <div className="relative">
            <div className="w-full h-11 rounded-xl border bg-muted/50 px-4 flex items-center text-sm text-muted-foreground">
              {email}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Email definido pelo convite</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium">Nome completo</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Digite seu nome completo"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              className={cn(
                "w-full h-11 rounded-xl border bg-background pl-10 pr-4 text-sm outline-none transition-all",
                "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                touched.name && !isValidName && "border-destructive focus:border-destructive focus:ring-destructive/20"
              )}
            />
          </div>
          {touched.name && !isValidName && (
            <p className="text-xs text-destructive">Nome deve ter pelo menos 2 caracteres</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
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
          
          {password.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", passwordStrength.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className={cn("text-xs font-medium", passwordStrength.color.replace("bg-", "text-"))}>
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium">Confirmar senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
              className={cn(
                "w-full h-11 rounded-xl border bg-background pl-10 pr-10 text-sm outline-none transition-all",
                "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                touched.confirmPassword && confirmPassword && !passwordsMatch && "border-destructive focus:border-destructive"
              )}
            />
            {confirmPassword && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {passwordsMatch ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <X className="h-4 w-4 text-destructive" />
                )}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl bg-muted/50 p-4"
        >
          <p className="text-xs font-medium text-muted-foreground mb-3">Requisitos da senha:</p>
          <div className="grid grid-cols-2 gap-2">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full transition-colors",
                  req.met ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {req.met ? <Check className="h-2.5 w-2.5" /> : <span className="text-[10px]">•</span>}
                </div>
                <span className={cn(req.met ? "text-foreground" : "text-muted-foreground")}>
                  {req.text}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-3"
      >
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="flex-1 h-12 rounded-xl gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
          className="flex-1 h-12 rounded-xl bg-gradient-brand text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all gap-2"
        >
          Continuar
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
