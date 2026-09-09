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

interface ReviewEmailInput {
  patientName: string;
  // Direct "leave a review" link. When omitted (BCC-only mode) the email is a
  // plain thank-you and Trustpilot sends its own branded invitation.
  reviewUrl?: string;
  // Booking id — surfaced in the email so the Trustpilot BCC integration can
  // use it as the review reference.
  referenceId?: string;
}

export function buildReviewRequestEmailHtml(input: ReviewEmailInput): string {
  const greeting = input.patientName ? `Hi ${escapeHtml(input.patientName)},` : "Hi there,";
  const cta = input.reviewUrl
    ? `<p style="margin:0 0 16px;">
        <a href="${escapeHtml(input.reviewUrl)}" style="display:inline-block; background:#00B67A; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:700; font-size:14px;">Review us on Trustpilot ★</a>
      </p>`
    : `<p style="margin:0 0 16px;">In the next day or two you'll get a short invitation from <strong>Trustpilot</strong> to rate your experience. It only takes a minute, and it genuinely helps other people find their way to online physiotherapy.</p>`;
  const reference = input.referenceId
    ? `<p style="margin:16px 0 0; font-size:12px; color:#8a94a6;">Reference: ${escapeHtml(input.referenceId)}</p>`
    : "";
  return renderEmailLayout({
    preheader: "A quick favour, if you have a spare minute",
    bodyHtml: `
      <p style="margin:0 0 16px;">${greeting}</p>
      <p style="margin:0 0 16px;">Thanks so much for choosing PhysioOnClick for your care. If you have a spare minute, a short review on Trustpilot would mean a lot — it makes a real difference for a small practice like this one.</p>
      ${cta}
      <p style="margin:0; font-size:13.5px;">Even a couple of sentences about your experience is hugely appreciated. Thank you again!</p>
      ${reference}
    `,
  });
}

function buildReviewRequestEmailText(input: ReviewEmailInput): string {
  const greeting = input.patientName ? `Hi ${input.patientName},` : "Hi there,";
  const cta = input.reviewUrl
    ? `Review us on Trustpilot: ${input.reviewUrl}`
    : "In the next day or two you'll get a short invitation from Trustpilot to rate your experience. It only takes a minute.";
  return toPlainText(
    [
      greeting,
      "",
      "Thanks so much for choosing PhysioOnClick for your care. If you have a spare minute, a short review on Trustpilot would mean a lot.",
      "",
      cta,
      "",
      "Even a couple of sentences about your experience is hugely appreciated. Thank you again!",
      ...(input.referenceId ? ["", `Reference: ${input.referenceId}`] : []),
    ].join("\n")
  );
}

export async function sendReviewRequestEmail(
  input: { to: string; bcc?: string } & ReviewEmailInput
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
        ...(input.bcc ? { bcc: [input.bcc] } : {}),
        subject: "Thanks for your session — a quick favour",
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
