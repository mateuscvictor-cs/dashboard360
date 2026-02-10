"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChipSelectQuestion, SelectQuestion, TextareaQuestion } from "../question-types";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

const COMMON_TOOLS = [
  { value: "excel", label: "Excel" },
  { value: "google-sheets", label: "Google Sheets" },
  { value: "word", label: "Word" },
  { value: "google-docs", label: "Google Docs" },
  { value: "outlook", label: "Outlook" },
  { value: "gmail", label: "Gmail" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "teams", label: "Teams" },
  { value: "slack", label: "Slack" },
  { value: "zoom", label: "Zoom" },
  { value: "trello", label: "Trello" },
  { value: "asana", label: "Asana" },
  { value: "notion", label: "Notion" },
  { value: "jira", label: "Jira" },
  { value: "salesforce", label: "Salesforce" },
  { value: "hubspot", label: "HubSpot" },
  { value: "sap", label: "SAP" },
  { value: "totvs", label: "TOTVS" },
  { value: "omie", label: "Omie" },
  { value: "contaazul", label: "Conta Azul" },
  { value: "bling", label: "Bling" },
  { value: "tiny", label: "Tiny" },
  { value: "rd-station", label: "RD Station" },
  { value: "pipedrive", label: "Pipedrive" },
];

const DATA_LOCATIONS = [
  { value: "erp", label: "ERP" },
  { value: "crm", label: "CRM" },
  { value: "planilhas", label: "Planilhas" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sistema-proprio", label: "Sistema próprio" },
  { value: "nuvem", label: "Nuvem (Drive, Dropbox)" },
  { value: "servidor-local", label: "Servidor local" },
  { value: "outro", label: "Outro" },
];

const HAS_INTEGRATION = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "nao-sei", label: "Não sei" },
];

const IT_BLOCKS_ACCESS = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "nao-sei", label: "Não sei" },
];

export interface SystemsData {
  dailyTools: string[];
  indispensableSystems: string[];
  mainDataLocation: string[];
  hasIntegration: string;
  integrationDetails: string;
  itBlocksAccess: string;
  itBlocksDetails: string;
}

interface SystemsSectionProps {
  data: SystemsData;
  onChange: (data: SystemsData) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function SystemsSection({
  data,
  onChange,
  onComplete,
  onBack,
}: SystemsSectionProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = [
    {
      id: "dailyTools",
      component: (
        <ChipSelectQuestion
          question="Quais ferramentas você usa todos os dias?"
          subtitle="Selecione todas que se aplicam"
          options={COMMON_TOOLS}
          value={data.dailyTools}
          onChange={(value) => onChange({ ...data, dailyTools: value })}
          allowCustom
          customPlaceholder="Adicionar outra ferramenta..."
          required
        />
      ),
      isValid: () => data.dailyTools.length > 0,
    },
    {
      id: "indispensableSystems",
      component: (
        <ChipSelectQuestion
          question="Quais sistemas são indispensáveis para seu trabalho?"
          subtitle="Sem eles, você não consegue trabalhar"
          options={data.dailyTools.map((tool) => ({
            value: tool,
            label: COMMON_TOOLS.find((t) => t.value === tool)?.label || tool,
          }))}
          value={data.indispensableSystems}
          onChange={(value) => onChange({ ...data, indispensableSystems: value })}
          allowCustom
          customPlaceholder="Adicionar sistema..."
          required
        />
      ),
      isValid: () => data.indispensableSystems.length > 0,
    },
    {
      id: "mainDataLocation",
      component: (
        <ChipSelectQuestion
          question="Onde ficam os dados principais que você usa?"
          subtitle="Selecione todas as fontes de dados"
          options={DATA_LOCATIONS}
          value={data.mainDataLocation}
          onChange={(value) => onChange({ ...data, mainDataLocation: value })}
          allowCustom
          customPlaceholder="Adicionar localização..."
          required
        />
      ),
      isValid: () => data.mainDataLocation.length > 0,
    },
    {
      id: "hasIntegration",
      component: (
        <SelectQuestion
          question="Existe alguma integração entre os sistemas que você usa hoje?"
          options={HAS_INTEGRATION}
          value={data.hasIntegration}
          onChange={(value) => onChange({ ...data, hasIntegration: value })}
          required
        />
      ),
      isValid: () => data.hasIntegration.length > 0,
    },
    ...(data.hasIntegration === "sim"
      ? [
          {
            id: "integrationDetails",
            component: (
              <TextareaQuestion
                question="Quais integrações existem?"
                subtitle="Descreva as integrações entre os sistemas"
                value={data.integrationDetails}
                onChange={(value) => onChange({ ...data, integrationDetails: value })}
                placeholder="Ex: O CRM integra com o ERP via API..."
              />
            ),
            isValid: () => true,
          },
        ]
      : []),
    {
      id: "itBlocksAccess",
      component: (
        <SelectQuestion
          question="A TI trava acessos ou instala softwares sem permissão?"
          options={IT_BLOCKS_ACCESS}
          value={data.itBlocksAccess}
          onChange={(value) => onChange({ ...data, itBlocksAccess: value })}
          required
        />
      ),
      isValid: () => data.itBlocksAccess.length > 0,
    },
    ...(data.itBlocksAccess === "sim"
      ? [
          {
            id: "itBlocksDetails",
            component: (
              <TextareaQuestion
                question="Descreva quais limitações a TI impõe"
                value={data.itBlocksDetails}
                onChange={(value) => onChange({ ...data, itBlocksDetails: value })}
                placeholder="Ex: Não posso instalar extensões no navegador..."
              />
            ),
            isValid: () => true,
          },
        ]
      : []),
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
          {isLastQuestion ? "Próxima Seção" : "Continuar"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
