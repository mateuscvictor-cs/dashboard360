import { NextResponse } from "next/server";
import { userService } from "@/services";
import { requireRole } from "@/lib/auth-server";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const users = await userService.findAll();

    return NextResponse.json(users);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
    }
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}
