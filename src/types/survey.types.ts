import type { Survey, SurveyResponse, DeliveryCompletion, SurveyType, SurveyStatus } from '@prisma/client'

export type { Survey, SurveyResponse, DeliveryCompletion, SurveyType, SurveyStatus }

export interface SurveyWithRelations extends Survey {
  response?: SurveyResponse | null
  delivery?: { id: string; title: string } | null
  workshop?: { id: string; title: string } | null
  company: { id: string; name: string }
}

export interface NPSScores {
  npsScore: number
  atendimentoScore: number
  prazosScore: number
  qualidadeScore: number
  treinamentoScore: number
  clarezaScore: number
  comment?: string
}

export interface CSATScore {
  csatScore: number
  comment?: string
}

export interface AdoptionCheckScore {
  adoptionScore: number
  comment?: string
}

export interface CreateSurveyInput {
  type: SurveyType
  companyId: string
  deliveryId?: string
  workshopId?: string
  requestedById?: string
  aiSuggested?: boolean
  aiReason?: string
  expiresAt?: Date
}

export interface RespondSurveyInput {
  surveyId: string
  respondentId: string
  npsScore?: number
  atendimentoScore?: number
  prazosScore?: number
  qualidadeScore?: number
  treinamentoScore?: number
  clarezaScore?: number
  csatScore?: number
  adoptionScore?: number
  comment?: string
}

export interface CompleteDeliveryInput {
  deliveryId: string
  completedById: string
  feedback: string
  fathomLink?: string | null
  proofDocuments?: { title: string; url: string; type: string }[]
}

export interface HealthScoreBreakdown {
  total: number
  execucao: {
    pontualidade: number
    higieneOperacional: number
    cumprimentoGates: number
    gestaoDependencias: number
    subtotal: number
  }
  cliente: {
    engajamento: number
    adocao: number
    sentimentoAlinhamento: number
    subtotal: number
  }
  expansao: {
    provaValor: number
    espacoExpansao: number
    momentoCompra: number
    subtotal: number
  }
  status: 'HEALTHY' | 'ATTENTION' | 'CRITICAL'
}
