"use client"

import * as React from "react"
import { ThumbsUp, Sparkles, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SendNPSButton } from "./send-nps-button"
import { cn } from "@/lib/utils"

interface NPSSuggestion {
  companyId: string
  companyName: string
  suggestion: {
    shouldSend: boolean
    reason: string
    confidence: "HIGH" | "MEDIUM" | "LOW"
    factors: {
      daysSinceLastNPS: number
      recentDeliveriesCompleted: number
      healthScoreTrend: "UP" | "STABLE" | "DOWN"
      engagementLevel: string
    }
  }
}

export function NPSSuggestionsCard() {
  const [suggestions, setSuggestions] = React.useState<NPSSuggestion[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchSuggestions() {
      try {
        const response = await fetch("/api/surveys/suggestions")
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data)
        }
      } catch (error) {
        console.error("Erro ao buscar sugestões:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [])

  function handleSuccess(companyId: string) {
    setSuggestions((prev) => prev.filter((s) => s.companyId !== companyId))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Sugestões de NPS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Sugestões de NPS
          </CardTitle>
          <CardDescription>
            Recomendações baseadas em análise de dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma sugestão de NPS no momento
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Sugestões de NPS
          <Badge variant="secondary" className="ml-auto">
            {suggestions.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Clientes com momento ideal para pesquisa NPS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.slice(0, 5).map((item) => (
          <div
            key={item.companyId}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm truncate">
                  {item.companyName}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    item.suggestion.confidence === "HIGH" && "border-success text-success",
                    item.suggestion.confidence === "MEDIUM" && "border-warning text-warning"
                  )}
                >
                  {item.suggestion.confidence === "HIGH" ? "Alta" : "Média"} confiança
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {item.suggestion.reason}
              </p>
            </div>
            <SendNPSButton
              companyId={item.companyId}
              companyName={item.companyName}
              aiSuggested={true}
              aiReason={item.suggestion.reason}
              variant="ghost"
              size="sm"
              onSuccess={() => handleSuccess(item.companyId)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
