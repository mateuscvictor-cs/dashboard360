import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = session.user as { csOwnerId?: string; role?: string };

    if (user.role !== "CS_OWNER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (!user.csOwnerId) {
      return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
    }

    const csOwner = await prisma.cSOwner.findUnique({
      where: { id: user.csOwnerId },
      include: {
        companies: {
          orderBy: { healthScore: "asc" },
        },
        checklistItems: {
          orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
        },
        assignedDemands: {
          where: { status: { not: "COMPLETED" } },
          include: { company: { select: { id: true, name: true } } },
          orderBy: { dueDate: "asc" },
        },
        squadMembers: {
          include: { squad: true },
        },
      },
    });

    if (!csOwner) {
      return NextResponse.json({ error: "CS Owner não encontrado" }, { status: 404 });
    }

    const completedTasks = csOwner.checklistItems.filter(c => c.completed).length;
    const totalTasks = csOwner.checklistItems.length;
    const pendingTasks = totalTasks - completedTasks + csOwner.assignedDemands.length;
    const atRiskCompanies = csOwner.companies.filter(
      c => c.healthStatus === "CRITICAL" || c.healthStatus === "RISK"
    ).length;

    return NextResponse.json({
      ...csOwner,
      stats: {
        totalCompanies: csOwner.companies.length,
        completedTasks,
        pendingTasks,
        totalTasks,
        atRiskCompanies,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar dados do CS:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
