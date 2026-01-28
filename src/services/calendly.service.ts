import prisma from "@/lib/db";
import { emailService } from "./email.service";

const CALENDLY_API_KEY = process.env.CALENDLY_API_KEY;
const CALENDLY_BASE_URL = "https://api.calendly.com";
const CALENDLY_ORGANIZATION_URI = process.env.CALENDLY_ORGANIZATION_URI;

type CalendlyEventType = "ONBOARDING" | "DELIVERY" | "CHECKIN" | "GENERAL";
type CalendlyBookingStatus = "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW";

async function calendlyFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${CALENDLY_BASE_URL}${endpoint}`;
  console.log(`[Calendly] Request: ${options.method || "GET"} ${url}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CALENDLY_API_KEY}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Calendly] Error ${response.status}: ${error}`);
    throw new Error(`Calendly API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log(`[Calendly] Response:`, JSON.stringify(data).slice(0, 200));
  return data;
}

interface CalendlyEventTypeResponse {
  collection: Array<{
    uri: string;
    name: string;
    slug: string;
    scheduling_url: string;
    duration: number;
    description_plain?: string;
    active: boolean;
  }>;
  pagination: {
    count: number;
    next_page?: string;
  };
}

interface CalendlyAvailableTimesResponse {
  collection: Array<{
    status: string;
    start_time: string;
    invitees_remaining: number;
    scheduling_url: string;
  }>;
}

interface CalendlyScheduledEventResponse {
  resource: {
    uri: string;
    uuid: string;
    name: string;
    start_time: string;
    end_time: string;
    status: string;
    location?: {
      type: string;
      join_url?: string;
    };
    invitees_counter: {
      total: number;
      active: number;
    };
    event_memberships: Array<{
      user: string;
    }>;
  };
}

interface CalendlyScheduledEventsResponse {
  collection: Array<{
    uri: string;
    uuid: string;
    name: string;
    start_time: string;
    end_time: string;
    status: string;
    location?: {
      type: string;
      join_url?: string;
    };
    event_memberships: Array<{
      user: string;
    }>;
  }>;
  pagination: {
    count: number;
    next_page?: string;
  };
}

interface CalendlyInviteeResponse {
  collection: Array<{
    uri: string;
    email: string;
    name: string;
    timezone: string;
    status: string;
  }>;
}

interface CalendlyUserResponse {
  resource: {
    uri: string;
    name: string;
    slug: string;
    email: string;
    scheduling_url: string;
    current_organization: string;
  };
}

export const calendlyService = {
  async getCurrentUser(): Promise<CalendlyUserResponse["resource"]> {
    const response = await calendlyFetch<CalendlyUserResponse>("/users/me");
    return response.resource;
  },

  async getCSOwnerConfig(csOwnerId: string) {
    return prisma.calendlyConfig.findUnique({
      where: { csOwnerId },
    });
  },

  async saveCSOwnerConfig(
    csOwnerId: string,
    data: { calendlyUsername: string; calendlyUserUri?: string; defaultEventTypeUri?: string }
  ) {
    return prisma.calendlyConfig.upsert({
      where: { csOwnerId },
      update: data,
      create: { csOwnerId, ...data },
    });
  },

  async createBookingLink(params: {
    csOwnerId: string;
    eventType: CalendlyEventType;
    companyId?: string;
    deliveryId?: string;
    prefillName?: string;
    prefillEmail?: string;
  }) {
    const config = await this.getCSOwnerConfig(params.csOwnerId);
    if (!config) {
      throw new Error("CS Owner não configurado no Calendly");
    }

    const eventTypes = await this.getEventTypes(config.calendlyUserUri);
    const eventType = eventTypes[0];
    if (!eventType) {
      throw new Error("Nenhum tipo de evento disponível no Calendly");
    }

    const queryParams = new URLSearchParams();
    if (params.prefillName) queryParams.set("name", params.prefillName);
    if (params.prefillEmail) queryParams.set("email", params.prefillEmail);

    const metadata = {
      csOwnerId: params.csOwnerId,
      eventType: params.eventType,
      ...(params.companyId && { companyId: params.companyId }),
      ...(params.deliveryId && { deliveryId: params.deliveryId }),
    };
    queryParams.set("metadata", JSON.stringify(metadata));

    const baseUrl = eventType.scheduling_url;
    return `${baseUrl}?${queryParams.toString()}`;
  },

  async getEventTypes(userUri?: string) {
    const user = userUri || (await this.getCurrentUser()).uri;
    const params = new URLSearchParams();
    params.set("user", user);
    params.set("active", "true");

    const response = await calendlyFetch<CalendlyEventTypeResponse>(`/event_types?${params.toString()}`);
    return response.collection.map((et) => ({
      id: et.uri,
      uri: et.uri,
      slug: et.slug,
      title: et.name,
      lengthInMinutes: et.duration,
      description: et.description_plain,
      schedulingUrl: et.scheduling_url,
    }));
  },

  async getAvailableSlots(params: {
    eventTypeUri: string;
    startTime: string;
    endTime: string;
  }) {
    const startDate = new Date(params.startTime);
    const endDate = new Date(params.endTime);
    const maxRangeDays = 7;
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const allSlots: Record<string, Array<{ time: string; schedulingUrl: string }>> = {};
    
    let currentStart = new Date(startDate);
    while (currentStart < endDate) {
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + Math.min(maxRangeDays, diffDays));
      if (currentEnd > endDate) {
        currentEnd.setTime(endDate.getTime());
      }

      const queryParams = new URLSearchParams();
      queryParams.set("event_type", params.eventTypeUri);
      queryParams.set("start_time", currentStart.toISOString());
      queryParams.set("end_time", currentEnd.toISOString());

      try {
        const response = await calendlyFetch<CalendlyAvailableTimesResponse>(
          `/event_type_available_times?${queryParams.toString()}`
        );

        for (const slot of response.collection) {
          if (slot.status === "available" && slot.invitees_remaining > 0) {
            const date = slot.start_time.split("T")[0];
            if (!allSlots[date]) allSlots[date] = [];
            allSlots[date].push({ 
              time: slot.start_time,
              schedulingUrl: slot.scheduling_url,
            });
          }
        }
      } catch (error) {
        console.error("[Calendly] Error fetching slots:", error);
      }

      currentStart = new Date(currentEnd);
    }

    return allSlots;
  },

  async createAndSaveBooking(params: {
    csOwnerId: string;
    eventTypeUri: string;
    start: string;
    attendeeName: string;
    attendeeEmail: string;
    companyId?: string;
    deliveryId?: string;
    eventType?: CalendlyEventType;
    lengthInMinutes?: number;
    additionalInvitees?: Array<{ name: string; email: string }>;
    schedulingUrl?: string;
  }) {
    let config = await this.getCSOwnerConfig(params.csOwnerId);
    
    const eventTypes = config?.calendlyUserUri 
      ? await this.getEventTypes(config.calendlyUserUri)
      : await this.getEventTypes();
    
    const selectedEventType = eventTypes.find((et) => et.uri === params.eventTypeUri) || eventTypes[0];
    if (!selectedEventType) {
      throw new Error("Nenhum tipo de evento disponível");
    }

    const queryParams = new URLSearchParams();
    queryParams.set("name", params.attendeeName);
    queryParams.set("email", params.attendeeEmail);

    let bookingLink: string;
    if (params.schedulingUrl) {
      bookingLink = `${params.schedulingUrl}?${queryParams.toString()}`;
    } else {
      const baseUrl = `https://calendly.com/${selectedEventType.slug}`;
      const dateStr = new Date(params.start).toISOString().replace(/\.\d{3}Z$/, "+00:00");
      bookingLink = `${selectedEventType.schedulingUrl}/${dateStr}?${queryParams.toString()}`;
    }

    const endTime = new Date(params.start);
    endTime.setMinutes(endTime.getMinutes() + (params.lengthInMinutes || selectedEventType.lengthInMinutes));

    const tempUuid = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const metadata: Record<string, string> = {
      csOwnerId: params.csOwnerId,
      eventType: params.eventType || "GENERAL",
      tempUuid,
    };
    if (params.companyId) metadata.companyId = params.companyId;
    if (params.deliveryId) metadata.deliveryId = params.deliveryId;
    if (params.additionalInvitees && params.additionalInvitees.length > 0) {
      metadata.additionalInvitees = JSON.stringify(params.additionalInvitees);
    }

    const host = await prisma.user.findUnique({
      where: { id: params.csOwnerId },
      select: { name: true },
    });

    const booking = await prisma.calendlyBooking.create({
      data: {
        calendlyEventUri: `pending:${tempUuid}`,
        calendlyEventUuid: tempUuid,
        eventType: params.eventType || "GENERAL",
        eventTypeSlug: selectedEventType.slug,
        title: `${selectedEventType.title} - ${params.attendeeName}`,
        startTime: new Date(params.start),
        endTime,
        csOwnerId: params.csOwnerId,
        companyId: params.companyId,
        deliveryId: params.deliveryId,
        attendeeEmail: params.attendeeEmail,
        attendeeName: params.attendeeName,
        metadata,
        status: "PENDING",
      },
    });

    if (params.companyId) {
      await prisma.timelineEvent.create({
        data: {
          companyId: params.companyId,
          type: "MEETING",
          title: `Reunião agendada: ${selectedEventType.title}`,
          description: `Reunião com ${params.attendeeName} em ${new Date(params.start).toLocaleDateString("pt-BR")} - Aguardando confirmação`,
          date: new Date(),
        },
      });
    }

    await emailService.sendMeetingInvite({
      to: params.attendeeEmail,
      attendeeName: params.attendeeName,
      meetingTitle: selectedEventType.title,
      meetingDate: new Date(params.start),
      csOwnerName: host?.name || "Equipe Vanguardia",
      confirmationLink: bookingLink,
    });

    if (params.additionalInvitees && params.additionalInvitees.length > 0) {
      for (const invitee of params.additionalInvitees) {
        await emailService.sendMeetingInvite({
          to: invitee.email,
          attendeeName: invitee.name,
          meetingTitle: selectedEventType.title,
          meetingDate: new Date(params.start),
          csOwnerName: host?.name || "Equipe Vanguardia",
          confirmationLink: bookingLink,
        });
      }
    }

    return { bookingLink, booking, requiresConfirmation: true };
  },

  async getBookings(
    csOwnerId: string,
    filters?: {
      status?: CalendlyBookingStatus;
      startDate?: Date;
      endDate?: Date;
      companyId?: string;
    }
  ) {
    return prisma.calendlyBooking.findMany({
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
    return prisma.calendlyBooking.findMany({
      where: { companyId },
      include: {
        csOwner: { select: { id: true, name: true, avatar: true } },
        delivery: { select: { id: true, title: true } },
      },
      orderBy: { startTime: "desc" },
    });
  },

  async getUpcomingBookings(csOwnerId: string, limit = 10) {
    return prisma.calendlyBooking.findMany({
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
    eventUri: string;
    eventUuid: string;
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
    const eventType = (metadata.eventType as CalendlyEventType) || "GENERAL";
    const companyId = metadata.companyId;
    const deliveryId = metadata.deliveryId;

    if (!csOwnerId) {
      const config = await prisma.calendlyConfig.findFirst();
      if (!config) throw new Error("Nenhum CS Owner configurado");
      metadata.csOwnerId = config.csOwnerId;
    }

    const existingByUri = await prisma.calendlyBooking.findFirst({
      where: {
        OR: [
          { calendlyEventUri: data.eventUri },
          { calendlyEventUuid: data.eventUuid },
        ],
      },
    });

    if (existingByUri) {
      return prisma.calendlyBooking.update({
        where: { id: existingByUri.id },
        data: {
          calendlyEventUri: data.eventUri,
          calendlyEventUuid: data.eventUuid,
          title: data.title,
          description: data.description,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          meetingUrl: data.meetingUrl,
          status: "SCHEDULED",
        },
      });
    }

    const startTimeDate = new Date(data.startTime);
    const startTimeMin = new Date(startTimeDate.getTime() - 5 * 60 * 1000);
    const startTimeMax = new Date(startTimeDate.getTime() + 5 * 60 * 1000);

    const pendingBooking = await prisma.calendlyBooking.findFirst({
      where: {
        attendeeEmail: data.attendeeEmail,
        status: "PENDING",
        startTime: {
          gte: startTimeMin,
          lte: startTimeMax,
        },
      },
    });

    if (pendingBooking) {
      return prisma.calendlyBooking.update({
        where: { id: pendingBooking.id },
        data: {
          calendlyEventUri: data.eventUri,
          calendlyEventUuid: data.eventUuid,
          title: data.title || pendingBooking.title,
          description: data.description,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          meetingUrl: data.meetingUrl,
          status: "SCHEDULED",
        },
      });
    }

    const booking = await prisma.calendlyBooking.create({
      data: {
        calendlyEventUri: data.eventUri,
        calendlyEventUuid: data.eventUuid,
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
        status: "SCHEDULED",
      },
    });

    if (companyId) {
      await prisma.timelineEvent.create({
        data: {
          companyId,
          type: "MEETING",
          title: `Reunião confirmada: ${data.title}`,
          description: `Reunião com ${data.attendeeName} em ${new Date(data.startTime).toLocaleDateString("pt-BR")}`,
          date: new Date(),
        },
      });
    }

    return booking;
  },

  async updateBookingStatus(
    calendlyEventUuid: string,
    status: CalendlyBookingStatus,
    newStartTime?: string,
    newEndTime?: string
  ) {
    const updateData: {
      status: CalendlyBookingStatus;
      startTime?: Date;
      endTime?: Date;
    } = { status };

    if (newStartTime) updateData.startTime = new Date(newStartTime);
    if (newEndTime) updateData.endTime = new Date(newEndTime);

    const booking = await prisma.calendlyBooking.update({
      where: { calendlyEventUuid },
      data: updateData,
    });

    if (booking.companyId) {
      const statusLabels: Record<CalendlyBookingStatus, string> = {
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

  async cancelBooking(eventUuid: string, reason?: string) {
    try {
      await calendlyFetch(`/scheduled_events/${eventUuid}/cancellation`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || "Cancelado pelo sistema" }),
      });
    } catch (error) {
      console.error("[Calendly] Error cancelling booking:", error);
    }

    return this.updateBookingStatus(eventUuid, "CANCELLED");
  },

  async getScheduledEvents(userUri: string, params?: { minStartTime?: string; maxStartTime?: string; status?: string }) {
    const queryParams = new URLSearchParams();
    queryParams.set("user", userUri);
    if (params?.minStartTime) queryParams.set("min_start_time", params.minStartTime);
    if (params?.maxStartTime) queryParams.set("max_start_time", params.maxStartTime);
    if (params?.status) queryParams.set("status", params.status);

    const response = await calendlyFetch<CalendlyScheduledEventsResponse>(
      `/scheduled_events?${queryParams.toString()}`
    );

    return response.collection;
  },

  async getEventInvitees(eventUuid: string) {
    const response = await calendlyFetch<CalendlyInviteeResponse>(
      `/scheduled_events/${eventUuid}/invitees`
    );
    return response.collection;
  },
};
