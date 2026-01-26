"use client"

import { useState, useEffect } from "react"
import {
  ThumbsUp,
  Star,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatDate } from "@/lib/utils"

interface Survey {
  id: string
  type: "NPS" | "CSAT" | "ADOPTION_CHECK"
  status: "PENDING" | "COMPLETED" | "EXPIRED"
  createdAt: string
  expiresAt: string | null
  aiSuggested: boolean
  aiReason: string | null
  delivery?: { id: string; title: string } | null
  workshop?: { id: string; title: string } | null
  requestedBy?: { id: string; name: string } | null
  response?: {
    id: string
    npsScore: number | null
    atendimentoScore: number | null
    prazosScore: number | null
    qualidadeScore: number | null
    treinamentoScore: number | null
    clarezaScore: number | null
    csatScore: number | null
    adoptionScore: number | null
    comment: string | null
    createdAt: string
    respondent: { id: string; name: string; email: string }
  } | null
}

interface CompanySurveysCardProps {
  companyId: string
}

const typeConfig = {
  NPS: {
    label: "NPS",
    icon: ThumbsUp,
    color: "bg-primary/10 text-primary",
  },
  CSAT: {
    label: "CSAT",
    icon: Star,
    color: "bg-warning/10 text-warning",
  },
  ADOPTION_CHECK: {
    label: "Check de Adoção",
    icon: Activity,
    color: "bg-success/10 text-success",
  },
}

const statusConfig = {
  PENDING: { label: "Pendente", color: "bg-warning/10 text-warning" },
  COMPLETED: { label: "Respondida", color: "bg-success/10 text-success" },
  EXPIRED: { label: "Expirada", color: "bg-muted text-muted-foreground" },
}

function getScoreColor(score: number) {
  if (score <= 6) return "text-destructive"
  if (score <= 8) return "text-warning"
  return "text-success"
}

function getNPSCategory(score: number) {
  if (score <= 6) return { label: "Detrator", color: "text-destructive" }
  if (score <= 8) return { label: "Neutro", color: "text-warning" }
  return { label: "Promotor", color: "text-success" }
}

export function CompanySurveysCard({ companyId }: CompanySurveysCardProps) {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchSurveys()
  }, [companyId])

  async function fetchSurveys() {
    try {
      const response = await fetch(`/api/companies/${companyId}/surveys`)
      if (response.ok) {
        const data = await response.json()
        setSurveys(data)
      }
    } catch (error) {
      console.error("Erro ao buscar pesquisas:", error)
    } finally {
      setLoading(false)
    }
  }

  const completedSurveys = surveys.filter((s) => s.status === "COMPLETED")
  const pendingSurveys = surveys.filter((s) => s.status === "PENDING")

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-primary" />
            Pesquisas de Satisfação
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-primary" />
            Pesquisas de Satisfação
          </CardTitle>
          <div className="flex items-center gap-2">
            {pendingSurveys.length > 0 && (
              <Badge variant="secondary" className="bg-warning/10 text-warning">
                {pendingSurveys.length} pendente{pendingSurveys.length > 1 ? "s" : ""}
              </Badge>
            )}
            <Badge variant="secondary">
              {completedSurveys.length} respondida{completedSurveys.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {surveys.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <ThumbsUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma pesquisa enviada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {surveys.slice(0, 5).map((survey) => {
              const type = typeConfig[survey.type]
              const status = statusConfig[survey.status]
              const Icon = type.icon
              const isExpanded = expandedId === survey.id
              const hasResponse = !!survey.response

              return (
                <div
                  key={survey.id}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    hasResponse && "hover:bg-muted/50 cursor-pointer"
                  )}
                  onClick={() => hasResponse && setExpandedId(isExpanded ? null : survey.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg shrink-0", type.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{type.label}</span>
                          <Badge className={status.color} variant="secondary">
                            {status.label}
                          </Badge>
                          {survey.aiSuggested && (
                            <Badge variant="outline" className="text-xs">
                              IA
                            </Badge>
                          )}
                        </div>
                        {(survey.delivery?.title || survey.workshop?.title) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {survey.delivery?.title || survey.workshop?.title}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Enviada em {formatDate(survey.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {survey.response && survey.type === "NPS" && survey.response.npsScore !== null && (
                        <div className="text-right">
                          <p className={cn("text-2xl font-bold", getScoreColor(survey.response.npsScore))}>
                            {survey.response.npsScore}
                          </p>
                          <p className={cn("text-xs", getNPSCategory(survey.response.npsScore).color)}>
                            {getNPSCategory(survey.response.npsScore).label}
                          </p>
                        </div>
                      )}
                      {survey.response && survey.type === "CSAT" && survey.response.csatScore !== null && (
                        <div className="text-right">
                          <p className={cn("text-2xl font-bold", getScoreColor(survey.response.csatScore))}>
                            {survey.response.csatScore}
                          </p>
                        </div>
                      )}
                      {survey.response && survey.type === "ADOPTION_CHECK" && survey.response.adoptionScore !== null && (
                        <div className="text-right">
                          <p className={cn("text-2xl font-bold", getScoreColor(survey.response.adoptionScore))}>
                            {survey.response.adoptionScore}
                          </p>
                        </div>
                      )}
                      {hasResponse && (
                        <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && survey.response && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Respondido por:</span>
                        <span className="font-medium">{survey.response.respondent.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({survey.response.respondent.email})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Em {formatDate(survey.response.createdAt)}
                      </p>

                      {survey.type === "NPS" && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {[
                            { label: "NPS", value: survey.response.npsScore },
                            { label: "Atendimento", value: survey.response.atendimentoScore },
                            { label: "Prazos", value: survey.response.prazosScore },
                            { label: "Qualidade", value: survey.response.qualidadeScore },
                            { label: "Treinamento", value: survey.response.treinamentoScore },
                            { label: "Clareza", value: survey.response.clarezaScore },
                          ].map(
                            (item) =>
                              item.value !== null && (
                                <div key={item.label} className="flex justify-between p-2 rounded bg-muted/50">
                                  <span className="text-muted-foreground">{item.label}</span>
                                  <span className={cn("font-medium", getScoreColor(item.value))}>
                                    {item.value}
                                  </span>
                                </div>
                              )
                          )}
                        </div>
                      )}

                      {survey.response.comment && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Comentário:</p>
                          <p className="text-sm">{survey.response.comment}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {surveys.length > 5 && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                Mostrando 5 de {surveys.length} pesquisas
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
