"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  TextQuestion,
  SelectQuestion,
  TextareaQuestion,
} from "../question-types";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const FREQUENCY_OPTIONS = [
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "sob-demanda", label: "Sob demanda" },
];

const TIME_PER_EXECUTION = [
  { value: "ate-5m", label: "Até 5 minutos" },
  { value: "5-15m", label: "5 a 15 minutos" },
  { value: "15-30m", label: "15 a 30 minutos" },
  { value: "30-60m", label: "30 a 60 minutos" },
  { value: "1-2h", label: "1 a 2 horas" },
  { value: "2h+", label: "Mais de 2 horas" },
];

const PEOPLE_DOING_SAME = [
  { value: "1", label: "Só eu" },
  { value: "2-3", label: "2 a 3 pessoas" },
  { value: "4-10", label: "4 a 10 pessoas" },
  { value: "10+", label: "Mais de 10 pessoas" },
];

const WHERE_STARTS = [
  { value: "sistema", label: "Sistema" },
  { value: "planilha", label: "Planilha" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "ligacao", label: "Ligação" },
  { value: "documento", label: "Documento" },
  { value: "outro", label: "Outro" },
];

const WHERE_ENDS = [
  { value: "sistema", label: "Sistema" },
  { value: "planilha", label: "Planilha" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "documento", label: "Documento" },
  { value: "outro", label: "Outro" },
];

const YES_NO_SOMETIMES = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "as-vezes", label: "Às vezes" },
];

const YES_NO_UNKNOWN = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "nao-sei", label: "Não sei" },
];

const YES_NO_PARTIAL = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "parcial", label: "Parcialmente" },
];

const MAIN_PROBLEMS = [
  { value: "demora", label: "Demora muito" },
  { value: "erros", label: "Muitos erros" },
  { value: "retrabalho", label: "Retrabalho constante" },
  { value: "falta-clareza", label: "Falta de clareza" },
  { value: "falta-dados", label: "Falta de dados" },
  { value: "dependencia", label: "Dependência de outros" },
  { value: "outro", label: "Outro" },
];

const MAIN_GAINS = [
  { value: "tempo", label: "Economizar tempo" },
  { value: "reduzir-erros", label: "Reduzir erros" },
  { value: "reduzir-retrabalho", label: "Reduzir retrabalho" },
  { value: "velocidade", label: "Aumentar velocidade" },
  { value: "qualidade", label: "Melhorar qualidade" },
  { value: "outro", label: "Outro" },
];

export interface TaskDetail {
  taskName: string;
  stepByStep: string;
  frequency: string;
  timePerExecution: string;
  peopleDoingSame: string;
  whereStarts: string;
  whereEnds: string;
  hasClearPattern: string;
  hasProcessOwner: string;
  canContinueIfOtherPerson: string;
  mainProblem: string;
  mainGainIfImproved: string;
  timeSavedPerWeek: string;
}

const emptyTask: TaskDetail = {
  taskName: "",
  stepByStep: "",
  frequency: "",
  timePerExecution: "",
  peopleDoingSame: "",
  whereStarts: "",
  whereEnds: "",
  hasClearPattern: "",
  hasProcessOwner: "",
  canContinueIfOtherPerson: "",
  mainProblem: "",
  mainGainIfImproved: "",
  timeSavedPerWeek: "",
};

interface TaskDetailSectionProps {
  data: TaskDetail[];
  onChange: (data: TaskDetail[]) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function TaskDetailSection({
  data,
  onChange,
  onComplete,
  onBack,
}: TaskDetailSectionProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const tasks = data.length > 0 ? data : [{ ...emptyTask }];

  const updateTask = (taskIndex: number, updates: Partial<TaskDetail>) => {
    const newTasks = [...tasks];
    newTasks[taskIndex] = { ...newTasks[taskIndex], ...updates };
    onChange(newTasks);
  };

  const addTask = () => {
    if (tasks.length < 3) {
      onChange([...tasks, { ...emptyTask }]);
      setCurrentTaskIndex(tasks.length);
      setCurrentQuestion(0);
    }
  };

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      const newTasks = tasks.filter((_, i) => i !== index);
      onChange(newTasks);
      if (currentTaskIndex >= newTasks.length) {
        setCurrentTaskIndex(newTasks.length - 1);
      }
    }
  };

  const currentTask = tasks[currentTaskIndex];

  const questionsForTask = (task: TaskDetail, taskIndex: number) => [
    {
      id: "taskName",
      component: (
        <TextQuestion
          question={`Tarefa ${taskIndex + 1}: Qual é o nome da tarefa?`}
          subtitle="Dê um nome simples e descritivo"
          value={task.taskName}
          onChange={(value) => updateTask(taskIndex, { taskName: value })}
          placeholder="Ex: Lançamento de notas fiscais"
          required
        />
      ),
      isValid: () => task.taskName.trim().length > 0,
    },
    {
      id: "stepByStep",
      component: (
        <TextareaQuestion
          question="Descreva o passo a passo simplificado"
          subtitle="Como você executa essa tarefa do início ao fim?"
          value={task.stepByStep}
          onChange={(value) => updateTask(taskIndex, { stepByStep: value })}
          placeholder="1. Abro o sistema...\n2. Seleciono...\n3. Preencho..."
          rows={6}
          required
        />
      ),
      isValid: () => task.stepByStep.trim().length > 0,
    },
    {
      id: "frequency",
      component: (
        <SelectQuestion
          question="Com qual frequência você realiza essa tarefa?"
          options={FREQUENCY_OPTIONS}
          value={task.frequency}
          onChange={(value) => updateTask(taskIndex, { frequency: value })}
          required
        />
      ),
      isValid: () => task.frequency.length > 0,
    },
    {
      id: "timePerExecution",
      component: (
        <SelectQuestion
          question="Quanto tempo leva cada execução?"
          options={TIME_PER_EXECUTION}
          value={task.timePerExecution}
          onChange={(value) => updateTask(taskIndex, { timePerExecution: value })}
          required
        />
      ),
      isValid: () => task.timePerExecution.length > 0,
    },
    {
      id: "peopleDoingSame",
      component: (
        <SelectQuestion
          question="Quantas pessoas fazem essa mesma tarefa?"
          options={PEOPLE_DOING_SAME}
          value={task.peopleDoingSame}
          onChange={(value) => updateTask(taskIndex, { peopleDoingSame: value })}
          required
        />
      ),
      isValid: () => task.peopleDoingSame.length > 0,
    },
    {
      id: "whereStarts",
      component: (
        <SelectQuestion
          question="Onde essa tarefa começa?"
          subtitle="Qual é o ponto de partida do processo?"
          options={WHERE_STARTS}
          value={task.whereStarts}
          onChange={(value) => updateTask(taskIndex, { whereStarts: value })}
          required
        />
      ),
      isValid: () => task.whereStarts.length > 0,
    },
    {
      id: "whereEnds",
      component: (
        <SelectQuestion
          question="Onde essa tarefa termina?"
          subtitle="Qual é o destino final do processo?"
          options={WHERE_ENDS}
          value={task.whereEnds}
          onChange={(value) => updateTask(taskIndex, { whereEnds: value })}
          required
        />
      ),
      isValid: () => task.whereEnds.length > 0,
    },
    {
      id: "hasClearPattern",
      component: (
        <SelectQuestion
          question="Essa tarefa tem um padrão claro?"
          subtitle="Ela é sempre executada da mesma forma?"
          options={YES_NO_SOMETIMES}
          value={task.hasClearPattern}
          onChange={(value) => updateTask(taskIndex, { hasClearPattern: value })}
          required
        />
      ),
      isValid: () => task.hasClearPattern.length > 0,
    },
    {
      id: "hasProcessOwner",
      component: (
        <SelectQuestion
          question="Existe um dono definido para esse processo?"
          options={YES_NO_UNKNOWN}
          value={task.hasProcessOwner}
          onChange={(value) => updateTask(taskIndex, { hasProcessOwner: value })}
          required
        />
      ),
      isValid: () => task.hasProcessOwner.length > 0,
    },
    {
      id: "canContinueIfOtherPerson",
      component: (
        <SelectQuestion
          question="Se outra pessoa assumir, o processo continua normalmente?"
          options={YES_NO_PARTIAL}
          value={task.canContinueIfOtherPerson}
          onChange={(value) => updateTask(taskIndex, { canContinueIfOtherPerson: value })}
          required
        />
      ),
      isValid: () => task.canContinueIfOtherPerson.length > 0,
    },
    {
      id: "mainProblem",
      component: (
        <SelectQuestion
          question="Qual é o maior problema dessa tarefa?"
          options={MAIN_PROBLEMS}
          value={task.mainProblem}
          onChange={(value) => updateTask(taskIndex, { mainProblem: value })}
          required
        />
      ),
      isValid: () => task.mainProblem.length > 0,
    },
    {
      id: "mainGainIfImproved",
      component: (
        <SelectQuestion
          question="Qual seria o maior ganho se essa tarefa fosse melhorada?"
          options={MAIN_GAINS}
          value={task.mainGainIfImproved}
          onChange={(value) => updateTask(taskIndex, { mainGainIfImproved: value })}
          required
        />
      ),
      isValid: () => task.mainGainIfImproved.length > 0,
    },
    {
      id: "timeSavedPerWeek",
      component: (
        <TextQuestion
          question="Quanto tempo você economizaria por semana se essa tarefa fosse automatizada?"
          subtitle="Estime em horas ou minutos"
          value={task.timeSavedPerWeek}
          onChange={(value) => updateTask(taskIndex, { timeSavedPerWeek: value })}
          placeholder="Ex: 3 horas, 45 minutos..."
          required
        />
      ),
      isValid: () => task.timeSavedPerWeek.trim().length > 0,
    },
  ];

  const questions = questionsForTask(currentTask, currentTaskIndex);
  const currentQ = questions[currentQuestion];
  const canAdvance = currentQ.isValid();
  const isLastQuestion = currentQuestion === questions.length - 1;
  const isLastTask = currentTaskIndex === tasks.length - 1;
  const isFirstQuestion = currentQuestion === 0;
  const isFirstTask = currentTaskIndex === 0;

  const handleNext = () => {
    if (isLastQuestion) {
      if (isLastTask && tasks.length < 3) {
        return;
      } else if (isLastTask) {
        onComplete();
      } else {
        setCurrentTaskIndex((prev) => prev + 1);
        setCurrentQuestion(0);
      }
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (isFirstQuestion) {
      if (isFirstTask) {
        onBack();
      } else {
        setCurrentTaskIndex((prev) => prev - 1);
        setCurrentQuestion(questionsForTask(tasks[currentTaskIndex - 1], currentTaskIndex - 1).length - 1);
      }
    } else {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canAdvance && !e.shiftKey) {
      handleNext();
    }
  };

  const finishTasksAndContinue = () => {
    onComplete();
  };

  return (
    <div className="flex flex-col h-full min-h-0" onKeyDown={handleKeyDown}>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-3 sm:p-4 border-b border-border/50 shrink-0">
        {tasks.map((task, index) => (
          <motion.button
            key={index}
            type="button"
            onClick={() => {
              setCurrentTaskIndex(index);
              setCurrentQuestion(0);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
              currentTaskIndex === index
                ? "border-primary bg-primary/10"
                : "border-muted hover:border-primary/50"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="font-medium">
              {task.taskName || `Tarefa ${index + 1}`}
            </span>
            {tasks.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTask(index);
                }}
                className="p-1 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </motion.button>
        ))}
        {tasks.length < 3 && (
          <motion.button
            type="button"
            onClick={addTask}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-muted hover:border-primary/50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar tarefa</span>
          </motion.button>
        )}
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentTaskIndex}-${currentQuestion}`}
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

        <div className="flex items-center gap-4 order-first w-full justify-center sm:order-none sm:w-auto sm:flex-1">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
            <span>Tarefa {currentTaskIndex + 1}/{tasks.length}</span>
            <span>·</span>
            <span>Pergunta {currentQuestion + 1}/{questions.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-1 sm:flex-initial justify-end">
          {isLastQuestion && (
            <Button
              variant="outline"
              onClick={finishTasksAndContinue}
              className="gap-2"
            >
              Finalizar Seção
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {!isLastQuestion && (
            <Button onClick={handleNext} disabled={!canAdvance} className="gap-2">
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
