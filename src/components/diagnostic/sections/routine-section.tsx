"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { MultiSelectQuestion, TextareaQuestion } from "../question-types";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface RoutineData {
  topFiveTasks: string[];
  topTwoTimeTasks: string[];
  copyPasteTask: string;
  reworkArea: string;
  humanErrorArea: string;
  dependencyArea: string;
  frustration: string;
}

interface RoutineSectionProps {
  data: RoutineData;
  onChange: (data: RoutineData) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function RoutineSection({
  data,
  onChange,
  onComplete,
  onBack,
}: RoutineSectionProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = [
    {
      id: "topFiveTasks",
      component: (
        <MultiSelectQuestion
          question="Quais são suas 5 tarefas mais repetidas?"
          subtitle="Liste as atividades que você faz com mais frequência no dia a dia"
          value={data.topFiveTasks}
          onChange={(value) => onChange({ ...data, topFiveTasks: value })}
          maxSelections={5}
          allowCustom
          customPlaceholder="Descreva uma tarefa..."
          required
        />
      ),
      isValid: () => data.topFiveTasks.length > 0,
    },
    {
      id: "topTwoTimeTasks",
      component: (
        <MultiSelectQuestion
          question="Quais são as 2 tarefas que mais consomem seu tempo por semana?"
          subtitle="Selecione das tarefas listadas anteriormente ou adicione novas"
          options={data.topFiveTasks.map((task) => ({
            value: task,
            label: task,
          }))}
          value={data.topTwoTimeTasks}
          onChange={(value) => onChange({ ...data, topTwoTimeTasks: value })}
          maxSelections={2}
          allowCustom
          customPlaceholder="Outra tarefa..."
          required
        />
      ),
      isValid: () => data.topTwoTimeTasks.length > 0,
    },
    {
      id: "copyPasteTask",
      component: (
        <TextareaQuestion
          question="Você realiza alguma tarefa de copiar e colar?"
          subtitle="Descreva o processo, de onde para onde você copia as informações"
          value={data.copyPasteTask}
          onChange={(value) => onChange({ ...data, copyPasteTask: value })}
          placeholder="Ex: Copio dados do Excel para o sistema ERP..."
        />
      ),
      isValid: () => true,
    },
    {
      id: "reworkArea",
      component: (
        <TextareaQuestion
          question="Onde você vê mais retrabalho no seu dia a dia?"
          subtitle="Processos que precisam ser refeitos ou corrigidos frequentemente"
          value={data.reworkArea}
          onChange={(value) => onChange({ ...data, reworkArea: value })}
          placeholder="Descreva as situações de retrabalho..."
        />
      ),
      isValid: () => true,
    },
    {
      id: "humanErrorArea",
      component: (
        <TextareaQuestion
          question="Onde você vê mais erros humanos acontecendo?"
          subtitle="Atividades propensas a falhas por distração ou complexidade"
          value={data.humanErrorArea}
          onChange={(value) => onChange({ ...data, humanErrorArea: value })}
          placeholder="Descreva as situações de erro..."
        />
      ),
      isValid: () => true,
    },
    {
      id: "dependencyArea",
      component: (
        <TextareaQuestion
          question="Onde você mais depende de outra pessoa para finalizar uma tarefa?"
          subtitle="Processos que ficam parados esperando aprovação ou informação de outros"
          value={data.dependencyArea}
          onChange={(value) => onChange({ ...data, dependencyArea: value })}
          placeholder="Ex: Preciso aguardar aprovação do gestor para..."
        />
      ),
      isValid: () => true,
    },
    {
      id: "frustration",
      component: (
        <TextareaQuestion
          question="O que mais te frustra na sua rotina hoje?"
          subtitle="Seja sincero, isso nos ajuda a priorizar as melhorias"
          value={data.frustration}
          onChange={(value) => onChange({ ...data, frustration: value })}
          placeholder="Descreva suas frustrações..."
          required
        />
      ),
      isValid: () => data.frustration.trim().length > 0,
    },
  ];

  const currentQ = questions[currentQuestion];
  const canAdvance = currentQ.isValid();
  const isLastQuestion = currentQuestion === questions.length - 1;
  const isFirstQuestion = currentQuestion === 0;

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete();
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (isFirstQuestion) {
      onBack();
    } else {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canAdvance && !e.shiftKey) {
      handleNext();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0" onKeyDown={handleKeyDown}>
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {currentQ.component}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6 border-t border-border/50 shrink-0">
        <Button
          variant="ghost"
          onClick={handlePrev}
          className="gap-2 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>

        <div className="flex items-center gap-2 order-first w-full justify-center sm:order-none sm:w-auto sm:flex-1">
          {questions.map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentQuestion
                  ? "bg-primary"
                  : index < currentQuestion
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
              animate={{
                scale: index === currentQuestion ? 1.2 : 1,
              }}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          disabled={!canAdvance}
          className="gap-2 shrink-0 flex-1 sm:flex-initial"
        >
          {isLastQuestion ? "Próxima Seção" : "Continuar"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
