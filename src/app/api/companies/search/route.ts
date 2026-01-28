import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const companies = await prisma.company.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        logo: true,
        csOwner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: limit,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("[API Companies Search] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar empresas" }, { status: 500 });
  }
}
