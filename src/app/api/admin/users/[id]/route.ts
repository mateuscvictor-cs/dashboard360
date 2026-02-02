import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { userService } from "@/services";
import { requireRole } from "@/lib/auth-server";

const VALID_ROLES: UserRole[] = ["ADMIN", "CS_OWNER", "CLIENT", "CLIENT_MEMBER"];

function handleAuthError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
  }
  return NextResponse.json({ error: "Erro de autenticação" }, { status: 500 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireRole(["ADMIN"]);
  } catch (error) {
    return handleAuthError(error);
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { role, isActive } = body;

    const data: { role?: UserRole; isActive?: boolean } = {};
    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: "Perfil inválido" }, { status: 400 });
      }
      data.role = role;
    }
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
    }

    const user = await userService.update(id, data);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMIN"]);
    const currentUserId = (session?.user as { id?: string })?.id;

    const { id } = await params;

    if (currentUserId === id) {
      return NextResponse.json(
        { error: "Você não pode excluir sua própria conta" },
        { status: 400 }
      );
    }

    await userService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return handleAuthError(error);
    }
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json(
      { error: "Erro ao excluir usuário" },
      { status: 500 }
    );
  }
}
