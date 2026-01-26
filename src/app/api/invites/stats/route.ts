import { NextResponse } from "next/server";
import { inviteService } from "@/services";
import { requireRole } from "@/lib/auth-server";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const stats = await inviteService.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
    }
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
