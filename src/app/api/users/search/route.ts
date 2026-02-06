import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userRole = session.user.role;
    if (userRole !== "ADMIN" && userRole !== "CS_OWNER") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const role = searchParams.get("role");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (query.length < 2 && !role) {
      return NextResponse.json([]);
    }

    const validRoles = ["ADMIN", "CS_OWNER", "CLIENT"] as const;
    const roleParts = role ? role.split(",").filter((r) => validRoles.includes(r as (typeof validRoles)[number])) : [];
    const roleWhere =
      roleParts.length > 1
        ? { role: { in: roleParts as (typeof validRoles)[number][] } }
        : roleParts.length === 1
          ? { role: roleParts[0] as (typeof validRoles)[number] }
          : {};

    const users = await prisma.user.findMany({
      where: {
        AND: [
          ...(Object.keys(roleWhere).length ? [roleWhere] : []),
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
