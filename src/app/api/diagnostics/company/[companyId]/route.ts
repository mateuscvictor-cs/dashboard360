import { NextRequest, NextResponse } from "next/server";
import { diagnosticService } from "@/services/diagnostic.service";
import { requireRole } from "@/lib/auth-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const { companyId } = await params;

    const diagnostics = await diagnosticService.findByCompany(companyId);

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error("Error fetching company diagnostics:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar diagnósticos" },
      { status: 500 }
    );
  }
}
