"use client"

import * as React from "react"
import { ThumbsUp, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface NPSSurveyModalProps {
  open: boolean
  survey: {
    id: string
  }
  onComplete: () => void
  onSkip?: () => void
  allowSkip?: boolean
}

interface NPSQuestion {
  key: keyof NPSScores
  label: string
  description: string
}

interface NPSScores {
  npsScore: number | null
  atendimentoScore: number | null
  prazosScore: number | null
  qualidadeScore: number | null
  treinamentoScore: number | null
  clarezaScore: number | null
}

const questions: NPSQuestion[] = [
  {
    key: "npsScore",
    label: "Recomendação",
    description: "Em uma escala de 0 a 10, o quanto você recomendaria a VanguardIA para um colega ou empresa?",
  },
  {
    key: "atendimentoScore",
    label: "Atendimento",
    description: "Como você avalia a qualidade do atendimento que recebe do seu CS?",
  },
  {
    key: "prazosScore",
    label: "Prazos",
    description: "Como você avalia o cumprimento dos prazos acordados?",
  },
  {
    key: "qualidadeScore",
    label: "Qualidade das Soluções",
    description: "Como você avalia a qualidade das soluções entregues?",
  },
  {
    key: "treinamentoScore",
    label: "Treinamento (CNH da IA)",
    description: "Como você avalia os treinamentos e capacitações oferecidos?",
  },
  {
    key: "clarezaScore",
    label: "Clareza",
    description: "Como você avalia a clareza na comunicação e alinhamento de expectativas?",
  },
]

export function NPSSurveyModal({ open, survey, onComplete, onSkip, allowSkip = true }: NPSSurveyModalProps) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [scores, setScores] = React.useState<NPSScores>({
    npsScore: null,
    atendimentoScore: null,
    prazosScore: null,
    qualidadeScore: null,
    treinamentoScore: null,
    clarezaScore: null,
  })
  const [comment, setComment] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isLastQuestion = currentStep === questions.length
  const progress = ((currentStep) / (questions.length + 1)) * 100
  const currentQuestion = questions[currentStep]
  const currentScore = currentQuestion ? scores[currentQuestion.key] : null

  function handleScore(value: number) {
    if (!currentQuestion) return
    setScores((prev) => ({ ...prev, [currentQuestion.key]: value }))
  }

  function handleNext() {
    if (currentStep < questions.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/surveys/${survey.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...scores,
          comment: comment.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao enviar avaliação")
      }

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar avaliação")
    } finally {
      setLoading(false)
    }
  }

  function getScoreColor(value: number): string {
    if (value <= 6) return "bg-destructive text-destructive-foreground border-destructive"
    if (value <= 8) return "bg-warning text-warning-foreground border-warning"
    return "bg-success text-success-foreground border-success"
  }

  function getNPSCategory(value: number): { label: string; color: string } {
    if (value <= 6) return { label: "Detrator", color: "text-destructive" }
    if (value <= 8) return { label: "Neutro", color: "text-warning" }
    return { label: "Promotor", color: "text-success" }
  }

  function handleSkip() {
    onSkip?.()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && allowSkip && handleSkip()}>
      <DialogContent
        className="sm:max-w-[550px]"
        onPointerDownOutside={(e) => !allowSkip && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ThumbsUp className="h-5 w-5 text-primary" />
            Pesquisa NPS
          </DialogTitle>
          <DialogDescription>
            Sua opinião é muito importante para melhorarmos nossos serviços.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {currentStep + 1} de {questions.length + 1}
          </p>
        </div>

        <div className="min-h-[280px]">
          {!isLastQuestion && currentQuestion && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{currentQuestion.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentQuestion.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-center gap-2">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleScore(i)}
                      className={cn(
                        "w-9 h-9 rounded-lg text-sm font-medium transition-all",
                        "border hover:scale-110",
                        currentScore === i
                          ? getScoreColor(i)
                          : "bg-background border-input hover:border-primary"
                      )}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>Péssimo</span>
                  <span>Excelente</span>
                </div>
                {currentScore !== null && currentQuestion.key === "npsScore" && (
                  <p className={cn("text-center text-sm font-medium", getNPSCategory(currentScore).color)}>
                    {getNPSCategory(currentScore).label}
                  </p>
                )}
              </div>
            </div>
          )}

          {isLastQuestion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Comentário Final</h3>
                <p className="text-sm text-muted-foreground">
                  Gostaria de deixar algum comentário ou sugestão?
                </p>
              </div>

              <Textarea
                placeholder="Seu feedback nos ajuda a melhorar continuamente..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px] resize-none"
              />

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">Resumo das suas notas:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {questions.map((q) => (
                    <div key={q.key} className="flex justify-between">
                      <span className="text-muted-foreground">{q.label}:</span>
                      <span className={cn(
                        "font-medium",
                        scores[q.key] !== null && (
                          scores[q.key]! <= 6 ? "text-destructive" :
                          scores[q.key]! <= 8 ? "text-warning" : "text-success"
                        )
                      )}>
                        {scores[q.key] ?? "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            {allowSkip && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={loading}
              >
                Responder depois
              </Button>
            )}
          </div>

          {!isLastQuestion ? (
            <Button
              onClick={handleNext}
              disabled={currentScore === null}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              loading={loading}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Enviar Avaliação
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
