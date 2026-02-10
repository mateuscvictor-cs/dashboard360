"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { TextQuestion, SelectQuestion } from "../question-types";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

const AREAS = [
  { value: "administrativo", label: "Administrativo" },
  { value: "financeiro", label: "Financeiro" },
  { value: "comercial", label: "Comercial" },
  { value: "operacoes", label: "Operações" },
  { value: "atendimento", label: "Atendimento" },
  { value: "marketing", label: "Marketing" },
  { value: "rh", label: "RH" },
  { value: "ti", label: "TI" },
  { value: "diretoria", label: "Diretoria" },
];

const TIME_IN_COMPANY = [
  { value: "0-6m", label: "0 a 6 meses" },
  { value: "6-12m", label: "6 a 12 meses" },
  { value: "1-3a", label: "1 a 3 anos" },
  { value: "3-5a", label: "3 a 5 anos" },
  { value: "5a+", label: "Mais de 5 anos" },
];

const DIRECTLY_INVOLVED = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "parcial", label: "Parcialmente" },
];

interface IdentificationData {
  fullName: string;
  position: string;
  area: string;
  timeInCompany: string;
  directlyInvolved: string;
  directManager: string;
}

interface IdentificationSectionProps {
  data: IdentificationData;
  onChange: (data: IdentificationData) => void;
  onComplete: () => void;
}

export function IdentificationSection({
  data,
  onChange,
  onComplete,
}: IdentificationSectionProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = [
    {
      id: "fullName",
      component: (
        <TextQuestion
          question="Qual é o seu nome completo?"
          value={data.fullName}
          onChange={(value) => onChange({ ...data, fullName: value })}
          placeholder="Digite seu nome completo"
          required
        />
      ),
      isValid: () => data.fullName.trim().length > 0,
    },
    {
      id: "position",
      component: (
        <TextQuestion
          question="Qual é o seu cargo?"
          value={data.position}
          onChange={(value) => onChange({ ...data, position: value })}
          placeholder="Ex: Analista, Coordenador, Gerente..."
          required
        />
      ),
      isValid: () => data.position.trim().length > 0,
    },
    {
      id: "area",
      component: (
        <SelectQuestion
          question="Qual é a sua área de atuação?"
          options={AREAS}
          value={data.area}
          onChange={(value) => onChange({ ...data, area: value })}
          required
        />
      ),
      isValid: () => data.area.length > 0,
    },
    {
      id: "timeInCompany",
      component: (
        <SelectQuestion
          question="Há quanto tempo você trabalha na empresa?"
          options={TIME_IN_COMPANY}
          value={data.timeInCompany}
          onChange={(value) => onChange({ ...data, timeInCompany: value })}
          required
        />
      ),
      isValid: () => data.timeInCompany.length > 0,
    },
    {
      id: "directlyInvolved",
      component: (
        <SelectQuestion
          question="Você participa diretamente dos processos que vamos melhorar?"
          options={DIRECTLY_INVOLVED}
          value={data.directlyInvolved}
          onChange={(value) => onChange({ ...data, directlyInvolved: value })}
          required
        />
      ),
      isValid: () => data.directlyInvolved.length > 0,
    },
    {
      id: "directManager",
      component: (
        <TextQuestion
          question="Quem é seu gestor direto?"
          subtitle="(Opcional)"
          value={data.directManager}
          onChange={(value) => onChange({ ...data, directManager: value })}
          placeholder="Nome do seu gestor"
        />
      ),
      isValid: () => true,
    },
  ];

  const currentQ = questions[currentQuestion];
  const canAdvance = currentQ.isValid();
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete();
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canAdvance) {
      handleNext();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0" onKeyDown={handleKeyDown}>
      <div className="flex-1 flex items-center justify-center min-h-0 overflow-y-auto py-4">
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
          disabled={currentQuestion === 0}
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
