import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { clientResourceService } from "@/services/client-resource.service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const { id } = await params;

    const resource = await clientResourceService.findById(id);
    if (!resource) {
      return NextResponse.json({ error: "Recurso não encontrado" }, { status: 404 });
    }

    return NextResponse.json(resource);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    console.error("Erro ao buscar recurso:", error);
    return NextResponse.json({ error: "Erro ao buscar recurso" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const { id } = await params;
    const body = await request.json();

    const existing = await clientResourceService.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Recurso não encontrado" }, { status: 404 });
    }

    const resource = await clientResourceService.update(id, {
      title: body.title,
      description: body.description,
      url: body.url,
      type: body.type,
      category: body.category,
      icon: body.icon,
      isActive: body.isActive,
      order: body.order,
    });

    return NextResponse.json(resource);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    console.error("Erro ao atualizar recurso:", error);
    return NextResponse.json({ error: "Erro ao atualizar recurso" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const { id } = await params;

    const existing = await clientResourceService.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Recurso não encontrado" }, { status: 404 });
    }

    await clientResourceService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    console.error("Erro ao deletar recurso:", error);
    return NextResponse.json({ error: "Erro ao deletar recurso" }, { status: 500 });
  }
}
