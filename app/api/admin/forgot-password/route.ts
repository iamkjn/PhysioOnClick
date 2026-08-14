import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";
import { validateEmail } from "@/lib/validation";
import { renderEmailLayout, toPlainText } from "@/lib/emails/email-layout";

// Must stay in sync with lib/admin-auth.ts's client-side ADMIN_EMAIL and
// app/admin/actions.ts's requireAdmin check.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hello@physioonclick.co.uk";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const rateLimitMap = new Map<string, number>();

// Always returns the same generic response regardless of whether the typed
// email matches the admin account, so this endpoint can't be used to test
// which addresses have admin access.
const GENERIC_OK = NextResponse.json({ ok: true });

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = String(body.email || "").trim().toLowerCase();

  if (validateEmail(email) !== null) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const now = Date.now();
  const lastSent = rateLimitMap.get(email) ?? 0;
  if (now - lastSent < 60_000) {
    return NextResponse.json(
      { error: "Please wait a moment before requesting another link." },
      { status: 429 },
    );
  }
  rateLimitMap.set(email, now);

  // Firebase's own default password-reset sender (noreply@<project>.firebaseapp.com)
  // is silently spam-filtered/dropped by several mail providers for a custom
  // domain — hit in production 2026-08-13. Generate the raw reset link server-side
  // and send it ourselves through the same verified Resend sender every other
  // transactional email in this app already uses successfully.
  if (email !== ADMIN_EMAIL) return GENERIC_OK;

  const adminAuth = getAdminAuth();
  if (!adminAuth) return GENERIC_OK;

  let resetLink: string;
  try {
    resetLink = await adminAuth.generatePasswordResetLink(email);
  } catch (error) {
    console.error("generatePasswordResetLink failed:", error);
    return GENERIC_OK;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] admin password reset link for ${email}: ${resetLink}`);
      return GENERIC_OK;
    }
    console.error("RESEND_API_KEY not configured; admin password reset email not sent.");
    return GENERIC_OK;
  }

  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";

  const emailHtml = renderEmailLayout({
    preheader: "Reset your PhysioOnClick admin password — link expires in 1 hour",
    bodyHtml: `
      <p style="margin:0 0 16px;">A password reset was requested for the PhysioOnClick admin portal.</p>
      <p style="margin:0 0 8px;">
        <a href="${escapeHtml(resetLink)}" style="display:inline-block; background:#0EA5E9; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:8px; font-weight:700; font-size:15px;">Reset your password →</a>
      </p>
      <p style="margin:8px 0 20px; font-size:12.5px; color:#7C8FA0;">This link expires after 1 hour and can only be used once.</p>
      <p style="margin:0; font-size:13px; color:#7C8FA0;">If you did not request this, you can safely ignore this email — your password will not be changed.</p>
    `,
  });
  const emailText = toPlainText(
    `A password reset was requested for the PhysioOnClick admin portal.\n\nReset your password: ${resetLink}\n\nThis link expires after 1 hour and can only be used once. If you did not request this, you can safely ignore this email.`
  );

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your PhysioOnClick admin password",
      html: emailHtml,
      text: emailText,
    }),
  });

  if (!res.ok) {
    console.error("Resend send failed for admin password reset:", await res.text());
  }

  return GENERIC_OK;
}
