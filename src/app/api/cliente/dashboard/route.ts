import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireRole(["CLIENT", "CLIENT_MEMBER"]);

    const user = session.user as { companyId?: string };
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário não vinculado a empresa" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: {
        csOwner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        squad: {
          select: { id: true, name: true },
        },
        contacts: {
          where: { isDecisionMaker: true },
          select: { id: true, name: true, email: true, role: true },
          take: 5,
        },
        deliveries: {
          orderBy: { dueDate: "asc" },
          include: {
            completion: true,
          },
        },
        workshops: {
          where: {
            date: { gte: new Date() },
          },
          orderBy: { date: "asc" },
          take: 5,
        },
        hotseats: {
          where: {
            date: { gte: new Date() },
          },
          orderBy: { date: "asc" },
          take: 5,
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const completedDeliveries = company.deliveries.filter((d) => d.status === "COMPLETED");
    const currentDeliveries = company.deliveries.filter((d) => d.status !== "COMPLETED");
    const totalDeliveries = company.deliveries.length;

    const overallProgress =
      totalDeliveries > 0
        ? Math.round(
            company.deliveries.reduce((acc, d) => acc + d.progress, 0) / totalDeliveries
          )
        : 0;

    const response = {
      companyName: company.name,
      logo: company.logo,
      framework: company.framework,
      segment: company.segment,
      status: company.onboardingStatus || "Em andamento",
      healthScore: company.healthScore,
      overallProgress,
      contractStart: company.contractStart,
      contractEnd: company.contractEnd,
      fathomLink: company.fathomLink,
      docsLink: company.docsLink,

      csOwner: company.csOwner
        ? {
            name: company.csOwner.name,
            email: company.csOwner.email,
            avatar: company.csOwner.avatar,
          }
        : null,

      squad: company.squad
        ? {
            name: company.squad.name,
          }
        : null,

      metrics: {
        totalDeliveries,
        completedDeliveries: completedDeliveries.length,
        workshopsScheduled: company.workshops.length,
        hotseatsScheduled: company.hotseats.length,
      },

      currentDeliveries: currentDeliveries.slice(0, 5).map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        status: d.status,
        progress: d.progress,
        dueDate: d.dueDate,
        assignee: d.assignee,
        impact: d.impact,
      })),

      completedDeliveries: completedDeliveries.slice(0, 5).map((d) => ({
        id: d.id,
        title: d.title,
        completedDate: d.completion?.completedAt || d.updatedAt,
      })),

      workshops: company.workshops.map((w) => ({
        id: w.id,
        title: w.title,
        description: w.description,
        scheduledDate: w.date,
        duration: w.duration ? `${w.duration} min` : null,
        participants: w.participants,
        meetingLink: w.meetingLink,
      })),

      hotseats: company.hotseats.map((h) => ({
        id: h.id,
        title: h.title,
        description: h.description,
        scheduledDate: h.date,
        duration: h.duration ? `${h.duration} min` : null,
        participants: h.participants,
        meetingLink: h.meetingLink,
      })),

      supportContacts: company.contacts.map((c) => ({
        name: c.name,
        role: c.role,
        email: c.email,
        phone: c.phone,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao buscar dashboard do cliente:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}
