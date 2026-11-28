// Server-only: the "your appointment is tomorrow" email. Sent once, 24 hours
// before an appointment that was added more than 24 hours ahead.
// functions/src/index.ts (sendAppointmentReminders) finds the candidates and
// calls POST /api/appointments/reminder-email, which applies these rules.
// No prices and no payment links belong in this email.
import { minutesFor } from "@/lib/cal-services";
import { renderEmailLayout, toPlainText } from "@/lib/emails/email-layout";
import { formatPersonName } from "@/lib/name-format";
import { founder } from "@/lib/site-data";

export const REMINDER_LEAD_MS = 24 * 3_600_000;

export type ReminderBooking = {
  status?: string;
  email?: string;
  service?: string;
  patientName?: string;
  fullName?: string;
  patientType?: string;
  visitType?: string;
  homeVisitAddress?: string;
  meetingUrl?: string;
  dateOnly?: boolean;
  notes?: string;
  appointmentTime?: string;
  sessionDate?: unknown;
  createdAt?: unknown;
  reminders?: Record<string, unknown>;
};

export function toDate(value: unknown): Date | null {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(value)
        : ((value as { toDate?: () => Date } | null | undefined)?.toDate?.() ?? null);
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export type Due = { due: true; start: Date } | { due: false; reason: string };

export function reminderDue(booking: ReminderBooking, now: Date): Due {
  const no = (reason: string): Due => ({ due: false, reason });
  if (booking.status !== "upcoming") return no("not upcoming");
  if (!booking.email?.includes("@")) return no("no email");
  const start = toDate(booking.sessionDate);
  if (!start) return no("no date");
  const until = start.getTime() - now.getTime();
  if (until <= 0) return no("already started");
  if (until > REMINDER_LEAD_MS) return no("too early");
  const created = toDate(booking.createdAt);
  if (!created) return no("no created date");
  if (start.getTime() - created.getTime() <= REMINDER_LEAD_MS) return no("added within 24 hours");
  // Keyed on the start time, so a moved appointment is reminded again.
  if (booking.reminders?.appointmentReminderFor === start.toISOString()) return no("already sent");
  return { due: true, start };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ukDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });

function ukTime(d: Date): string {
  const [h, m] = d
    .toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false })
    .split(":")
    .map(Number);
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

export function buildReminderEmail(input: {
  booking: ReminderBooking;
  start: Date;
  /** The account holder, who receives the email (may not be the patient). */
  accountName?: string;
  now: Date;
}): { subject: string; html: string; text: string } {
  const { booking, start, now } = input;
  const patient = formatPersonName(booking.patientName || booking.fullName, "");
  const account = formatPersonName(input.accountName, "");
  const isDependent = booking.patientType === "dependent";
  const greetName = (isDependent ? account : account || patient).split(" ")[0];
  const greeting = greetName ? `Hi ${greetName},` : "Hi there,";
  const whose = isDependent && patient ? `${patient.split(" ")[0]}'s` : "your";

  // Visits planned by date only (app/api/admin/packages/[id]/plan) are stored
  // with an 18:00 placeholder, which must not be quoted as the visit time.
  const timeKnown = !(booking.dateOnly && booking.notes === "Planned visit" && booking.appointmentTime === "18:00");
  const home = booking.visitType === "home" || Boolean(booking.homeVisitAddress);
  const followUp = /follow/i.test(booking.service ?? "");
  const kind = home ? "home visit" : "video appointment";
  const what = followUp
    ? `follow-up ${kind}`
    : /assessment/i.test(booking.service ?? "")
      ? `initial assessment ${kind}`
      : kind;

  const when = ukDay(start) === ukDay(now) ? "today" : "tomorrow";
  const date = start
    .toLocaleDateString("en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long" })
    .replace(",", "");
  const at = timeKnown ? ` at ${ukTime(start)}` : "";
  const minutes = minutesFor(followUp ? "follow-up" : "initial-assessment", home ? "home" : "video");
  const length = timeKnown ? ` It takes about ${minutes} minutes.` : "";

  const lead = `This is a reminder that ${whose} ${what} is ${when}, ${date}${at}.${length}`;
  const details: [string, string][] = [];
  if (home && booking.homeVisitAddress) details.push(["Address", booking.homeVisitAddress]);
  if (!home && booking.meetingUrl) details.push(["Video link", booking.meetingUrl]);
  details.push(["Physiotherapist", founder.name.split(" ")[0]]);
  const closing = "If anything has changed, please reply to this email.";

  const subjectWho = isDependent && patient ? `${patient.split(" ")[0]}'s` : "your";
  const subject = `Reminder: ${subjectWho} ${kind} ${when}${at}`;

  const html = renderEmailLayout({
    preheader: escapeHtml(`${date}${at}`),
    bodyHtml: `
      <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 16px;">${escapeHtml(lead)}</p>
      <p style="margin:0 0 16px;">${details
        .map(([label, value]) => `<strong>${label}:</strong> ${escapeHtml(value)}`)
        .join("<br />")}</p>
      <p style="margin:0;">${closing}</p>
    `,
  });
  const text = toPlainText(
    [greeting, "", lead, "", ...details.map(([label, value]) => `${label}: ${value}`), "", closing].join("\n"),
  );
  return { subject, html, text };
}
