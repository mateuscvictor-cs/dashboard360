import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";

const FATHOM_BASE_URL = "https://api.fathom.ai/external/v1";

type FathomMeeting = {
  title: string;
  meeting_title?: string;
  recording_id: number;
  url: string;
  share_url: string;
  created_at: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  recording_start_time?: string;
  recording_end_time?: string;
  transcript_language?: string;
  calendar_invitees?: Array<{
    name: string;
    email: string;
    email_domain: string;
    is_external: boolean;
  }>;
  recorded_by?: {
    name: string;
    email: string;
  };
  transcript?: Array<{
    speaker: {
      display_name: string;
      matched_calendar_invitee_email?: string;
    };
    text: string;
    timestamp: string;
  }>;
  default_summary?: {
    template_name: string;
    markdown_formatted: string;
  };
  action_items?: Array<{
    description: string;
    user_generated: boolean;
    completed: boolean;
    recording_timestamp?: string;
    recording_playback_url?: string;
    assignee?: {
      name: string;
      email: string;
    };
  }>;
};

type FathomMeetingsResponse = {
  limit: number;
  next_cursor: string | null;
  items: FathomMeeting[];
};

async function fathomFetch<T>(
  apiKey: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${FATHOM_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fathom API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export const fathomService = {
  async getUserApiKey(userId: string): Promise<string | null> {
    const integration = await prisma.userIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: "fathom",
        },
      },
    });

    if (!integration || !integration.isActive) {
      return null;
    }

    try {
      return decrypt(integration.encryptedKey, integration.keyIv);
    } catch {
      return null;
    }
  },

  async testConnection(apiKey: string): Promise<boolean> {
    try {
      await fathomFetch<FathomMeetingsResponse>(apiKey, "/meetings?limit=1");
      return true;
    } catch {
      return false;
    }
  },

  async listMeetings(
    apiKey: string,
    options?: {
      createdAfter?: string;
      createdBefore?: string;
      includeTranscript?: boolean;
      includeSummary?: boolean;
      includeActionItems?: boolean;
      cursor?: string;
    }
  ): Promise<FathomMeetingsResponse> {
    const params = new URLSearchParams();

    if (options?.createdAfter) {
      params.set("created_after", options.createdAfter);
    }
    if (options?.createdBefore) {
      params.set("created_before", options.createdBefore);
    }
    if (options?.includeTranscript) {
      params.set("include_transcript", "true");
    }
    if (options?.includeSummary) {
      params.set("include_summary", "true");
    }
    if (options?.includeActionItems) {
      params.set("include_action_items", "true");
    }
    if (options?.cursor) {
      params.set("cursor", options.cursor);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/meetings?${queryString}` : "/meetings";

    return fathomFetch<FathomMeetingsResponse>(apiKey, endpoint);
  },

  async getMeetingDetails(
    apiKey: string,
    recordingId: string
  ): Promise<FathomMeeting | null> {
    try {
      const response = await this.listMeetings(apiKey, {
        includeTranscript: true,
        includeSummary: true,
        includeActionItems: true,
      });

      const meeting = response.items.find(
        (m) => m.recording_id.toString() === recordingId
      );

      return meeting || null;
    } catch {
      return null;
    }
  },

  formatTranscript(
    transcript: FathomMeeting["transcript"]
  ): string {
    if (!transcript || transcript.length === 0) {
      return "";
    }

    return transcript
      .map((entry) => {
        const speaker = entry.speaker.display_name || "Desconhecido";
        const time = entry.timestamp || "";
        return `[${time}] ${speaker}: ${entry.text}`;
      })
      .join("\n\n");
  },

  async syncMeetingWithBooking(
    userId: string,
    bookingId: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      fathomUrl: string;
      transcript: string;
      summary: string;
      actionItems: FathomMeeting["action_items"];
    };
  }> {
    const apiKey = await this.getUserApiKey(userId);
    if (!apiKey) {
      return { success: false, message: "Fathom não configurado" };
    }

    const booking = await prisma.calendlyBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { success: false, message: "Agendamento não encontrado" };
    }

    if (booking.fathomRecordingId) {
      const meeting = await this.getMeetingDetails(apiKey, booking.fathomRecordingId);
      if (meeting) {
        const formattedTranscript = this.formatTranscript(meeting.transcript);
        const summary = meeting.default_summary?.markdown_formatted || "";

        await prisma.calendlyBooking.update({
          where: { id: bookingId },
          data: {
            fathomUrl: meeting.share_url || meeting.url,
            transcript: formattedTranscript,
            summary,
            actionItems: meeting.action_items || [],
          },
        });

        return {
          success: true,
          message: "Dados sincronizados com sucesso",
          data: {
            fathomUrl: meeting.share_url || meeting.url,
            transcript: formattedTranscript,
            summary,
            actionItems: meeting.action_items,
          },
        };
      }
    }

    const startTime = new Date(booking.startTime);
    const searchStart = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
    const searchEnd = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

    const meetings = await this.listMeetings(apiKey, {
      createdAfter: searchStart.toISOString(),
      createdBefore: searchEnd.toISOString(),
      includeTranscript: true,
      includeSummary: true,
      includeActionItems: true,
    });

    let matchedMeeting: FathomMeeting | null = null;

    for (const meeting of meetings.items) {
      const inviteeEmails =
        meeting.calendar_invitees?.map((i) => i.email.toLowerCase()) || [];

      if (inviteeEmails.includes(booking.attendeeEmail.toLowerCase())) {
        const meetingTime = meeting.scheduled_start_time || meeting.recording_start_time;
        if (meetingTime) {
          const meetingDate = new Date(meetingTime);
          const timeDiff = Math.abs(meetingDate.getTime() - startTime.getTime());
          if (timeDiff < 2 * 60 * 60 * 1000) {
            matchedMeeting = meeting;
            break;
          }
        }
      }
    }

    if (!matchedMeeting) {
      return {
        success: false,
        message: "Nenhuma reunião correspondente encontrada no Fathom",
      };
    }

    const formattedTranscript = this.formatTranscript(matchedMeeting.transcript);
    const summary = matchedMeeting.default_summary?.markdown_formatted || "";

    await prisma.calendlyBooking.update({
      where: { id: bookingId },
      data: {
        fathomRecordingId: matchedMeeting.recording_id.toString(),
        fathomUrl: matchedMeeting.share_url || matchedMeeting.url,
        transcript: formattedTranscript,
        summary,
        actionItems: matchedMeeting.action_items || [],
      },
    });

    return {
      success: true,
      message: "Reunião encontrada e sincronizada",
      data: {
        fathomUrl: matchedMeeting.share_url || matchedMeeting.url,
        transcript: formattedTranscript,
        summary,
        actionItems: matchedMeeting.action_items,
      },
    };
  },
};
