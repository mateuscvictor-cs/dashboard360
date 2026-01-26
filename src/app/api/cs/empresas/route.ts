import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { csOwnerId?: string; role?: string };
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    let companies;

    if (all) {
      companies = await prisma.company.findMany({
        include: {
          csOwner: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      });

      return NextResponse.json(
        companies.map(c => ({
          ...c,
          canEdit: c.csOwnerId === user.csOwnerId,
        }))
      );
    }

    if (!user.csOwnerId) {
      return NextResponse.json([]);
    }

    companies = await prisma.company.findMany({
      where: { csOwnerId: user.csOwnerId },
      include: {
        csOwner: { select: { id: true, name: true } },
      },
      orderBy: { healthScore: "asc" },
    });

    return NextResponse.json(
      companies.map(c => ({ ...c, canEdit: true }))
    );
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
