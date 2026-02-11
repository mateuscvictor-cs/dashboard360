"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ClipboardCheck,
  Video,
  Settings,
  CheckCircle2,
  Clock,
  Circle,
  Package,
  Rocket,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

type OnboardingStepType = "GROUP_CREATION" | "DIAGNOSTIC_FORM" | "ONBOARDING_MEETING" | "CUSTOM";
type OnboardingStepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

interface OnboardingStep {
  id: string;
  type: OnboardingStepType;
  title: string;
  description?: string | null;
  status: OnboardingStepStatus;
  order: number;
  completedAt?: string | null;
  dueDate?: string | null;
}

interface Delivery {
  id: string;
  title: string;
  status: string;
  progress: number;
}

interface OnboardingTimelineProps {
  steps: OnboardingStep[];
  deliveries?: Delivery[];
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
}

const stepIcons: Record<OnboardingStepType, typeof Users> = {
  GROUP_CREATION: Users,
  DIAGNOSTIC_FORM: ClipboardCheck,
  ONBOARDING_MEETING: Video,
  CUSTOM: Settings,
};

const stepLabels: Record<OnboardingStepType, string> = {
  GROUP_CREATION: "Criação de Grupo",
  DIAGNOSTIC_FORM: "Diagnóstico",
  ONBOARDING_MEETING: "Reunião de Onboarding",
  CUSTOM: "Personalizado",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const lineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

export function OnboardingTimeline({ steps, deliveries = [], progress }: OnboardingTimelineProps) {
  const allOnboardingCompleted = steps.length > 0 && steps.every((s) => s.status === "COMPLETED" || s.status === "SKIPPED");
  const activeDeliveries = deliveries.filter((d) => d.status !== "COMPLETED").slice(0, 3);
  const currentStep = steps.find((s) => s.status === "IN_PROGRESS");

  if (steps.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-6 mb-6 overflow-hidden relative"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
            >
              <Rocket className="h-6 w-6 text-primary" />
            </motion.div>
            <div>
              <h3 className="font-semibold">Jornada</h3>
              <p className="text-sm text-muted-foreground">
                Sua jornada será configurada em breve
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-2">
            <Clock className="h-3 w-3" />
            Aguardando
          </Badge>
        </div>
      </motion.div>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="rounded-2xl border bg-gradient-to-br from-card to-muted/20 p-6 mb-6 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg"
            >
              <Rocket className="h-6 w-6 text-primary-foreground" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-lg">Jornada</h3>
              <p className="text-sm text-muted-foreground">
                {progress.completed} de {progress.total} etapas concluídas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-info to-success bg-clip-text text-transparent">
                  {progress.percentage}%
                </span>
              </div>
              <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-info to-success rounded-full relative"
                >
                  <motion.div
                    className="absolute inset-0 bg-white/30"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 1 }}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative"
        >
          <div className="absolute top-8 left-8 right-8 h-1 bg-muted rounded-full" />
          
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress.percentage / 100 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
            style={{ transformOrigin: "left" }}
            className="absolute top-8 left-8 right-8 h-1 bg-gradient-to-r from-success via-success to-info rounded-full"
          />

          <div className="flex justify-between relative">
            {steps.map((step, index) => {
              const Icon = stepIcons[step.type];
              const isCompleted = step.status === "COMPLETED";
              const isInProgress = step.status === "IN_PROGRESS";
              const isSkipped = step.status === "SKIPPED";

              return (
                <motion.div
                  key={step.id}
                  variants={itemVariants}
                  className="flex flex-col items-center relative z-10"
                  style={{ flex: 1 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative cursor-pointer"
                      >
                        {isInProgress && (
                          <motion.div
                            variants={pulseVariants}
                            animate="pulse"
                            className="absolute inset-0 rounded-full bg-info"
                            style={{ margin: -4 }}
                          />
                        )}

                        <motion.div
                          className={cn(
                            "relative flex h-16 w-16 items-center justify-center rounded-full border-4 shadow-lg transition-colors",
                            isCompleted && "bg-success border-success/50",
                            isInProgress && "bg-info border-info/50",
                            isSkipped && "bg-muted border-muted-foreground/20",
                            !isCompleted && !isInProgress && !isSkipped && "bg-card border-muted-foreground/30"
                          )}
                        >
                          <AnimatePresence mode="wait">
                            {isCompleted ? (
                              <motion.div
                                key="check"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >
                                <CheckCircle2 className="h-7 w-7 text-white" />
                              </motion.div>
                            ) : isInProgress ? (
                              <motion.div
                                key="progress"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                              >
                                <Icon className="h-7 w-7 text-white" />
                              </motion.div>
                            ) : (
                              <motion.div key="icon">
                                <Icon className={cn(
                                  "h-7 w-7",
                                  isSkipped ? "text-muted-foreground/50" : "text-muted-foreground"
                                )} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>

                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className={cn(
                            "absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold border-2 border-card",
                            isCompleted && "bg-success text-white",
                            isInProgress && "bg-info text-white",
                            !isCompleted && !isInProgress && "bg-muted text-muted-foreground"
                          )}
                        >
                          {index + 1}
                        </motion.div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-[280px] p-3 bg-popover text-popover-foreground border border-border shadow-md"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary shrink-0" />
                          <p className="font-semibold text-foreground">{step.title || stepLabels[step.type]}</p>
                        </div>
                        {step.description && (
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        )}
                        <div className="pt-1 border-t border-border">
                          {isCompleted && step.completedAt && (
                            <p className="text-xs text-success flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              Concluído em {new Date(step.completedAt).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                          {isInProgress && (
                            <p className="text-xs text-info flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              Em andamento
                            </p>
                          )}
                          {step.dueDate && !isCompleted && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              Prazo: {new Date(step.dueDate).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="mt-3 text-center max-w-[120px]"
                  >
                    <p className={cn(
                      "text-sm font-medium leading-tight",
                      isCompleted && "text-success",
                      isInProgress && "text-info",
                      isSkipped && "text-muted-foreground/50",
                      !isCompleted && !isInProgress && !isSkipped && "text-muted-foreground"
                    )}>
                      {step.title || stepLabels[step.type]}
                    </p>
                  </motion.div>
                </motion.div>
              );
            })}

            {allOnboardingCompleted && activeDeliveries.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center relative z-10"
                style={{ flex: 1 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="relative cursor-pointer"
                    >
                      <motion.div
                        animate={{ 
                          boxShadow: [
                            "0 0 0 0 rgba(59, 130, 246, 0)",
                            "0 0 0 10px rgba(59, 130, 246, 0.1)",
                            "0 0 0 0 rgba(59, 130, 246, 0)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-info to-primary border-4 border-info/30 shadow-lg"
                      >
                        <Package className="h-7 w-7 text-white" />
                      </motion.div>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-popover text-popover-foreground border border-border shadow-md">
                    <p className="font-semibold text-foreground">Entregas em andamento</p>
                    <p className="text-xs text-muted-foreground">{activeDeliveries.length} entregas ativas</p>
                  </TooltipContent>
                </Tooltip>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-3 text-center"
                >
                  <p className="text-sm font-medium text-info">Entregas</p>
                  <p className="text-xs text-muted-foreground">{activeDeliveries.length} ativas</p>
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {currentStep && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="mt-6 pt-4 border-t overflow-hidden"
            >
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-info/10 border border-info/20"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-info"
                >
                  <Clock className="h-5 w-5 text-white" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Etapa atual</p>
                  <p className="text-sm text-muted-foreground">{currentStep.title || stepLabels[currentStep.type]}</p>
                </div>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ArrowRight className="h-5 w-5 text-info" />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
}
