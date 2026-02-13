import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireCompanyAccess } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireCompanyAccess(id);

    const workshops = await prisma.workshop.findMany({
      where: { companyId: id },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(workshops);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      if (error.message === "CompanyNotFound") {
        return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
      }
    }
    console.error("Erro ao buscar workshops:", error);
    return NextResponse.json(
      { error: "Erro ao buscar workshops" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    await requireCompanyAccess(id);
    const body = await request.json();

    const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
    const dateValue = body.date != null && body.date !== "" ? new Date(body.date) : null;

    if (!dateValue && !isAdmin) {
      return NextResponse.json(
        { error: "Data é obrigatória" },
        { status: 400 }
      );
    }

    const workshop = await prisma.workshop.create({
      data: {
        title: body.title,
        description: body.description,
        date: dateValue,
        duration: body.duration ? parseInt(body.duration) : null,
        participants: body.participants || 0,
        locationType: body.locationType || "ONLINE",
        address: body.address,
        meetingLink: body.meetingLink,
        fathomLink: body.fathomLink,
        cadence: body.cadence || null,
        companyId: id,
        createdById: body.createdById,
      },
    });

    if (dateValue) {
      await prisma.timelineEvent.create({
        data: {
          type: "MEETING",
          title: `Workshop agendado: ${body.title}`,
          description: body.description,
          date: dateValue,
          companyId: id,
        },
      });
    }

    return NextResponse.json(workshop, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      if (error.message === "CompanyNotFound") {
        return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
      }
    }
    console.error("Erro ao criar workshop:", error);
    return NextResponse.json(
      { error: "Erro ao criar workshop" },
      { status: 500 }
    );
  }
}
