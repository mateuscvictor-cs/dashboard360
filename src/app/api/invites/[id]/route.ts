import { NextResponse } from "next/server";
import { inviteService } from "@/services";
import { requireRole } from "@/lib/auth-server";

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const invite = await inviteService.findById(id);

    if (!invite) {
      return NextResponse.json(
        { error: "Convite não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(invite);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
    }
    console.error("Erro ao buscar convite:", error);
    return NextResponse.json(
      { error: "Erro ao buscar convite" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const invite = await inviteService.cancel(id);

    return NextResponse.json(invite);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
    }
    console.error("Erro ao cancelar convite:", error);
    return NextResponse.json(
      { error: "Erro ao cancelar convite" },
      { status: 500 }
    );
  }
}
