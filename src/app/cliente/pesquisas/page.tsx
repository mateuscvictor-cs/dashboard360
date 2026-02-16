"use client"

import { useState, useEffect } from "react"
import {
  ClipboardList,
  Star,
  ThumbsUp,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { ClienteHeader } from "@/components/layout/cliente-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn, formatDate } from "@/lib/utils"
import {
  CSATSurveyModal,
  NPSSurveyModal,
  AdoptionCheckModal,
} from "@/components/cliente"

interface Survey {
  id: string
  type: "NPS" | "CSAT" | "ADOPTION_CHECK"
  status: "PENDING" | "COMPLETED" | "EXPIRED"
  createdAt: string
  expiresAt: string | null
  delivery?: { id: string; title: string } | null
  workshop?: { id: string; title: string } | null
  response?: {
    id: string
    npsScore: number | null
    csatScore: number | null
    adoptionScore: number | null
    comment: string | null
    createdAt: string
  } | null
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

export default function PesquisasPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)

  useEffect(() => {
    fetchSurveys()
  }, [])

  async function fetchSurveys() {
    try {
      const response = await fetch("/api/cliente/surveys?all=true")
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

  function handleSurveyComplete() {
    setSelectedSurvey(null)
    fetchSurveys()
  }

  const pendingSurveys = surveys.filter((s) => s.status === "PENDING")
  const completedSurveys = surveys.filter((s) => s.status === "COMPLETED")
  const expiredSurveys = surveys.filter((s) => s.status === "EXPIRED")

  function getScoreDisplay(survey: Survey) {
    if (!survey.response) return null

    switch (survey.type) {
      case "NPS":
        return survey.response.npsScore
      case "CSAT":
        return survey.response.csatScore
      case "ADOPTION_CHECK":
        return survey.response.adoptionScore
      default:
        return null
    }
  }

  function getScoreColor(score: number) {
    if (score <= 6) return "text-destructive"
    if (score <= 8) return "text-warning"
    return "text-success"
  }

  function renderSurveyCard(survey: Survey, showActions: boolean = false) {
    const type = typeConfig[survey.type]
    const status = statusConfig[survey.status]
    const Icon = type.icon
    const score = getScoreDisplay(survey)
    const itemTitle = survey.delivery?.title || survey.workshop?.title

    return (
      <Card key={survey.id} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={cn("p-2 rounded-lg", type.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{type.label}</p>
                  <Badge className={status.color} variant="secondary">
                    {status.label}
                  </Badge>
                </div>
                {itemTitle && (
                  <p className="text-sm text-muted-foreground">{itemTitle}</p>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(survey.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {score !== null && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Nota</p>
                  <p className={cn("text-2xl font-bold", getScoreColor(score))}>
                    {score}
                  </p>
                </div>
              )}

              {showActions && survey.status === "PENDING" && (
                <Button size="sm" onClick={() => setSelectedSurvey(survey)}>
                  Responder
                </Button>
              )}
            </div>
          </div>

          {survey.response?.comment && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">Seu comentário:</p>
              <p className="text-sm">{survey.response.comment}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <ClienteHeader title="Pesquisas" subtitle="Suas avaliações" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ClienteHeader title="Pesquisas" subtitle="Suas avaliações de satisfação" />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {pendingSurveys.length > 0 && (
            <Card className="border-warning/50 bg-warning/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  Pesquisas Pendentes ({pendingSurveys.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingSurveys.map((survey) => renderSurveyCard(survey, true))}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">
                Todas ({surveys.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Respondidas ({completedSurveys.length})
              </TabsTrigger>
              <TabsTrigger value="expired">
                Expiradas ({expiredSurveys.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-3">
              {surveys.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Nenhuma pesquisa encontrada</p>
                  </CardContent>
                </Card>
              ) : (
                surveys.map((survey) => renderSurveyCard(survey, survey.status === "PENDING"))
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4 space-y-3">
              {completedSurveys.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Nenhuma pesquisa respondida</p>
                  </CardContent>
                </Card>
              ) : (
                completedSurveys.map((survey) => renderSurveyCard(survey))
              )}
            </TabsContent>

            <TabsContent value="expired" className="mt-4 space-y-3">
              {expiredSurveys.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Nenhuma pesquisa expirada</p>
                  </CardContent>
                </Card>
              ) : (
                expiredSurveys.map((survey) => renderSurveyCard(survey))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {selectedSurvey?.type === "CSAT" && (
        <CSATSurveyModal
          open={true}
          survey={selectedSurvey}
          onComplete={handleSurveyComplete}
          onSkip={() => setSelectedSurvey(null)}
        />
      )}

      {selectedSurvey?.type === "NPS" && (
        <NPSSurveyModal
          open={true}
          survey={selectedSurvey}
          onComplete={handleSurveyComplete}
          onSkip={() => setSelectedSurvey(null)}
        />
      )}

      {selectedSurvey?.type === "ADOPTION_CHECK" && (
        <AdoptionCheckModal
          open={true}
          survey={selectedSurvey}
          onComplete={handleSurveyComplete}
          onSkip={() => setSelectedSurvey(null)}
        />
      )}
    </div>
  )
}
