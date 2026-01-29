"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  User,
  RefreshCw,
  ClipboardList,
  Database,
  Target,
  Check,
} from "lucide-react";
import {
  IdentificationSection,
  RoutineSection,
  TaskDetailSection,
  SystemsSection,
  PrioritySection,
  type TaskDetail,
  type SystemsData,
  type PriorityData,
} from "./sections";
import { DiagnosticComplete } from "./diagnostic-complete";

interface DiagnosticFormData {
  identification: {
    fullName: string;
    position: string;
    area: string;
    timeInCompany: string;
    directlyInvolved: string;
    directManager: string;
  };
  routine: {
    topFiveTasks: string[];
    topTwoTimeTasks: string[];
    copyPasteTask: string;
    reworkArea: string;
    humanErrorArea: string;
    dependencyArea: string;
    frustration: string;
  };
  taskDetails: TaskDetail[];
  systems: SystemsData;
  priority: PriorityData;
}

const initialFormData: DiagnosticFormData = {
  identification: {
    fullName: "",
    position: "",
    area: "",
    timeInCompany: "",
    directlyInvolved: "",
    directManager: "",
  },
  routine: {
    topFiveTasks: [],
    topTwoTimeTasks: [],
    copyPasteTask: "",
    reworkArea: "",
    humanErrorArea: "",
    dependencyArea: "",
    frustration: "",
  },
  taskDetails: [],
  systems: {
    dailyTools: [],
    indispensableSystems: [],
    mainDataLocation: [],
    hasIntegration: "",
    integrationDetails: "",
    itBlocksAccess: "",
    itBlocksDetails: "",
  },
  priority: {
    taskToEliminate: "",
    willingToTest: "",
    bestTimeForTest: "",
    finalObservation: "",
  },
};

const SECTIONS = [
  { id: "identification", title: "Identificação", icon: User },
  { id: "routine", title: "Rotina", icon: RefreshCw },
  { id: "taskDetails", title: "Tarefas", icon: ClipboardList },
  { id: "systems", title: "Sistemas", icon: Database },
  { id: "priority", title: "Prioridade", icon: Target },
];

interface DiagnosticWizardProps {
  diagnosticId: string;
  companyName?: string;
  onSubmit: (data: DiagnosticFormData) => Promise<void>;
  publicMode?: boolean;
  userEmail?: string;
}

export function DiagnosticWizard({
  diagnosticId,
  companyName,
  onSubmit,
  publicMode,
  userEmail,
}: DiagnosticWizardProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<DiagnosticFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSectionComplete = async () => {
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection((prev) => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
        setIsComplete(true);
      } catch (error) {
        console.error("Error submitting diagnostic:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSectionBack = () => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
    }
  };

  if (isComplete) {
    return <DiagnosticComplete companyName={companyName} publicMode={publicMode} />;
  }

  const renderSection = () => {
    switch (currentSection) {
      case 0:
        return (
          <IdentificationSection
            data={formData.identification}
            onChange={(data) =>
              setFormData((prev) => ({ ...prev, identification: data }))
            }
            onComplete={handleSectionComplete}
          />
        );
      case 1:
        return (
          <RoutineSection
            data={formData.routine}
            onChange={(data) =>
              setFormData((prev) => ({ ...prev, routine: data }))
            }
            onComplete={handleSectionComplete}
            onBack={handleSectionBack}
          />
        );
      case 2:
        return (
          <TaskDetailSection
            data={formData.taskDetails}
            onChange={(data) =>
              setFormData((prev) => ({ ...prev, taskDetails: data }))
            }
            onComplete={handleSectionComplete}
            onBack={handleSectionBack}
          />
        );
      case 3:
        return (
          <SystemsSection
            data={formData.systems}
            onChange={(data) =>
              setFormData((prev) => ({ ...prev, systems: data }))
            }
            onComplete={handleSectionComplete}
            onBack={handleSectionBack}
          />
        );
      case 4:
        return (
          <PrioritySection
            data={formData.priority}
            onChange={(data) =>
              setFormData((prev) => ({ ...prev, priority: data }))
            }
            onComplete={handleSectionComplete}
            onBack={handleSectionBack}
          />
        );
      default:
        return null;
    }
  };

  const progress = ((currentSection + 1) / SECTIONS.length) * 100;

  return (
    <div className="flex h-full bg-background">
      <div className="hidden md:flex flex-col w-64 border-r border-border/50 bg-muted/30">
        <div className="p-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Diagnóstico Operacional
          </h2>
          {companyName && (
            <p className="mt-1 text-sm text-muted-foreground truncate">
              {companyName}
            </p>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {SECTIONS.map((section, index) => {
            const Icon = section.icon;
            const isActive = index === currentSection;
            const isCompleted = index < currentSection;

            return (
              <button
                key={section.id}
                type="button"
                disabled={!isCompleted && !isActive}
                onClick={() => isCompleted && setCurrentSection(index)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-all",
                  isActive && "bg-primary/10 text-primary",
                  isCompleted && "hover:bg-muted cursor-pointer",
                  !isActive && !isCompleted && "text-muted-foreground cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    !isActive && !isCompleted && "border-muted-foreground/30"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="font-medium">{section.title}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/80"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="md:hidden p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {SECTIONS[currentSection].title}
            </h2>
            <span className="text-sm text-muted-foreground">
              {currentSection + 1} / {SECTIONS.length}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/80"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 p-8 bg-card rounded-2xl shadow-xl"
          >
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary/30 rounded-full" />
              <motion.div
                className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <p className="text-lg font-medium">Enviando diagnóstico...</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export type { DiagnosticFormData };
