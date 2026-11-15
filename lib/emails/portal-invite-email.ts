import { renderEmailLayout, toPlainText } from "@/lib/emails/email-layout";

// Welcome / sign-in invite an admin sends from the patient page. Written for
// people who aren't confident online: one big button, then plain steps for
// every later visit (the one-click link expires; the steps never do).

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export type PortalInviteInput = {
  /** First name (or full name) of the person receiving it. */
  recipientName: string;
  recipientEmail: string;
  /** Set for a carer: whose recovery they're helping with. */
  patientName?: string;
  signInLink: string;
  portalUrl: string;
};

export function buildPortalInviteEmail(input: PortalInviteInput): { subject: string; html: string; text: string } {
  const greeting = input.recipientName ? `Hello ${input.recipientName},` : "Hello,";
  const intro = input.patientName
    ? `You've been added as a carer for ${input.patientName} at PhysioOnClick. You can see ${input.patientName}'s exercise plan, tick off exercises and follow progress together.`
    : "Your PhysioOnClick account is ready. You can see your exercise plan, tick off exercises and follow your progress.";
  const host = new URL(input.portalUrl).host + new URL(input.portalUrl).pathname;

  const subject = input.patientName
    ? `You're invited to help with ${input.patientName}'s recovery - PhysioOnClick`
    : "Your PhysioOnClick account is ready";

  const html = renderEmailLayout({
    preheader: "Sign in to PhysioOnClick with one click - no password needed",
    bodyHtml: `
      <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 16px;">${escapeHtml(intro)}</p>
      <p style="margin:0 0 8px;">
        <a href="${escapeHtml(input.signInLink)}" style="display:inline-block; background:#0EA5E9; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:8px; font-weight:700; font-size:15px;">Sign in now →</a>
      </p>
      <p style="margin:8px 0 20px; font-size:12.5px; color:#7C8FA0;">This button works once, within 24 hours. You don't need a password.</p>
      <p style="margin:0 0 8px; font-weight:700;">Signing in again later</p>
      <ol style="margin:0 0 16px; padding-left:20px;">
        <li style="margin:0 0 6px;">Go to <a href="${escapeHtml(input.portalUrl)}" style="color:#0A77A8;">${escapeHtml(host)}</a></li>
        <li style="margin:0 0 6px;">Type your email: <strong>${escapeHtml(input.recipientEmail)}</strong></li>
        <li style="margin:0 0 6px;">Press <strong>Send sign-in link</strong>, then open the email we send and press the button.</li>
      </ol>
      <p style="margin:0 0 16px;">Once you're in, you stay signed in on that phone, tablet or computer.</p>
      <p style="margin:0; font-size:13px; color:#7C8FA0;">Any trouble? Just reply to this email and we'll help.</p>
    `,
  });

  const text = toPlainText(
    `${greeting}\n\n${intro}\n\nSign in now (works once, within 24 hours, no password needed): ${input.signInLink}\n\n` +
      `Signing in again later:\n1. Go to ${input.portalUrl}\n2. Type your email: ${input.recipientEmail}\n3. Press "Send sign-in link", then open the email we send and press the button.\n\n` +
      `Once you're in, you stay signed in on that phone, tablet or computer.\n\nAny trouble? Just reply to this email and we'll help.`,
  );

  return { subject, html, text };
}
