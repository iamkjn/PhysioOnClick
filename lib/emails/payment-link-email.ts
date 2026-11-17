import { renderEmailLayout, toPlainText } from "@/lib/emails/email-layout";
import { formatPounds } from "@/lib/home-visit-pricing";

// Payment request for a physio-arranged treatment package. Sent only when the
// admin presses "Email payment link" — never automatically.

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export type PaymentLinkEmailInput = {
  recipientName: string;
  /** Set when the recipient is a carer paying for someone else. */
  patientName?: string;
  packageTitle: string;
  sessionsLine: string;
  datesLine: string;
  amountPence: number;
  payUrl: string;
};

export function buildPaymentLinkEmail(input: PaymentLinkEmailInput): { subject: string; html: string; text: string } {
  const greeting = input.recipientName ? `Hello ${input.recipientName},` : "Hello,";
  const amount = formatPounds(input.amountPence);
  const forWhom = input.patientName ? ` for ${input.patientName}` : "";
  const subject = `Payment for your treatment plan${forWhom} - PhysioOnClick`;
  const rows = [
    ["Plan", input.packageTitle],
    ["Sessions", input.sessionsLine],
    ...(input.datesLine ? [["Dates", input.datesLine]] : []),
    ["Amount", amount],
  ];

  const html = renderEmailLayout({
    preheader: `${amount} for ${input.packageTitle}${forWhom}`,
    bodyHtml: `
      <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 16px;">Here is the payment link for the physiotherapy treatment plan${escapeHtml(forWhom)}. You can pay securely by card, Apple Pay or Google Pay.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; background:#F7F4ED; border-radius:10px;">
        <tr><td style="padding:16px 20px; font-size:14px;">
          ${rows.map(([k, v]) => `<p style="margin:0 0 6px;"><strong>${k}:</strong> ${escapeHtml(v)}</p>`).join("")}
        </td></tr>
      </table>
      <p style="margin:0 0 20px;">
        <a href="${input.payUrl}" style="display:inline-block; background:#0EA5E9; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:8px; font-weight:700; font-size:16px;">Pay ${amount} securely</a>
      </p>
      <p style="margin:0; font-size:13px; color:#5B6475;">You'll get a receipt and invoice by email once it's paid. Any questions, just reply to this email.</p>
    `,
  });
  const text = toPlainText(
    `${greeting}\n\nHere is the payment link for the physiotherapy treatment plan${forWhom}.\n\n${rows
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n")}\n\nPay securely: ${input.payUrl}\n\nYou'll get a receipt and invoice by email once it's paid. Any questions, just reply to this email.`,
  );
  return { subject, html, text };
}
