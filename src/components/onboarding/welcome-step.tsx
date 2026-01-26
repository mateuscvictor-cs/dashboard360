"use client";

import { motion } from "framer-motion";
import { Building2, Shield, Headphones, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type InviteType = "COMPANY_ADMIN" | "MEMBER_ADMIN" | "MEMBER_CS";

interface WelcomeStepProps {
  type: InviteType;
  companyName?: string;
  onNext: () => void;
}

const welcomeContent = {
  COMPANY_ADMIN: {
    icon: Building2,
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/10 to-teal-500/10",
    title: "Bem-vindo ao Painel",
    subtitle: "Acompanhe suas entregas e métricas em tempo real",
    features: [
      "Visualize o progresso das suas entregas",
      "Acompanhe métricas de sucesso",
      "Responda pesquisas de satisfação",
      "Acesse documentos e materiais",
    ],
  },
  MEMBER_ADMIN: {
    icon: Shield,
    gradient: "from-purple-500 to-indigo-500",
    bgGradient: "from-purple-500/10 to-indigo-500/10",
    title: "Bem-vindo à Equipe",
    subtitle: "Você foi convidado como Administrador",
    features: [
      "Gerencie empresas e usuários",
      "Acompanhe métricas de toda operação",
      "Configure squads e CS Owners",
      "Acesse insights de IA",
    ],
  },
  MEMBER_CS: {
    icon: Headphones,
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10",
    title: "Bem-vindo ao Time de CS",
    subtitle: "Você foi convidado como CS Owner",
    features: [
      "Gerencie sua carteira de clientes",
      "Acompanhe health scores",
      "Registre atividades e interações",
      "Receba insights personalizados",
    ],
  },
};

export function WelcomeStep({ type, companyName, onNext }: WelcomeStepProps) {
  const content = welcomeContent[type];
  const Icon = content.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="flex justify-center"
      >
        <div className={`relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${content.gradient} shadow-xl`}>
          <Icon className="h-12 w-12 text-white" />
          <motion.div
            className="absolute inset-0 rounded-3xl bg-white/20"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>

      <div className="space-y-3">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold"
        >
          {content.title}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground"
        >
          {content.subtitle}
        </motion.p>

        {type === "COMPANY_ADMIN" && companyName && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted"
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{companyName}</span>
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`rounded-2xl bg-gradient-to-br ${content.bgGradient} p-6`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">O que você poderá fazer:</span>
        </div>
        <ul className="space-y-3 text-left">
          {content.features.map((feature, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-center gap-3 text-sm"
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${content.gradient}`}>
                <span className="text-xs text-white font-bold">{index + 1}</span>
              </div>
              {feature}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <Button
          onClick={onNext}
          size="lg"
          className={`w-full h-12 rounded-xl bg-gradient-to-r ${content.gradient} text-white shadow-lg hover:shadow-xl hover:brightness-110 transition-all gap-2`}
        >
          Começar
          <ArrowRight className="h-5 w-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
