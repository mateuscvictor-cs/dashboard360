import { NextRequest, NextResponse } from "next/server";
import { diagnosticService } from "@/services/diagnostic.service";
import { requireRole } from "@/lib/auth-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const { id } = await params;

    const token = await diagnosticService.generateTokenForExisting(id);
    const publicUrl = diagnosticService.getPublicDiagnosticUrl(token);

    return NextResponse.json({ token, publicUrl });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar token" },
      { status: 500 }
    );
  }
}
