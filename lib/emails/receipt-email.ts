import { formatGbp } from "@/lib/invoice";

export async function sendReceiptEmail(input: {
  to: string; patientName: string; invoiceNumber: string;
  serviceLabel: string; amountPence: number; receiptUrl: string;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[receipt-email] RESEND_API_KEY unset; skipping");
    return { sent: false };
  }
  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
  const greeting = input.patientName ? `Hi ${input.patientName},` : "Hello,";
  const html = `
    <p>${greeting}</p>
    <p>Thank you for your payment. Here is your receipt for insurance or your records.</p>
    <ul>
      <li><strong>Invoice:</strong> ${input.invoiceNumber}</li>
      <li><strong>Service:</strong> ${input.serviceLabel}</li>
      <li><strong>Amount paid:</strong> ${formatGbp(input.amountPence)}</li>
    </ul>
    <p><a href="${input.receiptUrl}">View or print your full receipt (PDF)</a></p>
  `;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: `Your payment receipt — ${input.invoiceNumber}`,
        html,
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
