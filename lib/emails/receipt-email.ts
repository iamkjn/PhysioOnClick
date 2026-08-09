import { formatGbp } from "@/lib/invoice";
import { renderEmailLayout, toPlainText } from "@/lib/emails/email-layout";

/** Escape user-controlled values before interpolating into email HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendReceiptEmail(input: {
  to: string; patientName: string; invoiceNumber: string;
  serviceLabel: string; amountPence: number; receiptUrl: string;
  pdf?: { filename: string; base64: string };
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[receipt-email] RESEND_API_KEY unset; skipping");
    return { sent: false };
  }
  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
  const greeting = input.patientName ? `Hi ${escapeHtml(input.patientName)},` : "Hello,";
  const amount = formatGbp(input.amountPence);
  const html = renderEmailLayout({
    preheader: `Your receipt for ${input.serviceLabel} — ${amount}`,
    bodyHtml: `
      <p style="margin:0 0 16px;">${greeting}</p>
      <p style="margin:0 0 16px;">Thank you for your payment. Here is your receipt for insurance or your records.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; background:#F7F4ED; border-radius:10px;">
        <tr><td style="padding:16px 20px; font-size:14px;">
          <p style="margin:0 0 6px;"><strong>Invoice:</strong> ${input.invoiceNumber}</p>
          <p style="margin:0 0 6px;"><strong>Service:</strong> ${escapeHtml(input.serviceLabel)}</p>
          <p style="margin:0;"><strong>Amount paid:</strong> ${amount}</p>
        </td></tr>
      </table>
      <p style="margin:0;">
        <a href="${input.receiptUrl}" style="display:inline-block; background:#0EA5E9; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:700; font-size:14px;">View or print your full receipt (PDF)</a>
      </p>
    `,
  });
  const text = toPlainText(
    `${greeting}\n\nThank you for your payment. Here is your receipt for insurance or your records.\n\nInvoice: ${input.invoiceNumber}\nService: ${input.serviceLabel}\nAmount paid: ${amount}\n\nView or print your full receipt: ${input.receiptUrl}`
  );
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: `Your payment receipt — ${input.invoiceNumber}`,
        html,
        text,
        ...(input.pdf ? { attachments: [{ filename: input.pdf.filename, content: input.pdf.base64 }] } : {}),
      }),
    });
    if (!response.ok) {
      console.error("[receipt-email] Resend error", response.status);
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("[receipt-email] send failed", error);
    return { sent: false };
  }
}
