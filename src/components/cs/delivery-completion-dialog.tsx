"use client"

import * as React from "react"
import { CheckCircle2, AlertCircle, Link as LinkIcon } from "lucide-react"
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
import { Input } from "@/components/ui/input"

interface DeliveryCompletionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  delivery: {
    id: string
    title: string
  }
  onComplete: () => void
}

export function DeliveryCompletionDialog({
  open,
  onOpenChange,
  delivery,
  onComplete,
}: DeliveryCompletionDialogProps) {
  const [feedback, setFeedback] = React.useState("")
  const [fathomLink, setFathomLink] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const minLength = 50
  const isValid = feedback.trim().length >= minLength

  async function handleSubmit() {
    if (!isValid) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/deliveries/${delivery.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: feedback.trim(),
          ...(fathomLink.trim() && { fathomLink: fathomLink.trim() }),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao concluir entrega")
      }

      setFeedback("")
      setFathomLink("")
      onOpenChange(false)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao concluir entrega")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Concluir Entrega
          </DialogTitle>
          <DialogDescription>
            Você está concluindo: <strong>{delivery.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="feedback" className="text-sm font-medium">
              Feedback da entrega <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="feedback"
              placeholder="Descreva o que foi entregue, principais resultados e próximos passos..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {feedback.trim().length < minLength && (
                  <span className="text-warning">
                    Mínimo {minLength} caracteres
                  </span>
                )}
              </span>
              <span className={feedback.trim().length >= minLength ? "text-success" : ""}>
                {feedback.trim().length}/{minLength}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="fathomLink" className="text-sm font-medium flex items-center gap-1.5">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              Link do Fathom <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <Input
              id="fathomLink"
              type="url"
              placeholder="https://app.usefathom.com/..."
              value={fathomLink}
              onChange={(e) => setFathomLink(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Ao concluir:</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• O cliente verá a entrega como concluída</li>
              <li>• Uma pesquisa CSAT será enviada automaticamente</li>
              <li>• Um check de adoção será agendado para 7 dias</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={handleSubmit}
            disabled={!isValid || loading}
            loading={loading}
          >
            Concluir Entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
