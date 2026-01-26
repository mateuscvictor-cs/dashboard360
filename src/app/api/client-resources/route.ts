import { NextResponse } from "next/server";
import { getSession, requireRole } from "@/lib/auth-server";
import { clientResourceService } from "@/services/client-resource.service";
import type { ClientResourceType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as { role?: string; companyId?: string };
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") || user.companyId;
    const type = searchParams.get("type") as ClientResourceType | null;

    if (!companyId) {
      return NextResponse.json({ error: "Company ID é obrigatório" }, { status: 400 });
    }

    if (user.role === "CLIENT" && user.companyId !== companyId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const resources = await clientResourceService.findByCompany(companyId, {
      type: type || undefined,
      isActive: user.role === "CLIENT" ? true : undefined,
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Erro ao buscar recursos:", error);
    return NextResponse.json({ error: "Erro ao buscar recursos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["ADMIN", "CS_OWNER"]);
    const user = session.user as { id: string };
    const body = await request.json();

    if (!body.companyId) {
      return NextResponse.json({ error: "Company ID é obrigatório" }, { status: 400 });
    }

    if (!body.title || !body.type) {
      return NextResponse.json({ error: "Título e tipo são obrigatórios" }, { status: 400 });
    }

    const resource = await clientResourceService.create({
      title: body.title,
      description: body.description,
      url: body.url,
      type: body.type,
      category: body.category,
      icon: body.icon,
      isActive: body.isActive ?? true,
      order: body.order ?? 0,
      companyId: body.companyId,
      createdById: user.id,
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    console.error("Erro ao criar recurso:", error);
    return NextResponse.json({ error: "Erro ao criar recurso" }, { status: 500 });
  }
}
