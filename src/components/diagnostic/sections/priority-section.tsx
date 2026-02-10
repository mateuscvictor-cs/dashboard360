"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { TextareaQuestion, SelectQuestion, TextQuestion } from "../question-types";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

const WILLING_TO_TEST = [
  { value: "sim", label: "Sim, com prazer!" },
  { value: "nao", label: "Não, prefiro não participar" },
];

export interface PriorityData {
  taskToEliminate: string;
  willingToTest: string;
  bestTimeForTest: string;
  finalObservation: string;
}

interface PrioritySectionProps {
  data: PriorityData;
  onChange: (data: PriorityData) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function PrioritySection({
  data,
  onChange,
  onComplete,
  onBack,
}: PrioritySectionProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = [
    {
      id: "taskToEliminate",
      component: (
        <TextareaQuestion
          question="Se você pudesse eliminar uma única tarefa hoje, qual seria?"
          subtitle="Pense na que mais atrapalha sua produtividade"
          value={data.taskToEliminate}
          onChange={(value) => onChange({ ...data, taskToEliminate: value })}
          placeholder="Descreva a tarefa que você mais gostaria de eliminar..."
          required
        />
      ),
      isValid: () => data.taskToEliminate.trim().length > 0,
    },
    {
      id: "willingToTest",
      component: (
        <SelectQuestion
          question="Você toparia participar de um teste de 15 minutos para validar uma automação?"
          subtitle="Sua participação nos ajuda a criar soluções melhores"
          options={WILLING_TO_TEST}
          value={data.willingToTest}
          onChange={(value) => onChange({ ...data, willingToTest: value })}
          required
        />
      ),
      isValid: () => data.willingToTest.length > 0,
    },
    ...(data.willingToTest === "sim"
      ? [
          {
            id: "bestTimeForTest",
            component: (
              <TextQuestion
                question="Qual seria o melhor horário para uma reunião de 15 minutos?"
                subtitle="(Opcional) Nos ajude a agendar"
                value={data.bestTimeForTest}
                onChange={(value) => onChange({ ...data, bestTimeForTest: value })}
                placeholder="Ex: Terças e quintas às 14h"
              />
            ),
            isValid: () => true,
          },
        ]
      : []),
    {
      id: "finalObservation",
      component: (
        <TextareaQuestion
          question="Gostaria de adicionar alguma observação final?"
          subtitle="(Opcional) Qualquer informação adicional que possa nos ajudar"
          value={data.finalObservation}
          onChange={(value) => onChange({ ...data, finalObservation: value })}
          placeholder="Suas observações aqui..."
          rows={5}
        />
      ),
      isValid: () => true,
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
        <Button variant="ghost" onClick={handlePrev} className="gap-2 shrink-0">
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

        <Button onClick={handleNext} disabled={!canAdvance} className="gap-2 shrink-0 flex-1 sm:flex-initial">
          {isLastQuestion ? "Finalizar" : "Continuar"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
