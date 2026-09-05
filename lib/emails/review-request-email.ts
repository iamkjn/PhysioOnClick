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

export function buildReviewRequestEmailHtml(input: {
  patientName: string;
  reviewUrl: string;
}): string {
  const greeting = input.patientName ? `Hi ${escapeHtml(input.patientName)},` : "Hi there,";
  return renderEmailLayout({
    preheader: "A quick favour, if you have a spare minute",
    bodyHtml: `
      <p style="margin:0 0 16px;">${greeting}</p>
      <p style="margin:0 0 16px;">Thanks so much for choosing PhysioOnClick for your care. If you have a spare minute, a short Google review would genuinely help other people find their way to online physiotherapy — it makes a real difference for a small practice like this one.</p>
      <p style="margin:0 0 16px;">
        <a href="${escapeHtml(input.reviewUrl)}" style="display:inline-block; background:#0EA5E9; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:700; font-size:14px;">Leave a review</a>
      </p>
      <p style="margin:0; font-size:13.5px;">Even a couple of sentences about your experience is hugely appreciated. Thank you again!</p>
    `,
  });
}

function buildReviewRequestEmailText(input: { patientName: string; reviewUrl: string }): string {
  const greeting = input.patientName ? `Hi ${input.patientName},` : "Hi there,";
  return toPlainText(
    [
      greeting,
      "",
      "Thanks so much for choosing PhysioOnClick for your care. If you have a spare minute, a short Google review would genuinely help other people find their way to online physiotherapy.",
      "",
      `Leave a review: ${input.reviewUrl}`,
      "",
      "Even a couple of sentences about your experience is hugely appreciated. Thank you again!",
    ].join("\n")
  );
}

export async function sendReviewRequestEmail(
  input: { to: string } & Parameters<typeof buildReviewRequestEmailHtml>[0]
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[review-request-email] RESEND_API_KEY unset; skipping");
    return { sent: false };
  }
  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
  const html = buildReviewRequestEmailHtml(input);
  const text = buildReviewRequestEmailText(input);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: "Quick favour — how did your session go?",
        html,
        text,
      }),
    });
    if (!response.ok) {
      console.error("[review-request-email] Resend error", response.status);
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("[review-request-email] send failed", error);
    return { sent: false };
  }
}
