"use client"

import * as React from "react"
import { Star, CheckCircle2, AlertCircle } from "lucide-react"
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

interface CSATSurveyModalProps {
  open: boolean
  survey: {
    id: string
    delivery?: { id: string; title: string } | null
    workshop?: { id: string; title: string } | null
  }
  onComplete: () => void
  onSkip?: () => void
  allowSkip?: boolean
}

export function CSATSurveyModal({ open, survey, onComplete, onSkip, allowSkip = true }: CSATSurveyModalProps) {
  const [score, setScore] = React.useState<number | null>(null)
  const [comment, setComment] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const itemTitle = survey.delivery?.title || survey.workshop?.title || "esta entrega"

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
          csatScore: score,
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

  function getScoreLabel(value: number): string {
    if (value <= 2) return "Muito insatisfeito"
    if (value <= 4) return "Insatisfeito"
    if (value <= 6) return "Neutro"
    if (value <= 8) return "Satisfeito"
    return "Muito satisfeito"
  }

  function getScoreColor(value: number): string {
    if (value <= 4) return "text-destructive"
    if (value <= 6) return "text-warning"
    return "text-success"
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && allowSkip && handleSkip()}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => !allowSkip && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-warning" />
            Avalie sua experiência
          </DialogTitle>
          <DialogDescription>
            Como você avalia <strong>{itemTitle}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Sua nota <span className="text-destructive">*</span>
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
              <span>Muito insatisfeito</span>
              <span>Muito satisfeito</span>
            </div>
            {score !== null && (
              <p className={cn("text-center text-sm font-medium", getScoreColor(score))}>
                {getScoreLabel(score)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Comentário (opcional)
            </label>
            <Textarea
              id="comment"
              placeholder="Conte-nos mais sobre sua experiência..."
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
            Enviar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
