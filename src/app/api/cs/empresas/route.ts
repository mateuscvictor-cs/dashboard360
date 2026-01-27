import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { csOwnerId?: string; role?: string; email?: string };
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    let companies;

    if (all || user.role === "ADMIN") {
      companies = await prisma.company.findMany({
        include: {
          csOwner: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      });

      return NextResponse.json(
        companies.map(c => ({
          ...c,
          canEdit: user.role === "ADMIN" || c.csOwnerId === user.csOwnerId,
        }))
      );
    }

    let csOwnerId = user.csOwnerId;
    
    if (!csOwnerId && user.email) {
      const csOwner = await prisma.cSOwner.findUnique({
        where: { email: user.email },
        select: { id: true },
      });
      csOwnerId = csOwner?.id;
    }

    if (!csOwnerId) {
      console.log("[API cs/empresas] No csOwnerId found for user:", user.email);
      return NextResponse.json([]);
    }

    companies = await prisma.company.findMany({
      where: { csOwnerId },
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
