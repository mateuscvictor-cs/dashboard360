import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { calendlyService } from "@/services/calendly.service";
import { emailService } from "@/services/email.service";
import prisma from "@/lib/db";

const WEBHOOK_SECRET = process.env.CALENDLY_WEBHOOK_SECRET;

type CalendlyWebhookPayload = {
  event: string;
  created_at: string;
  created_by: string;
  payload: {
    uri?: string;
    name?: string;
    email?: string;
    timezone?: string;
    status?: string;
    cancel_url?: string;
    reschedule_url?: string;
    scheduled_event?: {
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
      invitees_counter?: {
        total: number;
        active: number;
      };
      event_memberships?: Array<{
        user: string;
        user_email: string;
        user_name: string;
      }>;
    };
    tracking?: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_content?: string;
      utm_term?: string;
      salesforce_uuid?: string;
    };
    questions_and_answers?: Array<{
      question: string;
      answer: string;
    }>;
    old_invitee?: {
      uri: string;
      email: string;
      name: string;
    };
    new_invitee?: {
      uri: string;
      email: string;
      name: string;
    };
  };
};

function verifySignature(payload: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return !WEBHOOK_SECRET;

  const parts = signature.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const signaturePart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !signaturePart) return false;

  const timestamp = timestampPart.substring(2);
  const expectedSignature = signaturePart.substring(3);

  const signedPayload = `${timestamp}.${payload}`;
  const computedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(signedPayload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(computedSignature)
  );
}

function extractMetadataFromTracking(tracking?: CalendlyWebhookPayload["payload"]["tracking"]): Record<string, string> {
  if (!tracking) return {};
  
  try {
    if (tracking.utm_content) {
      return JSON.parse(tracking.utm_content);
    }
  } catch {
    // Ignore JSON parse errors
  }
  
  return {};
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("Calendly-Webhook-Signature");

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    const data: CalendlyWebhookPayload = JSON.parse(rawBody);
    const { event, payload } = data;

    console.log(`[Calendly Webhook] ${event}`);

    switch (event) {
      case "invitee.created": {
        const scheduledEvent = payload.scheduled_event;
        if (!scheduledEvent) break;

        const eventUuid = scheduledEvent.uuid || scheduledEvent.uri.split("/").pop() || "";
        const metadata = extractMetadataFromTracking(payload.tracking);

        const booking = await calendlyService.createBookingFromWebhook({
          eventUri: scheduledEvent.uri,
          eventUuid,
          title: scheduledEvent.name,
          startTime: scheduledEvent.start_time,
          endTime: scheduledEvent.end_time,
          meetingUrl: scheduledEvent.location?.join_url,
          attendeeEmail: payload.email || "",
          attendeeName: payload.name || "",
          metadata,
        });

        const organizer = scheduledEvent.event_memberships?.[0];

        await emailService.sendMeetingConfirmation({
          to: payload.email || "",
          attendeeName: payload.name || "",
          meetingTitle: booking.title,
          meetingDate: booking.startTime,
          meetingUrl: booking.meetingUrl || undefined,
          csOwnerName: organizer?.user_name || "Seu CS",
        });

        if (organizer?.user_email) {
          await emailService.sendMeetingNotificationToCS({
            to: organizer.user_email,
            csName: organizer.user_name,
            attendeeName: payload.name || "",
            attendeeEmail: payload.email || "",
            meetingTitle: booking.title,
            meetingDate: booking.startTime,
          });
        }
        break;
      }

      case "invitee.canceled": {
        const scheduledEvent = payload.scheduled_event;
        if (!scheduledEvent) break;

        const eventUuid = scheduledEvent.uuid || scheduledEvent.uri.split("/").pop() || "";

        try {
          const booking = await calendlyService.updateBookingStatus(eventUuid, "CANCELLED");

          await emailService.sendMeetingCancellation({
            to: payload.email || "",
            attendeeName: payload.name || "",
            meetingTitle: booking.title,
            meetingDate: booking.startTime,
          });
        } catch (error) {
          console.error("[Calendly Webhook] Error updating cancelled booking:", error);
        }
        break;
      }

      case "invitee_no_show": {
        const scheduledEvent = payload.scheduled_event;
        if (!scheduledEvent) break;

        const eventUuid = scheduledEvent.uuid || scheduledEvent.uri.split("/").pop() || "";

        try {
          await calendlyService.updateBookingStatus(eventUuid, "NO_SHOW");
        } catch (error) {
          console.error("[Calendly Webhook] Error updating no-show booking:", error);
        }
        break;
      }

      case "routing_form_submission.created": {
        console.log("[Calendly Webhook] Routing form submission received");
        break;
      }
    }

    return NextResponse.json({ status: "ok", event });
  } catch (error) {
    console.error("[Calendly Webhook] Erro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Calendly webhook endpoint" });
}
