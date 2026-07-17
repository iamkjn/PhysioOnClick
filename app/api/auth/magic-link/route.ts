import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";
import { validateEmail } from "@/lib/validation";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const rateLimitMap = new Map<string, number>();

// Only these in-app destinations are legitimate post-sign-in landing spots.
// Anything else (including protocol-relative URLs like //evil.com) falls back to "/patient".
const ALLOWED_RETURN_PATHS = new Set<string>(["/book", "/patient"]);

function sanitizeReturnPath(value: unknown): string {
  return typeof value === "string" && ALLOWED_RETURN_PATHS.has(value) ? value : "/patient";
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; returnTo?: string };
  const email = String(body.email || "").trim().toLowerCase();
  const returnTo = sanitizeReturnPath(body.returnTo);

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

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json({ error: "Authentication service is not available." }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const verifyUrl = new URL("/auth/verify", siteUrl);
  verifyUrl.searchParams.set("email", email);
  verifyUrl.searchParams.set("returnTo", returnTo);

  let portalLink: string;
  try {
    portalLink = await adminAuth.generateSignInWithEmailLink(email, {
      url: verifyUrl.toString(),
      handleCodeInApp: true,
    });
  } catch (error) {
    console.error("generateSignInWithEmailLink failed:", error);
    return NextResponse.json({ error: "Could not generate a sign-in link. Please try again." }, { status: 500 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // ponytail: local dev has no email service — surface the link in the server
    // console so the flow stays testable. Production still hard-fails.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] magic link for ${email}: ${portalLink}`);
      rateLimitMap.set(email, now);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
  }

  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";

  const emailHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #10233A; line-height: 1.6; max-width: 600px;">
      <div style="background: linear-gradient(135deg, #0891B2, #0E7490); padding: 28px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; color: white; font-size: 22px;">PhysioOnClick</h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Your sign-in link</p>
      </div>
      <div style="padding: 28px 32px; background: white; border: 1px solid #E8F6FA; border-top: none; border-radius: 0 0 12px 12px;">
        <p>Here is your sign-in link for PhysioOnClick. Click the button below to access your patient portal.</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${escapeHtml(portalLink)}"
             style="display: inline-block; background: linear-gradient(135deg, #0891B2, #0E7490);
                    color: white; text-decoration: none; padding: 14px 32px;
                    border-radius: 8px; font-weight: bold; font-size: 15px;">
            Access your patient portal →
          </a>
          <p style="margin: 10px 0 0; font-size: 12px; color: #6B8FA0;">
            This link expires after 24 hours and can only be used once.
          </p>
        </div>
        <p style="color: #6B8FA0; font-size: 13px;">
          If you did not request this link, you can safely ignore this email.<br /><br />
          — The PhysioOnClick Team
        </p>
      </div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your PhysioOnClick sign-in link",
      html: emailHtml,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
  }

  rateLimitMap.set(email, now);
  return NextResponse.json({ ok: true });
}
