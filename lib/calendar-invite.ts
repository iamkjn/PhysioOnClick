// Server-only: puts appointments in the practice's own calendar by emailing a
// standard calendar invite (.ics) to CALENDAR_INVITE_EMAIL. Unset = off.
// Nothing is ever sent to the patient from here, and no clinical notes go in.
import { renderEmailLayout, toPlainText } from "@/lib/emails/email-layout";

export type CalendarEvent = {
  /** Stable per appointment, so a later cancel removes the same event. */
  id: string;
  /** Timed events: the start instant and length. */
  start?: Date;
  minutes?: number;
  /** All-day events (date-only visits): YYYY-MM-DD, used when `start` is unset. */
  date?: string;
  title: string;
  location?: string;
  details?: string[];
  cancelled?: boolean;
};

const ORGANIZER = "hello@physioonclick.co.uk";

function icsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\;").replace(/,/g, "\\,");
}

/** RFC 5545 wants lines no longer than 75 octets; continuations start with a space. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  let out = "";
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (size + bytes > 74) {
      out += "\r\n ";
      size = 1;
    }
    out += char;
    size += bytes;
  }
  return out;
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const dayStamp = (d: Date) => stamp(d).slice(0, 8);

function span(event: CalendarEvent): { start: string; end: string; allDay: boolean } | null {
  if (event.start && !Number.isNaN(event.start.getTime())) {
    const end = new Date(event.start.getTime() + (event.minutes ?? 60) * 60_000);
    return { start: stamp(event.start), end: stamp(end), allDay: false };
  }
  if (event.date) {
    const day = new Date(`${event.date}T12:00:00Z`);
    if (Number.isNaN(day.getTime())) return null;
    return { start: dayStamp(day), end: dayStamp(new Date(day.getTime() + 86_400_000)), allDay: true };
  }
  return null;
}

export function buildIcs(event: CalendarEvent, to: string, now = new Date()): string | null {
  const when = span(event);
  if (!when) return null;
  const value = when.allDay ? ";VALUE=DATE" : "";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PhysioOnClick//Appointments//EN",
    `METHOD:${event.cancelled ? "CANCEL" : "REQUEST"}`,
    "BEGIN:VEVENT",
    `UID:${event.id}@physioonclick.co.uk`,
    // Always increasing, so a cancel or change beats the original invite.
    `SEQUENCE:${Math.floor(now.getTime() / 1000)}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART${value}:${when.start}`,
    `DTEND${value}:${when.end}`,
    `SUMMARY:${icsText(event.title)}`,
    ...(event.location ? [`LOCATION:${icsText(event.location)}`] : []),
    ...(event.details?.length ? [`DESCRIPTION:${icsText(event.details.join("\n"))}`] : []),
    `ORGANIZER;CN=PhysioOnClick:mailto:${ORGANIZER}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=FALSE:mailto:${to}`,
    `STATUS:${event.cancelled ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** "Add to Google Calendar" link, for when the invite isn't added automatically. */
export function googleCalendarUrl(event: CalendarEvent): string {
  const when = span(event);
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", event.title);
  if (when) url.searchParams.set("dates", `${when.start}/${when.end}`);
  if (event.location) url.searchParams.set("location", event.location);
  if (event.details?.length) url.searchParams.set("details", event.details.join("\n"));
  return url.toString();
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function base64(text: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function whenText(event: CalendarEvent): string {
  const date = event.start ?? new Date(`${event.date}T12:00:00Z`);
  return date.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(event.start ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** Never throws: a calendar email must not break a booking. */
export async function sendCalendarInvite(event: CalendarEvent): Promise<{ sent: boolean }> {
  try {
    const to = (process.env.CALENDAR_INVITE_EMAIL ?? "").trim();
    const apiKey = process.env.RESEND_API_KEY;
    if (!to || !apiKey) {
      console.log("[calendar-invite] CALENDAR_INVITE_EMAIL or RESEND_API_KEY unset; skipping");
      return { sent: false };
    }
    const ics = buildIcs(event, to);
    if (!ics) return { sent: false };

    const heading = event.cancelled ? "Appointment cancelled" : "Appointment";
    const subject = `${heading}: ${event.title}, ${whenText(event)}`;
    const rows = [whenText(event), event.location, ...(event.details ?? [])].filter((r): r is string => Boolean(r));
    const link = event.cancelled
      ? ""
      : `<p style="margin:16px 0 0;"><a href="${escapeHtml(googleCalendarUrl(event))}">Add to Google Calendar</a></p>`;
    const html = renderEmailLayout({
      preheader: escapeHtml(subject),
      bodyHtml: `<p style="margin:0 0 16px;"><strong>${escapeHtml(`${heading}: ${event.title}`)}</strong></p>${rows
        .map((r) => `<p style="margin:0 0 6px;">${escapeHtml(r)}</p>`)
        .join("")}${link}`,
    });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
        text: toPlainText(`${heading}: ${event.title}\n${rows.join("\n")}`),
        attachments: [
          {
            filename: "invite.ics",
            content: base64(ics),
            content_type: `text/calendar; charset=utf-8; method=${event.cancelled ? "CANCEL" : "REQUEST"}`,
          },
        ],
      }),
    });
    if (!response.ok) {
      console.error("[calendar-invite] Resend error", response.status);
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("[calendar-invite] send failed", error instanceof Error ? error.message : error);
    return { sent: false };
  }
}
