import { NextRequest, NextResponse } from "next/server";
import { diagnosticService } from "@/services/diagnostic.service";
import { notificationService } from "@/services/notification.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const diagnostic = await diagnosticService.findByPublicToken(token);

    if (!diagnostic) {
      return NextResponse.json(
        { error: "Diagnóstico não encontrado" },
        { status: 404 }
      );
    }

    if (diagnostic.expiresAt && new Date(diagnostic.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Este diagnóstico expirou" },
        { status: 410 }
      );
    }

    if (diagnostic.status === "COMPLETED" || diagnostic.status === "ANALYZED") {
      return NextResponse.json(
        { error: "Este diagnóstico já foi encerrado" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      id: diagnostic.id,
      companyName: diagnostic.company.name,
      companyLogo: diagnostic.company.logo,
      expiresAt: diagnostic.expiresAt,
      status: diagnostic.status,
      responsesCount: diagnostic._count.responses,
    });
  } catch (error) {
    console.error("Error fetching public diagnostic:", error);
    return NextResponse.json(
      { error: "Erro ao buscar diagnóstico" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    const diagnostic = await diagnosticService.findByPublicToken(token);

    if (!diagnostic) {
      return NextResponse.json(
        { error: "Diagnóstico não encontrado" },
        { status: 404 }
      );
    }

    if (diagnostic.expiresAt && new Date(diagnostic.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Este diagnóstico expirou" },
        { status: 410 }
      );
    }

    if (diagnostic.status === "COMPLETED" || diagnostic.status === "ANALYZED") {
      return NextResponse.json(
        { error: "Este diagnóstico já foi encerrado" },
        { status: 410 }
      );
    }

    const { email, ...responseData } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const alreadyResponded = await diagnosticService.hasEmailResponded(
      diagnostic.id,
      normalizedEmail
    );

    if (alreadyResponded) {
      return NextResponse.json(
        { error: "Este email já respondeu este diagnóstico" },
        { status: 409 }
      );
    }

    const response = await diagnosticService.createResponse({
      diagnosticId: diagnostic.id,
      email: normalizedEmail,
      fullName: responseData.fullName,
      position: responseData.position,
      area: responseData.area,
      timeInCompany: responseData.timeInCompany,
      directlyInvolved: responseData.directlyInvolved,
      directManager: responseData.directManager,
      topFiveTasks: responseData.topFiveTasks,
      topTwoTimeTasks: responseData.topTwoTimeTasks,
      copyPasteTask: responseData.copyPasteTask,
      reworkArea: responseData.reworkArea,
      humanErrorArea: responseData.humanErrorArea,
      dependencyArea: responseData.dependencyArea,
      frustration: responseData.frustration,
      taskDetails: responseData.taskDetails,
      systemsData: responseData.systemsData,
      priorityData: responseData.priorityData,
    });

    await notificationService.notifyDiagnosticCompleted(
      diagnostic.companyId,
      diagnostic.id,
      responseData.fullName,
      normalizedEmail
    );

    return NextResponse.json({
      success: true,
      responseId: response.id,
    });
  } catch (error) {
    console.error("Error submitting public diagnostic response:", error);
    return NextResponse.json(
      { error: "Erro ao enviar resposta" },
      { status: 500 }
    );
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return new NextResponse(null, { status: 400 });
    }

    const diagnostic = await diagnosticService.findByPublicToken(token);

    if (!diagnostic) {
      return new NextResponse(null, { status: 404 });
    }

    const alreadyResponded = await diagnosticService.hasEmailResponded(
      diagnostic.id,
      email.toLowerCase().trim()
    );

    if (alreadyResponded) {
      return new NextResponse(null, { status: 409 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Error checking email:", error);
    return new NextResponse(null, { status: 500 });
  }
}
