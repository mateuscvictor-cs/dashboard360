import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { calComService } from "@/services/calcom.service";
import { emailService } from "@/services/email.service";

const WEBHOOK_SECRET = process.env.CALCOM_WEBHOOK_SECRET;

type WebhookPayload = {
  triggerEvent: string;
  createdAt: string;
  payload: {
    bookingId?: number;
    uid?: string;
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
    meetingUrl?: string;
    metadata?: Record<string, string>;
    attendees?: Array<{ email: string; name: string; timeZone: string }>;
    organizer?: { email: string; name: string; timeZone: string };
    rescheduleUid?: string;
    rescheduleStartTime?: string;
    rescheduleEndTime?: string;
  };
};

function verifySignature(payload: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return !WEBHOOK_SECRET;
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-cal-signature-256");

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    const data: WebhookPayload = JSON.parse(rawBody);
    const { triggerEvent, payload } = data;

    console.log(`[Cal.com Webhook] ${triggerEvent}`);

    switch (triggerEvent) {
      case "BOOKING_CREATED": {
        if (!payload.bookingId || !payload.uid) break;
        const attendee = payload.attendees?.[0];
        if (!attendee) break;

        const booking = await calComService.createBookingFromWebhook({
          bookingId: payload.bookingId,
          uid: payload.uid,
          title: payload.title || "Reunião",
          description: payload.description,
          startTime: payload.startTime!,
          endTime: payload.endTime!,
          meetingUrl: payload.meetingUrl,
          attendeeEmail: attendee.email,
          attendeeName: attendee.name,
          metadata: payload.metadata,
        });

        await emailService.sendMeetingConfirmation({
          to: attendee.email,
          attendeeName: attendee.name,
          meetingTitle: booking.title,
          meetingDate: booking.startTime,
          meetingUrl: booking.meetingUrl || undefined,
          csOwnerName: payload.organizer?.name || "Seu CS",
        });

        if (payload.organizer?.email) {
          await emailService.sendMeetingNotificationToCS({
            to: payload.organizer.email,
            csName: payload.organizer.name,
            attendeeName: attendee.name,
            attendeeEmail: attendee.email,
            meetingTitle: booking.title,
            meetingDate: booking.startTime,
          });
        }
        break;
      }

      case "BOOKING_CANCELLED": {
        if (!payload.uid) break;
        const booking = await calComService.updateBookingStatus(payload.uid, "CANCELLED");
        const attendee = payload.attendees?.[0];
        if (attendee) {
          await emailService.sendMeetingCancellation({
            to: attendee.email,
            attendeeName: attendee.name,
            meetingTitle: booking.title,
            meetingDate: booking.startTime,
          });
        }
        break;
      }

      case "BOOKING_RESCHEDULED": {
        const uid = payload.rescheduleUid || payload.uid;
        if (!uid) break;
        const newStart = payload.rescheduleStartTime || payload.startTime;
        const newEnd = payload.rescheduleEndTime || payload.endTime;
        const booking = await calComService.updateBookingStatus(uid, "RESCHEDULED", newStart, newEnd);
        const attendee = payload.attendees?.[0];
        if (attendee && newStart) {
          await emailService.sendMeetingRescheduled({
            to: attendee.email,
            attendeeName: attendee.name,
            meetingTitle: booking.title,
            oldDate: booking.startTime,
            newDate: new Date(newStart),
            meetingUrl: booking.meetingUrl || undefined,
          });
        }
        break;
      }

      case "MEETING_ENDED": {
        if (payload.uid) await calComService.updateBookingStatus(payload.uid, "COMPLETED");
        break;
      }

      case "BOOKING_NO_SHOW": {
        if (payload.uid) await calComService.updateBookingStatus(payload.uid, "NO_SHOW");
        break;
      }
    }

    return NextResponse.json({ status: "ok", event: triggerEvent });
  } catch (error) {
    console.error("[Cal.com Webhook] Erro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Cal.com webhook endpoint" });
}
