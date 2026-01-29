import { NextRequest, NextResponse } from "next/server";
import { diagnosticService } from "@/services/diagnostic.service";
import { notificationService } from "@/services/notification.service";
import { requireRole } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { DiagnosticAudience } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "CS_OWNER"]);
    const body = await request.json();

    const { companyId, expiresAt, targetAudience } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId é obrigatório" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    const validAudiences: DiagnosticAudience[] = ["ALL", "CLIENT_ONLY", "MEMBER_ONLY"];
    const audience: DiagnosticAudience = validAudiences.includes(targetAudience as DiagnosticAudience)
      ? (targetAudience as DiagnosticAudience)
      : "ALL";

    const diagnostic = await diagnosticService.create({
      companyId,
      sentById: session.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      targetAudience: audience,
    });

    const publicUrl = diagnosticService.getPublicDiagnosticUrl(diagnostic.publicToken!);

    await notificationService.notifyDiagnosticPending(
      companyId,
      diagnostic.id,
      publicUrl,
      audience
    );

    return NextResponse.json({
      ...diagnostic,
      publicUrl,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating diagnostic:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar diagnóstico" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (companyId) {
      const diagnostics = await diagnosticService.findByCompany(companyId);
      return NextResponse.json(diagnostics);
    }

    const stats = await diagnosticService.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching diagnostics:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar diagnósticos" },
      { status: 500 }
    );
  }
}
