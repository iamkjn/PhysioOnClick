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

export function buildAssessmentLinkEmailHtml(input: {
  patientName: string;
  serviceLabel: string;
  assessmentUrl: string;
  meetingUrl?: string;
  appointmentLabel?: string;
}): string {
  const greeting = input.patientName ? `Hi ${escapeHtml(input.patientName)},` : "Hello,";
  const appointmentLine = input.appointmentLabel
    ? `<p style="margin:0 0 16px; font-size:14px;"><strong>Appointment:</strong> ${escapeHtml(input.appointmentLabel)}</p>`
    : "";
  const meetingLine = input.meetingUrl
    ? `<p style="margin:16px 0 0; font-size:13.5px;"><a href="${escapeHtml(input.meetingUrl)}" style="color:#0A77A8;">Join your appointment</a></p>`
    : "";
  return renderEmailLayout({
    preheader: `Complete your assessment for ${input.serviceLabel} before your appointment`,
    bodyHtml: `
      <p style="margin:0 0 16px;">${greeting}</p>
      <p style="margin:0 0 16px;">Please complete your short assessment for <strong>${escapeHtml(input.serviceLabel)}</strong> before your appointment. Completing it helps us make the most of your session.</p>
      ${appointmentLine}
      <p style="margin:0;">
        <a href="${escapeHtml(input.assessmentUrl)}" style="display:inline-block; background:#0EA5E9; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:700; font-size:14px;">Complete your assessment</a>
      </p>
      ${meetingLine}
    `,
  });
}

function buildAssessmentLinkEmailText(input: {
  patientName: string;
  serviceLabel: string;
  assessmentUrl: string;
  meetingUrl?: string;
  appointmentLabel?: string;
}): string {
  const greeting = input.patientName ? `Hi ${input.patientName},` : "Hello,";
  const lines = [
    greeting,
    "",
    `Please complete your short assessment for ${input.serviceLabel} before your appointment. Completing it helps us make the most of your session.`,
  ];
  if (input.appointmentLabel) lines.push("", `Appointment: ${input.appointmentLabel}`);
  lines.push("", `Complete your assessment: ${input.assessmentUrl}`);
  if (input.meetingUrl) lines.push("", `Join your appointment: ${input.meetingUrl}`);
  return toPlainText(lines.join("\n"));
}

export async function sendAssessmentLinkEmail(
  input: { to: string } & Parameters<typeof buildAssessmentLinkEmailHtml>[0]
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[assessment-link-email] RESEND_API_KEY unset; skipping");
    return { sent: false };
  }
  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
  const html = buildAssessmentLinkEmailHtml(input);
  const text = buildAssessmentLinkEmailText(input);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: `Complete your assessment — ${input.serviceLabel}`,
        html,
        text,
      }),
    });
    if (!response.ok) {
      console.error("[assessment-link-email] Resend error", response.status);
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("[assessment-link-email] send failed", error);
    return { sent: false };
  }
}
