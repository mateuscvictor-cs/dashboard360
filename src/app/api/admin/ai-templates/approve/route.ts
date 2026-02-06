import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { demandService } from "@/services";

type ApproveItem = {
  title: string;
  description: string;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  type: "INTERNAL";
  assignedToId: string;
  companyId?: string;
  dueDays?: number;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN"]);
    const body = await request.json();
    const { items } = body as { items?: ApproveItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Lista de itens é obrigatória" },
        { status: 400 }
      );
    }

    const created = [];

    for (const item of items) {
      if (!item.title?.trim() || !item.assignedToId) continue;

      let dueDate: Date | null = null;
      if (item.dueDays && item.dueDays > 0) {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + item.dueDays);
      }

      const demand = await demandService.create({
        title: item.title.slice(0, 200),
        description: item.description?.trim() || undefined,
        type: "INTERNAL",
        priority: item.priority || "MEDIUM",
        dueDate: dueDate ?? undefined,
        assignedToId: item.assignedToId,
        companyId: item.companyId || undefined,
        createdBy: session.user.id,
      });

      created.push(demand);
    }

    return NextResponse.json({
      success: true,
      message: `${created.length} demanda(s) criada(s)`,
      demands: created,
      created: created.length,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("[AI Templates Approve] Error:", error);
    return NextResponse.json(
      { error: "Erro ao criar demandas" },
      { status: 500 }
    );
  }
}
