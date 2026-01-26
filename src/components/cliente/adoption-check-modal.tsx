"use client"

import * as React from "react"
import { Activity, CheckCircle2, AlertCircle } from "lucide-react"
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

interface AdoptionCheckModalProps {
  open: boolean
  survey: {
    id: string
    delivery?: { id: string; title: string } | null
  }
  onComplete: () => void
  onSkip?: () => void
  allowSkip?: boolean
}

export function AdoptionCheckModal({ open, survey, onComplete, onSkip, allowSkip = true }: AdoptionCheckModalProps) {
  const [score, setScore] = React.useState<number | null>(null)
  const [comment, setComment] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const deliveryTitle = survey.delivery?.title || "a funcionalidade"

  function handleSkip() {
    onSkip?.()
  }

  async function handleSubmit() {
    if (score === null) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/surveys/${survey.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adoptionScore: score,
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

  function getAdoptionLabel(value: number): { text: string; color: string } {
    if (value <= 2) return { text: "Não estou usando", color: "text-destructive" }
    if (value <= 4) return { text: "Uso raramente", color: "text-destructive" }
    if (value <= 6) return { text: "Uso ocasionalmente", color: "text-warning" }
    if (value <= 8) return { text: "Uso frequentemente", color: "text-success" }
    return { text: "Uso diariamente", color: "text-success" }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && allowSkip && handleSkip()}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => !allowSkip && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Check de Adoção
          </DialogTitle>
          <DialogDescription>
            Já se passaram 7 dias desde a entrega de <strong>{deliveryTitle}</strong>.
            <br />
            Nos conte: a funcionalidade já está rodando na sua rotina?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Em uma escala de 0 a 10, o quanto você está usando esta funcionalidade?
              <span className="text-destructive"> *</span>
            </label>
            <div className="flex justify-center gap-2">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setScore(i)}
                  className={cn(
                    "w-9 h-9 rounded-lg text-sm font-medium transition-all",
                    "border hover:scale-110",
                    score === i
                      ? i <= 4
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : i <= 6
                        ? "bg-warning text-warning-foreground border-warning"
                        : "bg-success text-success-foreground border-success"
                      : "bg-background border-input hover:border-primary"
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>Não uso</span>
              <span>Uso diariamente</span>
            </div>
            {score !== null && (
              <p className={cn("text-center text-sm font-medium", getAdoptionLabel(score).color)}>
                {getAdoptionLabel(score).text}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              {score !== null && score <= 6
                ? "O que está impedindo você de usar mais?"
                : "Algum comentário adicional?"}
              {" "}(opcional)
            </label>
            <Textarea
              id="comment"
              placeholder={
                score !== null && score <= 6
                  ? "Conte-nos as barreiras que está enfrentando..."
                  : "Compartilhe sua experiência..."
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {allowSkip && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Responder depois
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={score === null || loading}
            loading={loading}
            className="w-full sm:w-auto"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Enviar Resposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
