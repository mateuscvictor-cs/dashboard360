import { NextRequest, NextResponse } from "next/server";
import { requireRole, getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import {
  loadContext,
  processMessage,
} from "@/services/ai-assistant.service";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "CS_OWNER"]);
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Mensagem é obrigatória." },
        { status: 400 }
      );
    }

    const user = session.user as {
      id: string;
      role?: string;
      csOwnerId?: string | null;
    };

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, csOwnerId: true },
    });

    const role = dbUser?.role || user.role || "CLIENT";
    const csOwnerId = dbUser?.csOwnerId ?? user.csOwnerId ?? null;

    const context = await loadContext(user.id, role, csOwnerId);

    const result = await processMessage(message, context);

    return NextResponse.json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return NextResponse.json(
        { success: false, message: "Não autorizado." },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message.includes("OPENAI")) {
      return NextResponse.json(
        { success: false, message: "Configuração da IA indisponível." },
        { status: 503 }
      );
    }
    console.error("[AI Assistant] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao processar comando.",
      },
      { status: 500 }
    );
  }
}
