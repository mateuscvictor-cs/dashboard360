import prisma from "@/lib/db";

const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_BASE_URL = process.env.CALCOM_BASE_URL || "https://api.cal.com/v2";
const CALCOM_TEAM_ID = process.env.CALCOM_TEAM_ID || process.env.CALCOM_ORG_ID;
const CALCOM_TEAM_SLUG = process.env.CALCOM_TEAM_SLUG || "vanguardia";

type CalComEventType = "ONBOARDING" | "DELIVERY" | "CHECKIN" | "GENERAL";
type CalComBookingStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW";

async function calComFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${CALCOM_BASE_URL}${endpoint}`;
  console.log(`[Cal.com] Request: ${options.method || "GET"} ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "cal-api-version": "2024-08-13",
      Authorization: `Bearer ${CALCOM_API_KEY}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Cal.com] Error ${response.status}: ${error}`);
    throw new Error(`Cal.com API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log(`[Cal.com] Response:`, JSON.stringify(data).slice(0, 200));
  return data;
}

interface CalComEventTypeResponse {
  status: string;
  data: Array<{
    id: number;
    slug: string;
    title: string;
    lengthInMinutes: number;
    description?: string;
  }>;
}

interface CalComSlotsResponse {
  status: string;
  data: {
    slots: Record<string, Array<{ time: string }>>;
  };
}

interface CalComBookingResponse {
  status: string;
  data: {
    id: number;
    uid: string;
    title: string;
    start: string;
    end: string;
    status: string;
    meetingUrl?: string;
    attendees: Array<{
      name: string;
      email: string;
      timeZone: string;
    }>;
  };
}

export const calComService = {
  async getCSOwnerConfig(csOwnerId: string) {
    return prisma.calComConfig.findUnique({
      where: { csOwnerId },
    });
  },

  async saveCSOwnerConfig(
    csOwnerId: string,
    data: { calComUsername: string; calComUserId?: number; defaultScheduleId?: number }
  ) {
    return prisma.calComConfig.upsert({
      where: { csOwnerId },
      update: data,
      create: { csOwnerId, ...data },
    });
  },

  async createBookingLink(params: {
    csOwnerId: string;
    eventType: CalComEventType;
    companyId?: string;
    deliveryId?: string;
    prefillName?: string;
    prefillEmail?: string;
  }) {
    const config = await this.getCSOwnerConfig(params.csOwnerId);
    if (!config) {
      throw new Error("CS Owner não configurado no Cal.com");
    }

    const eventTypes = await this.getEventTypes();
    const eventType = eventTypes[0];
    if (!eventType) {
      throw new Error("Nenhum tipo de evento disponível no Cal.com");
    }

    const metadata = {
      csOwnerId: params.csOwnerId,
      eventType: params.eventType,
      ...(params.companyId && { companyId: params.companyId }),
      ...(params.deliveryId && { deliveryId: params.deliveryId }),
    };

    const queryParams = new URLSearchParams();
    queryParams.set("metadata", JSON.stringify(metadata));
    if (params.prefillName) queryParams.set("name", params.prefillName);
    if (params.prefillEmail) queryParams.set("email", params.prefillEmail);

    return `https://cal.com/${config.calComUsername}/${eventType.slug}?${queryParams.toString()}`;
  },

  async getEventTypes() {
    try {
      if (CALCOM_TEAM_ID) {
        console.log(`[Cal.com] Fetching team event types for team ${CALCOM_TEAM_ID}`);
        const response = await calComFetch<CalComEventTypeResponse>(`/teams/${CALCOM_TEAM_ID}/event-types`);
        if (response.data && response.data.length > 0) {
          return response.data;
        }
      }
    } catch (err) {
      console.error("[Cal.com] Failed to fetch team event types, trying user event types:", err);
    }
    
    console.log("[Cal.com] Fetching user event types");
    const response = await calComFetch<CalComEventTypeResponse>("/event-types");
    return response.data;
  },

  async getAvailableSlots(params: {
    eventTypeId?: number;
    eventTypeSlug?: string;
    username?: string;
    teamSlug?: string;
    startTime: string;
    endTime: string;
    timeZone?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params.eventTypeId) {
      queryParams.set("eventTypeId", String(params.eventTypeId));
    } else if (params.eventTypeSlug) {
      queryParams.set("eventTypeSlug", params.eventTypeSlug);
      if (params.teamSlug || CALCOM_TEAM_SLUG) {
        queryParams.set("orgSlug", params.teamSlug || CALCOM_TEAM_SLUG!);
      } else if (params.username) {
        queryParams.set("username", params.username);
      }
    }
    queryParams.set("startTime", params.startTime);
    queryParams.set("endTime", params.endTime);
    queryParams.set("timeZone", params.timeZone || "America/Sao_Paulo");

    console.log("[Cal.com Slots] Query params:", queryParams.toString());
    
    const response = await calComFetch<CalComSlotsResponse>(`/slots/available?${queryParams.toString()}`);
    
    console.log("[Cal.com Slots] Raw response:", JSON.stringify(response).slice(0, 500));
    
    if (response.data && response.data.slots) {
      return response.data.slots;
    }
    
    if (response.data && Array.isArray(response.data)) {
      const formatted: Record<string, Array<{ time: string }>> = {};
      for (const slot of response.data as Array<{ time: string }>) {
        const date = slot.time.split("T")[0];
        if (!formatted[date]) formatted[date] = [];
        formatted[date].push(slot);
      }
      return formatted;
    }
    
    return {};
  },

  async createBooking(params: {
    eventTypeId?: number;
    eventTypeSlug?: string;
    username?: string;
    teamSlug?: string;
    start: string;
    attendee: {
      name: string;
      email: string;
      timeZone?: string;
    };
    metadata?: Record<string, string>;
    lengthInMinutes?: number;
  }) {
    const body: Record<string, unknown> = {
      start: params.start,
      attendee: {
        name: params.attendee.name,
        email: params.attendee.email,
        timeZone: params.attendee.timeZone || "America/Sao_Paulo",
      },
    };

    if (params.eventTypeId) {
      body.eventTypeId = params.eventTypeId;
    } else if (params.eventTypeSlug) {
      body.eventTypeSlug = params.eventTypeSlug;
      if (params.teamSlug || CALCOM_TEAM_SLUG) {
        body.teamSlug = params.teamSlug || CALCOM_TEAM_SLUG;
      } else if (params.username) {
        body.username = params.username;
      }
    }

    if (params.metadata) {
      body.metadata = params.metadata;
    }

    if (params.lengthInMinutes) {
      body.lengthInMinutes = params.lengthInMinutes;
    }

    const response = await calComFetch<CalComBookingResponse>("/bookings", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return response.data;
  },

  async createAndSaveBooking(params: {
    csOwnerId: string;
    eventTypeId?: number;
    eventTypeSlug?: string;
    start: string;
    attendeeName: string;
    attendeeEmail: string;
    companyId?: string;
    deliveryId?: string;
    eventType?: CalComEventType;
    lengthInMinutes?: number;
  }) {
    const metadata: Record<string, string> = {
      csOwnerId: params.csOwnerId,
      eventType: params.eventType || "GENERAL",
    };
    if (params.companyId) metadata.companyId = params.companyId;
    if (params.deliveryId) metadata.deliveryId = params.deliveryId;

    const calBooking = await this.createBooking({
      eventTypeId: params.eventTypeId,
      eventTypeSlug: params.eventTypeSlug,
      teamSlug: CALCOM_TEAM_SLUG,
      start: params.start,
      attendee: {
        name: params.attendeeName,
        email: params.attendeeEmail,
        timeZone: "America/Sao_Paulo",
      },
      metadata,
      lengthInMinutes: params.lengthInMinutes,
    });

    const booking = await prisma.calComBooking.create({
      data: {
        calComBookingId: calBooking.id,
        calComUid: calBooking.uid,
        eventType: params.eventType || "GENERAL",
        eventTypeSlug: params.eventTypeSlug || "meeting",
        title: calBooking.title,
        startTime: new Date(calBooking.start),
        endTime: new Date(calBooking.end),
        meetingUrl: calBooking.meetingUrl,
        csOwnerId: params.csOwnerId,
        companyId: params.companyId,
        deliveryId: params.deliveryId,
        attendeeEmail: params.attendeeEmail,
        attendeeName: params.attendeeName,
        metadata,
      },
    });

    if (params.companyId) {
      await prisma.timelineEvent.create({
        data: {
          companyId: params.companyId,
          type: "MEETING",
          title: `Reunião agendada: ${calBooking.title}`,
          description: `Reunião com ${params.attendeeName} em ${new Date(calBooking.start).toLocaleDateString("pt-BR")}`,
          date: new Date(),
        },
      });
    }

    return { calBooking, booking };
  },

  async getBookings(
    csOwnerId: string,
    filters?: {
      status?: CalComBookingStatus;
      startDate?: Date;
      endDate?: Date;
      companyId?: string;
    }
  ) {
    return prisma.calComBooking.findMany({
      where: {
        csOwnerId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.companyId && { companyId: filters.companyId }),
        ...(filters?.startDate && { startTime: { gte: filters.startDate } }),
        ...(filters?.endDate && { startTime: { lte: filters.endDate } }),
      },
      include: {
        company: { select: { id: true, name: true, logo: true } },
        delivery: { select: { id: true, title: true } },
      },
      orderBy: { startTime: "desc" },
    });
  },

  async getBookingsByCompany(companyId: string) {
    return prisma.calComBooking.findMany({
      where: { companyId },
      include: {
        csOwner: { select: { id: true, name: true, avatar: true } },
        delivery: { select: { id: true, title: true } },
      },
      orderBy: { startTime: "desc" },
    });
  },

  async getUpcomingBookings(csOwnerId: string, limit = 10) {
    return prisma.calComBooking.findMany({
      where: {
        csOwnerId,
        status: "SCHEDULED",
        startTime: { gte: new Date() },
      },
      include: {
        company: { select: { id: true, name: true, logo: true } },
        delivery: { select: { id: true, title: true } },
      },
      orderBy: { startTime: "asc" },
      take: limit,
    });
  },

  async createBookingFromWebhook(data: {
    bookingId: number;
    uid: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    meetingUrl?: string;
    attendeeEmail: string;
    attendeeName: string;
    metadata?: Record<string, string>;
  }) {
    const metadata = data.metadata || {};
    const csOwnerId = metadata.csOwnerId;
    const eventType = (metadata.eventType as CalComEventType) || "GENERAL";
    const companyId = metadata.companyId;
    const deliveryId = metadata.deliveryId;

    if (!csOwnerId) {
      const config = await prisma.calComConfig.findFirst();
      if (!config) throw new Error("Nenhum CS Owner configurado");
      metadata.csOwnerId = config.csOwnerId;
    }

    const booking = await prisma.calComBooking.create({
      data: {
        calComBookingId: data.bookingId,
        calComUid: data.uid,
        eventType,
        eventTypeSlug: "meeting",
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        meetingUrl: data.meetingUrl,
        csOwnerId: csOwnerId || metadata.csOwnerId,
        companyId,
        deliveryId,
        attendeeEmail: data.attendeeEmail,
        attendeeName: data.attendeeName,
        metadata,
      },
    });

    if (companyId) {
      await prisma.timelineEvent.create({
        data: {
          companyId,
          type: "MEETING",
          title: `Reunião agendada: ${data.title}`,
          description: `Reunião com ${data.attendeeName} em ${new Date(data.startTime).toLocaleDateString("pt-BR")}`,
          date: new Date(),
        },
      });
    }

    return booking;
  },

  async updateBookingStatus(
    calComUid: string,
    status: CalComBookingStatus,
    newStartTime?: string,
    newEndTime?: string
  ) {
    const updateData: {
      status: CalComBookingStatus;
      startTime?: Date;
      endTime?: Date;
    } = { status };

    if (newStartTime) updateData.startTime = new Date(newStartTime);
    if (newEndTime) updateData.endTime = new Date(newEndTime);

    const booking = await prisma.calComBooking.update({
      where: { calComUid },
      data: updateData,
    });

    if (booking.companyId) {
      const statusLabels: Record<CalComBookingStatus, string> = {
        SCHEDULED: "agendada",
        COMPLETED: "concluída",
        CANCELLED: "cancelada",
        RESCHEDULED: "reagendada",
        NO_SHOW: "não compareceu",
      };

      await prisma.timelineEvent.create({
        data: {
          companyId: booking.companyId,
          type: "MEETING",
          title: `Reunião ${statusLabels[status]}`,
          description: booking.title,
          date: new Date(),
        },
      });
    }

    return booking;
  },
};
