import { NextRequest, NextResponse } from "next/server";
import { diagnosticService } from "@/services/diagnostic.service";
import { requireAuth } from "@/lib/auth-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "Usuário não vinculado a uma empresa" },
        { status: 400 }
      );
    }

    const diagnostic = await diagnosticService.findById(id);

    if (!diagnostic) {
      return NextResponse.json(
        { error: "Diagnóstico não encontrado" },
        { status: 404 }
      );
    }

    if (diagnostic.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const hasResponded = await diagnosticService.hasUserResponded(id, session.user.id);

    return NextResponse.json({
      ...diagnostic,
      hasResponded,
    });
  } catch (error) {
    console.error("Error fetching diagnostic:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar diagnóstico" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "Usuário não vinculado a uma empresa" },
        { status: 400 }
      );
    }

    const diagnostic = await diagnosticService.findById(id);

    if (!diagnostic) {
      return NextResponse.json(
        { error: "Diagnóstico não encontrado" },
        { status: 404 }
      );
    }

    if (diagnostic.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const hasResponded = await diagnosticService.hasUserResponded(id, session.user.id);

    if (hasResponded) {
      return NextResponse.json(
        { error: "Você já respondeu este diagnóstico" },
        { status: 400 }
      );
    }

    if (diagnostic.expiresAt && new Date() > diagnostic.expiresAt) {
      return NextResponse.json(
        { error: "Este diagnóstico expirou" },
        { status: 400 }
      );
    }

    const response = await diagnosticService.createResponse({
      diagnosticId: id,
      userId: session.user.id,
      fullName: body.fullName,
      position: body.position,
      area: body.area,
      timeInCompany: body.timeInCompany,
      directlyInvolved: body.directlyInvolved,
      directManager: body.directManager,
      topFiveTasks: body.topFiveTasks || [],
      topTwoTimeTasks: body.topTwoTimeTasks || [],
      copyPasteTask: body.copyPasteTask,
      reworkArea: body.reworkArea,
      humanErrorArea: body.humanErrorArea,
      dependencyArea: body.dependencyArea,
      frustration: body.frustration,
      taskDetails: body.taskDetails || [],
      systemsData: body.systemsData || {},
      priorityData: body.priorityData || {},
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error saving diagnostic response:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar resposta" },
      { status: 500 }
    );
  }
}
