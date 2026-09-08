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

export function buildConditionPlanEmailHtml(input: {
  conditionName: string;
  exerciseCount: number;
  libraryUrl: string;
}): string {
  const name = escapeHtml(input.conditionName);
  const exerciseLabel = input.exerciseCount === 1 ? "exercise" : "exercises";
  return renderEmailLayout({
    preheader: `Your ${name} exercise plan — ${input.exerciseCount} ${exerciseLabel}`,
    bodyHtml: `
      <p style="margin:0 0 16px;">Hello,</p>
      <p style="margin:0 0 16px;">Here is the full exercise plan for ${name} — ${input.exerciseCount} ${exerciseLabel} across every stage of the programme, with pictures and step-by-step instructions. It's attached as a PDF.</p>
      <p style="margin:0 0 16px;">This is general guidance, not a substitute for a personal assessment. If any exercise is painful, or you are not sure it is right for you, check with a physiotherapist first.</p>
      <p style="margin:0;">
        <a href="${input.libraryUrl}" style="display:inline-block; background:#0EA5E9; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:700; font-size:14px;">Read the full guide</a>
      </p>
    `,
  });
}

export async function sendConditionPlanEmail(input: {
  to: string;
  conditionName: string;
  exerciseCount: number;
  libraryUrl: string;
  pdf: { filename: string; base64: string };
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[condition-plan-email] RESEND_API_KEY unset; skipping");
    return { sent: false };
  }
  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
  const html = buildConditionPlanEmailHtml({
    conditionName: input.conditionName,
    exerciseCount: input.exerciseCount,
    libraryUrl: input.libraryUrl,
  });
  const exerciseLabel = input.exerciseCount === 1 ? "exercise" : "exercises";
  const text = toPlainText(
    `Hello,\n\nHere is the full exercise plan for ${input.conditionName} — ${input.exerciseCount} ${exerciseLabel} across every stage of the programme, with pictures and step-by-step instructions. It's attached as a PDF.\n\nThis is general guidance, not a substitute for a personal assessment. If any exercise is painful, or you are not sure it is right for you, check with a physiotherapist first.\n\nRead the full guide: ${input.libraryUrl}`
  );
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: `Your exercise plan for ${input.conditionName}`,
        html,
        text,
        attachments: [{ filename: input.pdf.filename, content: input.pdf.base64 }],
      }),
    });
    if (!response.ok) {
      console.error("[condition-plan-email] Resend error", response.status);
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("[condition-plan-email] send failed", error);
    return { sent: false };
  }
}
