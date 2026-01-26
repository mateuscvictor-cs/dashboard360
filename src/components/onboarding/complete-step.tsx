"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Building2, Shield, Headphones, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InviteType = "COMPANY_ADMIN" | "MEMBER_ADMIN" | "MEMBER_CS";

interface CompleteStepProps {
  type: InviteType;
  name: string;
  email: string;
  image: string | null;
  companyName?: string;
  isSubmitting: boolean;
  isComplete: boolean;
  error?: string;
  onSubmit: () => void;
  onGoToLogin: () => void;
}

const completionContent = {
  COMPANY_ADMIN: {
    icon: Building2,
    gradient: "from-emerald-500 to-teal-500",
    title: "Bem-vindo ao Painel!",
    subtitle: "Sua conta foi criada com sucesso",
    redirectLabel: "Acessar meu painel",
    description: "Você já pode acessar o painel para acompanhar suas entregas, métricas e muito mais.",
  },
  MEMBER_ADMIN: {
    icon: Shield,
    gradient: "from-purple-500 to-indigo-500",
    title: "Conta de Admin criada!",
    subtitle: "Você agora faz parte da equipe",
    redirectLabel: "Acessar painel admin",
    description: "Você já pode acessar o painel administrativo para gerenciar toda a operação.",
  },
  MEMBER_CS: {
    icon: Headphones,
    gradient: "from-blue-500 to-cyan-500",
    title: "Bem-vindo ao Time de CS!",
    subtitle: "Sua conta está pronta",
    redirectLabel: "Acessar minha área",
    description: "Você já pode acessar sua área para gerenciar sua carteira de clientes.",
  },
};

export function CompleteStep({
  type,
  name,
  email,
  image,
  companyName,
  isSubmitting,
  isComplete,
  error,
  onSubmit,
  onGoToLogin,
}: CompleteStepProps) {
  const content = completionContent[type];
  const Icon = content.icon;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isComplete) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  const getInitials = (userName: string) => {
    return userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isSubmitting) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 space-y-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="flex justify-center"
        >
          <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${content.gradient}`}>
            <Loader2 className="h-10 w-10 text-white" />
          </div>
        </motion.div>
        <div>
          <p className="font-semibold">Criando sua conta...</p>
          <p className="text-sm text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-4xl">😕</span>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold">Ops! Algo deu errado</h2>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
        <Button onClick={onSubmit} variant="outline" className="gap-2">
          Tentar novamente
        </Button>
      </motion.div>
    );
  }

  if (!isComplete) {
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
            Tudo pronto!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-muted-foreground"
          >
            Confira seus dados e finalize o cadastro
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border bg-muted/30 p-6 space-y-4"
        >
          <div className="flex items-center gap-4">
            {image ? (
              <img
                src={image}
                alt="Avatar"
                className="h-16 w-16 rounded-full object-cover border-2 border-background shadow-md"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-xl font-bold border-2 border-background shadow-md">
                {name ? getInitials(name) : <User className="h-8 w-8" />}
              </div>
            )}
            <div>
              <p className="font-semibold text-lg">{name}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tipo de acesso</span>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {type === "COMPANY_ADMIN" ? "Cliente" : type === "MEMBER_ADMIN" ? "Admin" : "CS Owner"}
                </span>
              </div>
            </div>
            {companyName && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Empresa</span>
                <span className="font-medium">{companyName}</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={onSubmit}
            size="lg"
            className={`w-full h-12 rounded-xl bg-gradient-to-r ${content.gradient} text-white shadow-lg hover:shadow-xl hover:brightness-110 transition-all gap-2`}
          >
            Criar minha conta
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 relative"
    >
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                y: -20, 
                x: Math.random() * 300 - 150,
                opacity: 1,
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{ 
                y: 400, 
                opacity: 0,
                rotate: Math.random() * 360
              }}
              transition={{ 
                duration: Math.random() * 2 + 1,
                delay: Math.random() * 0.5,
                ease: "easeOut"
              }}
              className={cn(
                "absolute w-3 h-3 rounded-sm",
                ["bg-primary", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-blue-500"][i % 5]
              )}
              style={{ left: `${Math.random() * 100}%` }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex justify-center"
      >
        <div className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${content.gradient} shadow-xl`}>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <CheckCircle2 className="h-12 w-12 text-white" />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ 
              background: `linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))`,
              opacity: 0.3
            }}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <h2 className="text-2xl font-bold">{content.title}</h2>
        <p className="text-muted-foreground">{content.subtitle}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-4"
      >
        {image ? (
          <img
            src={image}
            alt="Avatar"
            className="h-12 w-12 rounded-full object-cover border-2 border-background shadow-md"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold border-2 border-background shadow-md">
            {getInitials(name)}
          </div>
        )}
        <div className="text-left">
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-sm text-muted-foreground"
      >
        {content.description}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          onClick={onGoToLogin}
          size="lg"
          className={`w-full h-12 rounded-xl bg-gradient-to-r ${content.gradient} text-white shadow-lg hover:shadow-xl hover:brightness-110 transition-all gap-2`}
        >
          {content.redirectLabel}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
