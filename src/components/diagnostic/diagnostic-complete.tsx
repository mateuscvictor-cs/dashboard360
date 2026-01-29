"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DiagnosticCompleteProps {
  companyName?: string;
  publicMode?: boolean;
}

export function DiagnosticComplete({ companyName, publicMode }: DiagnosticCompleteProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[500px] text-center px-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative bg-gradient-to-br from-primary to-primary/80 p-6 rounded-full">
          <CheckCircle2 className="h-16 w-16 text-primary-foreground" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 space-y-4"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Diagnóstico Concluído!
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Obrigado por completar o diagnóstico operacional
          {companyName && ` da ${companyName}`}. Suas respostas serão analisadas pela nossa equipe.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 grid gap-4 max-w-lg w-full"
      >
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-medium">Análise com IA</p>
            <p className="text-sm text-muted-foreground">
              Suas respostas serão analisadas para identificar oportunidades de automação
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-medium">Próximos Passos</p>
            <p className="text-sm text-muted-foreground">
              {publicMode
                ? "O responsável pela sua empresa será notificado sobre sua participação"
                : "Em breve você receberá recomendações personalizadas de agentes e automações"}
            </p>
          </div>
        </div>
      </motion.div>

      {publicMode ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <p className="text-sm text-muted-foreground">
            Você pode fechar esta página.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Link href="/cliente/dashboard">
            <Button size="lg" className="gap-2">
              Voltar ao Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
