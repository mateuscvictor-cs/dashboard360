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
    const role = searchParams.get("role");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (query.length < 2 && !role) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          role ? { role: role as "ADMIN" | "CS_OWNER" | "CLIENT" } : {},
          query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { email: { contains: query, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      take: limit,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[API Users Search] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 });
  }
}
