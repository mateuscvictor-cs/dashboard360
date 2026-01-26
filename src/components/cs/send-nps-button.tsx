"use client"

import * as React from "react"
import { Send, AlertCircle, CheckCircle2, ThumbsUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SendNPSButtonProps {
  companyId: string
  companyName: string
  aiSuggested?: boolean
  aiReason?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  onSuccess?: () => void
}

export function SendNPSButton({
  companyId,
  companyName,
  aiSuggested = false,
  aiReason,
  variant = "outline",
  size = "sm",
  onSuccess,
}: SendNPSButtonProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  async function handleSend() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/surveys/nps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          aiSuggested,
          aiReason,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao enviar NPS")
      }

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        onSuccess?.()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar NPS")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Send className="h-4 w-4 mr-2" />
          Enviar NPS
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <p className="text-lg font-medium">NPS enviado com sucesso!</p>
            <p className="text-sm text-muted-foreground">
              O cliente receberá a pesquisa ao acessar o portal.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-primary" />
                Enviar Pesquisa NPS
              </DialogTitle>
              <DialogDescription>
                Você está prestes a enviar uma pesquisa NPS para{" "}
                <strong>{companyName}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {aiSuggested && aiReason && (
                <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                  <p className="text-sm font-medium text-primary mb-1">
                    Sugestão da IA
                  </p>
                  <p className="text-sm text-muted-foreground">{aiReason}</p>
                </div>
              )}

              <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-2">
                <p className="font-medium">O que acontece:</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• O cliente verá a pesquisa ao acessar o portal</li>
                  <li>• A pesquisa expira em 7 dias</li>
                  <li>• São 6 perguntas obrigatórias + comentário</li>
                  <li>• O resultado impacta o Health Score</li>
                </ul>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleSend} disabled={loading} loading={loading}>
                <Send className="h-4 w-4 mr-2" />
                Confirmar Envio
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
