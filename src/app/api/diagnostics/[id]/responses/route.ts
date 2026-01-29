import { NextRequest, NextResponse } from "next/server";
import { diagnosticService } from "@/services/diagnostic.service";
import { requireRole } from "@/lib/auth-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const { id } = await params;

    const responses = await diagnosticService.findResponsesByDiagnostic(id);

    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching diagnostic responses:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar respostas" },
      { status: 500 }
    );
  }
}
