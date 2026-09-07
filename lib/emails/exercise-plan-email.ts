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

export function buildExercisePlanEmailHtml(input: {
  patientName: string;
  planUrl: string;
  exerciseCount: number;
}): string {
  const greeting = input.patientName ? `Hi ${escapeHtml(input.patientName)},` : "Hello,";
  const exerciseLabel = input.exerciseCount === 1 ? "exercise" : "exercises";
  return renderEmailLayout({
    preheader: `Your exercise plan with ${input.exerciseCount} ${exerciseLabel}`,
    bodyHtml: `
      <p style="margin:0 0 16px;">${greeting}</p>
      <p style="margin:0 0 16px;">Here is your personalised exercise plan from your session — ${input.exerciseCount} ${exerciseLabel}, with pictures and step-by-step instructions. It's attached as a PDF.</p>
      <p style="margin:0;">
        <a href="${input.planUrl}" style="display:inline-block; background:#0EA5E9; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:700; font-size:14px;">Open your plan in the app</a>
      </p>
    `,
  });
}

export async function sendExercisePlanEmail(input: {
  to: string;
  patientName: string;
  planUrl: string;
  exerciseCount: number;
  pdf: { filename: string; base64: string };
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[exercise-plan-email] RESEND_API_KEY unset; skipping");
    return { sent: false };
  }
  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
  const html = buildExercisePlanEmailHtml({
    patientName: input.patientName,
    planUrl: input.planUrl,
    exerciseCount: input.exerciseCount,
  });
  const greeting = input.patientName
    ? `Hi ${input.patientName},`
    : "Hello,";
  const exerciseLabel = input.exerciseCount === 1 ? "exercise" : "exercises";
  const text = toPlainText(
    `${greeting}\n\nHere is your personalised exercise plan from your session — ${input.exerciseCount} ${exerciseLabel}, with pictures and step-by-step instructions. It's attached as a PDF.\n\nOpen your plan: ${input.planUrl}`
  );
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: "Your exercise plan from PhysioOnClick",
        html,
        text,
        attachments: [{ filename: input.pdf.filename, content: input.pdf.base64 }],
      }),
    });
    if (!response.ok) {
      console.error("[exercise-plan-email] Resend error", response.status);
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("[exercise-plan-email] send failed", error);
    return { sent: false };
  }
}
