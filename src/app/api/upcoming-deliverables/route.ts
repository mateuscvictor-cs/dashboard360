import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateNextDate } from "@/lib/utils";

export interface UpcomingDeliverable {
  id: string;
  type: "delivery" | "workshop" | "hotseat" | "meeting";
  title: string;
  date: string;
  nextDate: string | null;
  cadence: string | null;
  companyId: string;
  companyName: string;
  csOwnerId: string | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const csOwnerId = searchParams.get("csOwnerId");
    const companyId = searchParams.get("companyId");
    const days = parseInt(searchParams.get("days") || "30");

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const whereClause = {
      ...(companyId && { id: companyId }),
      ...(csOwnerId && { csOwnerId }),
    };

    const companies = await prisma.company.findMany({
      where: whereClause,
      include: {
        deliveries: {
          where: {
            dueDate: { gte: now, lte: futureDate },
          },
        },
        workshops: {
          where: {
            date: { gte: now, lte: futureDate },
          },
        },
        hotseats: {
          where: {
            date: { gte: now, lte: futureDate },
          },
        },
        meetings: {
          where: {
            date: { gte: now, lte: futureDate },
            status: "SCHEDULED",
          },
        },
      },
    });

    const upcomingDeliverables: UpcomingDeliverable[] = [];

    for (const company of companies) {
      for (const delivery of company.deliveries) {
        if (delivery.dueDate) {
          upcomingDeliverables.push({
            id: delivery.id,
            type: "delivery",
            title: delivery.title,
            date: delivery.dueDate.toISOString(),
            nextDate: delivery.cadence 
              ? calculateNextDate(delivery.dueDate, delivery.cadence)?.toISOString() || null
              : null,
            cadence: delivery.cadence,
            companyId: company.id,
            companyName: company.name,
            csOwnerId: company.csOwnerId,
          });
        }
      }

      for (const workshop of company.workshops) {
        upcomingDeliverables.push({
          id: workshop.id,
          type: "workshop",
          title: workshop.title,
          date: workshop.date.toISOString(),
          nextDate: workshop.cadence
            ? calculateNextDate(workshop.date, workshop.cadence)?.toISOString() || null
            : null,
          cadence: workshop.cadence,
          companyId: company.id,
          companyName: company.name,
          csOwnerId: company.csOwnerId,
        });
      }

      for (const hotseat of company.hotseats) {
        upcomingDeliverables.push({
          id: hotseat.id,
          type: "hotseat",
          title: hotseat.title,
          date: hotseat.date.toISOString(),
          nextDate: hotseat.cadence
            ? calculateNextDate(hotseat.date, hotseat.cadence)?.toISOString() || null
            : null,
          cadence: hotseat.cadence,
          companyId: company.id,
          companyName: company.name,
          csOwnerId: company.csOwnerId,
        });
      }

      for (const meeting of company.meetings) {
        const meetingCadence = meeting.recurrence === "WEEKLY" ? "WEEKLY" 
          : meeting.recurrence === "BIWEEKLY" ? "BIWEEKLY"
          : meeting.recurrence === "MONTHLY" ? "MONTHLY"
          : meeting.recurrence === "QUARTERLY" ? "MONTHLY"
          : null;

        upcomingDeliverables.push({
          id: meeting.id,
          type: "meeting",
          title: meeting.title,
          date: meeting.date.toISOString(),
          nextDate: meetingCadence
            ? calculateNextDate(meeting.date, meetingCadence)?.toISOString() || null
            : null,
          cadence: meeting.recurrence,
          companyId: company.id,
          companyName: company.name,
          csOwnerId: company.csOwnerId,
        });
      }
    }

    upcomingDeliverables.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(upcomingDeliverables);
  } catch (error) {
    console.error("Erro ao buscar próximas entregas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar próximas entregas" },
      { status: 500 }
    );
  }
}
