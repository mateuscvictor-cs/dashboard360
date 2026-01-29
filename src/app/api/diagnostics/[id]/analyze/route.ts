import { NextRequest, NextResponse } from "next/server";
import { diagnosticService } from "@/services/diagnostic.service";
import { diagnosticAIService } from "@/services/diagnostic-ai.service";
import { requireRole } from "@/lib/auth-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const { id } = await params;

    console.log("[Analyze] Starting analysis for diagnostic:", id);

    const diagnostic = await diagnosticService.findById(id);

    if (!diagnostic) {
      return NextResponse.json(
        { error: "Diagnóstico não encontrado" },
        { status: 404 }
      );
    }

    if (diagnostic.responses.length === 0) {
      return NextResponse.json(
        { error: "Não há respostas para analisar" },
        { status: 400 }
      );
    }

    console.log("[Analyze] Found", diagnostic.responses.length, "responses. Calling AI...");

    const analysis = await diagnosticAIService.analyzeDiagnostic(
      diagnostic.company.name,
      diagnostic.responses
    );

    console.log("[Analyze] AI analysis complete. IPCs:", analysis.suggestedIPCs?.length || 0);
    console.log("[Analyze] Automations:", analysis.suggestedAutomations?.length || 0);
    console.log("[Analyze] Has presentation prompt:", !!analysis.presentationPrompt);

    await diagnosticService.saveAnalysis(id, {
      summary: analysis.summary,
      suggestedIPCs: analysis.suggestedIPCs as unknown as import("@prisma/client").Prisma.InputJsonValue,
      suggestedAutomations: analysis.suggestedAutomations as unknown as import("@prisma/client").Prisma.InputJsonValue,
      priorityTasks: analysis.priorityTasks as unknown as import("@prisma/client").Prisma.InputJsonValue,
      estimatedSavings: analysis.estimatedSavings as unknown as import("@prisma/client").Prisma.InputJsonValue,
      presentationPrompt: analysis.presentationPrompt,
      rawAnalysis: analysis.rawAnalysis,
    });
    console.log("[Analyze] Analysis saved to database");

    await diagnosticService.markAsAnalyzed(id);
    console.log("[Analyze] Diagnostic marked as analyzed");

    const updatedDiagnostic = await diagnosticService.findById(id);

    return NextResponse.json({
      success: true,
      analysis: updatedDiagnostic?.aiAnalysis,
    });
  } catch (error) {
    console.error("[Analyze] Error analyzing diagnostic:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao analisar diagnóstico" },
      { status: 500 }
    );
  }
}
