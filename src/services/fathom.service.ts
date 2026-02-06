import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { translateFathomToPortuguese } from "@/services/ai.service";

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
    params.set("limit", "100");

    const queryString = params.toString();
    const endpoint = queryString ? `/meetings?${queryString}` : "/meetings";

    return fathomFetch<FathomMeetingsResponse>(apiKey, endpoint);
  },

  extractRecordingIdFromUrl(url: string): string | null {
    try {
      const u = url.trim();
      const callsMatch = u.match(/fathom\.video\/calls\/(\d+)/i);
      if (callsMatch) return callsMatch[1];
      const recMatch = u.match(/fathom\.video\/recordings\/(\d+)/i);
      if (recMatch) return recMatch[1];
      const appCallsMatch = u.match(/app\.fathom\.video\/[^/]+\/calls\/(\d+)/i);
      if (appCallsMatch) return appCallsMatch[1];
      return null;
    } catch {
      return null;
    }
  },

  async getRecordingByDirectId(
    apiKey: string,
    recordingId: string
  ): Promise<FathomMeeting | null> {
    try {
      const [transcriptRes, summaryRes] = await Promise.all([
        fathomFetch<{ transcript?: FathomMeeting["transcript"] }>(
          apiKey,
          `/recordings/${recordingId}/transcript`
        ),
        fathomFetch<{ summary?: { markdown_formatted?: string } }>(
          apiKey,
          `/recordings/${recordingId}/summary`
        ),
      ]);

      const transcript = transcriptRes.transcript;
      const summary = summaryRes.summary?.markdown_formatted || "";

      return {
        title: "",
        recording_id: parseInt(recordingId, 10),
        url: `https://fathom.video/calls/${recordingId}`,
        share_url: `https://fathom.video/calls/${recordingId}`,
        created_at: "",
        transcript,
        default_summary: summary
          ? { template_name: "general", markdown_formatted: summary }
          : undefined,
        action_items: [],
      };
    } catch {
      return null;
    }
  },

  normalizeFathomUrl(url: string): string {
    try {
      let s = url.trim().toLowerCase();
      const hash = s.indexOf("#");
      if (hash !== -1) s = s.slice(0, hash);
      const q = s.indexOf("?");
      if (q !== -1) s = s.slice(0, q);
      if (s.endsWith("/")) s = s.slice(0, -1);
      return s;
    } catch {
      return url;
    }
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

  async findMeetingByUrl(
    apiKey: string,
    fathomUrl: string,
    options?: { createdAfter?: string; createdBefore?: string }
  ): Promise<FathomMeeting | null> {
    const normalizedInput = this.normalizeFathomUrl(fathomUrl);
    if (!normalizedInput || !normalizedInput.includes("fathom")) return null;

    const createdAfter = options?.createdAfter ?? new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const createdBefore = options?.createdBefore ?? new Date().toISOString();

    let cursor: string | null = null;
    const maxPages = 20;

    for (let page = 0; page < maxPages; page++) {
      const response = await this.listMeetings(apiKey, {
        createdAfter,
        createdBefore,
        includeTranscript: true,
        includeSummary: true,
        includeActionItems: true,
        cursor: cursor ?? undefined,
      });

      for (const meeting of response.items) {
        const u = this.normalizeFathomUrl(meeting.url || "");
        const s = this.normalizeFathomUrl(meeting.share_url || "");
        if (u === normalizedInput || s === normalizedInput) return meeting;
      }

      cursor = response.next_cursor;
      if (!cursor) break;
    }

    return null;
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
    bookingId: string,
    fathomUrlOverride?: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      fathomUrl: string;
      transcript: string;
      summary: string;
      actionItems: Array<{ description: string }>;
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
        const rawSummary = meeting.default_summary?.markdown_formatted || "";
        const rawActionItems = meeting.action_items || [];
        const { summary, actionItems } = await translateFathomToPortuguese(
          rawSummary,
          rawActionItems.map((a) => ({ description: a.description }))
        );

        await prisma.calendlyBooking.update({
          where: { id: bookingId },
          data: {
            fathomUrl: meeting.share_url || meeting.url,
            transcript: formattedTranscript,
            summary,
            actionItems,
          },
        });

        return {
          success: true,
          message: "Dados sincronizados com sucesso",
          data: {
            fathomUrl: meeting.share_url || meeting.url,
            transcript: formattedTranscript,
            summary,
            actionItems,
          },
        };
      }
    }

    const startTime = new Date(booking.startTime);
    let matchedMeeting: FathomMeeting | null = null;
    const fathomUrlToUse = fathomUrlOverride?.trim() || booking.fathomUrl?.trim();

    if (fathomUrlToUse) {
      const recordingIdFromUrl = this.extractRecordingIdFromUrl(fathomUrlToUse);
      if (recordingIdFromUrl) {
        matchedMeeting = await this.getRecordingByDirectId(apiKey, recordingIdFromUrl);
      }
      if (!matchedMeeting) {
        const searchStart = new Date(startTime.getTime() - 60 * 24 * 60 * 60 * 1000);
        const searchEnd = new Date(Math.min(startTime.getTime() + 24 * 60 * 60 * 1000, Date.now()));
        matchedMeeting = await this.findMeetingByUrl(apiKey, fathomUrlToUse, {
          createdAfter: searchStart.toISOString(),
          createdBefore: searchEnd.toISOString(),
        });
      }
    }

    if (!matchedMeeting) {
      const searchStart = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
      const searchEnd = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
      const meetings = await this.listMeetings(apiKey, {
        createdAfter: searchStart.toISOString(),
        createdBefore: searchEnd.toISOString(),
        includeTranscript: true,
        includeSummary: true,
        includeActionItems: true,
      });

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
    }

    if (!matchedMeeting) {
      return {
        success: false,
        message: "Nenhuma reunião correspondente encontrada no Fathom",
      };
    }

    const formattedTranscript = this.formatTranscript(matchedMeeting.transcript);
    const rawSummary = matchedMeeting.default_summary?.markdown_formatted || "";
    const rawActionItems = matchedMeeting.action_items || [];
    const { summary, actionItems } = await translateFathomToPortuguese(
      rawSummary,
      rawActionItems.map((a) => ({ description: a.description }))
    );
    const resolvedUrl = fathomUrlToUse || matchedMeeting.share_url || matchedMeeting.url;

    await prisma.calendlyBooking.update({
      where: { id: bookingId },
      data: {
        fathomRecordingId: matchedMeeting.recording_id.toString(),
        fathomUrl: resolvedUrl,
        transcript: formattedTranscript,
        summary,
        actionItems,
      },
    });

    return {
      success: true,
      message: "Reunião encontrada e sincronizada",
      data: {
        fathomUrl: resolvedUrl,
        transcript: formattedTranscript,
        summary,
        actionItems,
      },
    };
  },
};
