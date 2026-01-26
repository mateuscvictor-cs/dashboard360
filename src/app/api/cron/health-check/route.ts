import { NextResponse } from "next/server"
import { recoveryService } from "@/services/recovery.service"
import { surveyService } from "@/services/survey.service"

export const runtime = "nodejs"
export const maxDuration = 60

function validateApiKey(request: Request): boolean {
  const cronApiKey = process.env.CRONAPI

  if (!cronApiKey) return true

  const url = new URL(request.url)
  const queryKey = url.searchParams.get("key") || url.searchParams.get("api_key")
  
  const authHeader = request.headers.get("authorization")
  const headerKey = authHeader?.replace("Bearer ", "")

  const xApiKey = request.headers.get("x-api-key")

  return queryKey === cronApiKey || headerKey === cronApiKey || xApiKey === cronApiKey
}

export async function GET(request: Request) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const [healthResults, expiredSurveys] = await Promise.all([
      recoveryService.processAll(),
      surveyService.expireSurveys(),
    ])

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      healthCheck: healthResults,
      expiredSurveys: expiredSurveys.count,
    })
  } catch (error) {
    console.error("Erro no cron health-check:", error)
    return NextResponse.json(
      { error: "Erro interno no cron job" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  return GET(request)
}
