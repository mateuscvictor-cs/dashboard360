"use client"

import * as React from "react"
import { CSATSurveyModal } from "./csat-survey-modal"
import { NPSSurveyModal } from "./nps-survey-modal"
import { AdoptionCheckModal } from "./adoption-check-modal"

interface Survey {
  id: string
  type: "NPS" | "CSAT" | "ADOPTION_CHECK"
  delivery?: { id: string; title: string } | null
  workshop?: { id: string; title: string } | null
}

interface PendingSurveysContextValue {
  pendingSurveys: Survey[]
  refreshSurveys: () => Promise<void>
}

const PendingSurveysContext = React.createContext<PendingSurveysContextValue | null>(null)

export function usePendingSurveys() {
  const context = React.useContext(PendingSurveysContext)
  if (!context) {
    throw new Error("usePendingSurveys must be used within PendingSurveysProvider")
  }
  return context
}

export function PendingSurveysProvider({ children }: { children: React.ReactNode }) {
  const [surveys, setSurveys] = React.useState<Survey[]>([])
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  const fetchSurveys = React.useCallback(async () => {
    try {
      const response = await fetch("/api/cliente/surveys")
      if (response.ok) {
        const data = await response.json()
        setSurveys(data)
      }
    } catch (error) {
      console.error("Erro ao buscar pesquisas:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSurveys()
  }, [fetchSurveys])

  const handleComplete = React.useCallback(() => {
    setSurveys((prev) => prev.filter((_, i) => i !== currentIndex))
  }, [currentIndex])

  const handleSkip = React.useCallback(() => {
    setCurrentIndex((prev) => prev + 1)
  }, [])

  const currentSurvey = surveys[currentIndex]

  const contextValue = React.useMemo(
    () => ({
      pendingSurveys: surveys.slice(currentIndex),
      refreshSurveys: fetchSurveys,
    }),
    [surveys, currentIndex, fetchSurveys]
  )

  if (loading) {
    return <>{children}</>
  }

  return (
    <PendingSurveysContext.Provider value={contextValue}>
      {children}

      {currentSurvey?.type === "CSAT" && (
        <CSATSurveyModal
          open={true}
          survey={currentSurvey}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}

      {currentSurvey?.type === "ADOPTION_CHECK" && (
        <AdoptionCheckModal
          open={true}
          survey={currentSurvey}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}

      {currentSurvey?.type === "NPS" && (
        <NPSSurveyModal
          open={true}
          survey={currentSurvey}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}
    </PendingSurveysContext.Provider>
  )
}
