import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getInsightById,
  updateInsight,
  deleteInsight,
  markAsRead,
  markAsActioned,
  dismissInsight,
  addFeedback,
} from "@/services/insight.service";
import type { InsightStatus } from "@prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const insight = await getInsightById(id);

    if (!insight) {
      return NextResponse.json({ error: "Insight não encontrado" }, { status: 404 });
    }

    return NextResponse.json(insight);
  } catch (error) {
    console.error("Erro ao buscar insight:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, status, feedback } = body as {
      action?: "read" | "actioned" | "dismiss";
      status?: InsightStatus;
      feedback?: "positive" | "negative";
    };

    let updatedInsight;

    if (action) {
      switch (action) {
        case "read":
          updatedInsight = await markAsRead(id);
          break;
        case "actioned":
          updatedInsight = await markAsActioned(id);
          break;
        case "dismiss":
          updatedInsight = await dismissInsight(id);
          break;
        default:
          return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
      }
    } else if (feedback) {
      updatedInsight = await addFeedback(id, feedback);
    } else if (status) {
      updatedInsight = await updateInsight(id, { status });
    } else {
      return NextResponse.json(
        { error: "Nenhuma ação ou atualização fornecida" },
        { status: 400 }
      );
    }

    return NextResponse.json(updatedInsight);
  } catch (error) {
    console.error("Erro ao atualizar insight:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    await deleteInsight(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar insight:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
