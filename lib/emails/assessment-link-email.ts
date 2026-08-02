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
    ? `<p><strong>Appointment:</strong> ${escapeHtml(input.appointmentLabel)}</p>`
    : "";
  const meetingLine = input.meetingUrl
    ? `<p><a href="${input.meetingUrl}">Join your appointment</a></p>`
    : "";
  return `
    <p>${greeting}</p>
    <p>Please complete your short assessment for <strong>${escapeHtml(input.serviceLabel)}</strong> before your appointment. Completing it helps us make the most of your session.</p>
    ${appointmentLine}
    <p><a href="${input.assessmentUrl}">Complete your assessment</a></p>
    ${meetingLine}
  `;
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
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: `Complete your assessment — ${input.serviceLabel}`,
        html,
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
