// Server-only: tells the practice owner that money has arrived. Separate from
// the patient's receipt so the patient never sees the owner's address.
// Recipients come from PAYMENT_NOTIFY_EMAIL (comma-separated); unset = off.
import { formatGbp } from "@/lib/invoice";
import { renderEmailLayout, toPlainText } from "@/lib/emails/email-layout";
import { homeVisitLabel, type VisitType } from "@/lib/home-visit";

export type PaymentProblem = "slot_unavailable" | "booking_failed" | "package_missing";

const PROBLEMS: Record<PaymentProblem, string> = {
  slot_unavailable: "The money was taken but the appointment time had already gone, so nothing was booked.",
  booking_failed: "The money was taken but the calendar booking failed, so nothing was booked.",
  package_missing: "The money was taken but the treatment package it was for could not be found.",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ukDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function sendPaymentNotification(input: {
  amountPence: number;
  patientName: string;
  patientEmail: string;
  serviceLabel: string;
  paidAtISO: string;
  stripeSessionId: string;
  invoiceNumber?: string;
  /** Booked appointment start; packages pass appointmentText instead. */
  appointmentISO?: string;
  appointmentText?: string;
  visitType?: VisitType;
  homeVisitAddress?: string;
  pdf?: { filename: string; base64: string };
  /** Set when money was taken but something then went wrong. */
  problem?: PaymentProblem;
}): Promise<{ sent: boolean }> {
  const to = (process.env.PAYMENT_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || to.length === 0) {
    console.log("[payment-notification] RESEND_API_KEY or PAYMENT_NOTIFY_EMAIL unset; skipping");
    return { sent: false };
  }

  try {
    const amount = formatGbp(input.amountPence);
    const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
    const subject = input.problem
      ? `Action needed: ${amount} paid by ${input.patientName} but not completed`
      : `Payment received: ${amount} from ${input.patientName}${input.invoiceNumber ? ` (${input.invoiceNumber})` : ""}`;
    const intro = input.problem
      ? `${PROBLEMS[input.problem]} Please check it in Stripe, then rebook the patient or refund them.`
      : "You have received a payment.";
    const appointment = input.appointmentISO ? ukDateTime(input.appointmentISO) : input.appointmentText;
    const where = homeVisitLabel(input.visitType, input.homeVisitAddress);
    const rows: Array<[string, string | undefined | null]> = [
      ["Amount", amount],
      ["Patient", input.patientName],
      ["Patient email", input.patientEmail],
      ["Service", input.serviceLabel],
      [input.appointmentISO ? "Appointment" : "Dates", appointment],
      ["Where", where],
      ["Paid on", ukDateTime(input.paidAtISO)],
      ["Invoice", input.invoiceNumber],
      ["Stripe reference", input.stripeSessionId],
    ];
    const shown = rows.filter((row): row is [string, string] => Boolean(row[1]));

    const html = renderEmailLayout({
      preheader: escapeHtml(subject),
      bodyHtml: `
        <p style="margin:0 0 16px;">${escapeHtml(intro)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4ED; border-radius:10px;">
          <tr><td style="padding:16px 20px; font-size:14px;">
            ${shown.map(([label, value]) => `<p style="margin:0 0 6px;"><strong>${label}:</strong> ${escapeHtml(value)}</p>`).join("")}
          </td></tr>
        </table>
      `,
    });
    const text = toPlainText(`${intro}\n\n${shown.map(([label, value]) => `${label}: ${value}`).join("\n")}`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text,
        ...(input.pdf ? { attachments: [{ filename: input.pdf.filename, content: input.pdf.base64 }] } : {}),
      }),
    });
    if (!response.ok) {
      console.error("[payment-notification] Resend error", response.status);
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("[payment-notification] send failed", error);
    return { sent: false };
  }
}
