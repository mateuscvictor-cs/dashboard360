import { NextRequest, NextResponse } from "next/server";
import { diagnosticService } from "@/services/diagnostic.service";
import { requireAuth } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "Usuário não vinculado a uma empresa" },
        { status: 400 }
      );
    }

    if (all && session.user.role === "CLIENT") {
      const diagnostics = await diagnosticService.findByCompany(session.user.companyId);
      return NextResponse.json(diagnostics);
    }

    const diagnostics = await diagnosticService.findPendingForUser(
      session.user.id,
      session.user.companyId,
      session.user.role
    );

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error("Error fetching client diagnostics:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar diagnósticos" },
      { status: 500 }
    );
  }
}
