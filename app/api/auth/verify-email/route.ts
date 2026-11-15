import { NextResponse } from "next/server";

import { DecodedIdToken, getAdminAuth } from "@/lib/firebase-admin";
import { oobCodeFromLink, verifyEmailPageUrl } from "@/lib/email-verification";
import { renderEmailLayout, toPlainText } from "@/lib/emails/email-layout";

// Emails the signed-in user a link to confirm their address (see
// lib/email-verification.ts). Password sign-ups call it straight away; the
// home dashboard offers it to a carer whose unverified email is keeping them
// out of the record they were given access to.

const rateLimitMap = new Map<string, number>();

export async function POST(request: Request) {
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json({ error: "Authentication service is not available." }, { status: 500 });
  }

  let decoded: DecodedIdToken;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = typeof decoded.email === "string" ? decoded.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "This account has no email address." }, { status: 400 });
  }
  if (decoded.email_verified === true) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const now = Date.now();
  const lastSent = rateLimitMap.get(decoded.uid) ?? 0;
  if (now - lastSent < 60_000) {
    return NextResponse.json(
      { error: "We've just sent one. Please wait a minute before asking for another." },
      { status: 429 },
    );
  }

  let confirmUrl: string;
  try {
    const link = await adminAuth.generateEmailVerificationLink(email);
    const code = oobCodeFromLink(link);
    if (!code) throw new Error("verification link had no oobCode");
    confirmUrl = verifyEmailPageUrl(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", code);
  } catch (error) {
    console.error("generateEmailVerificationLink failed:", error);
    return NextResponse.json({ error: "Could not create a confirmation link. Please try again." }, { status: 500 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Local dev has no email service — surface the link in the server
    // console (same as the magic link). Production still hard-fails.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] email confirmation link for ${email}: ${confirmUrl}`);
      rateLimitMap.set(decoded.uid, now);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
  }

  const escaped = confirmUrl.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  const html = renderEmailLayout({
    preheader: "Confirm your email address for PhysioOnClick",
    bodyHtml: `
      <p style="margin:0 0 16px;">Please confirm this is your email address. It keeps your PhysioOnClick account secure.</p>
      <p style="margin:0 0 16px;">If a family member has given you access to help with their recovery plan, you&rsquo;ll see it as soon as you&rsquo;ve confirmed.</p>
      <p style="margin:0 0 8px;">
        <a href="${escaped}" style="display:inline-block; background:#0EA5E9; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:8px; font-weight:700; font-size:15px;">Confirm my email →</a>
      </p>
      <p style="margin:20px 0 0; font-size:13px; color:#7C8FA0;">If you didn&rsquo;t create a PhysioOnClick account, you can safely ignore this email.</p>
    `,
  });
  const text = toPlainText(
    `Please confirm this is your email address. It keeps your PhysioOnClick account secure.\n\nIf a family member has given you access to help with their recovery plan, you'll see it as soon as you've confirmed.\n\nConfirm my email: ${confirmUrl}\n\nIf you didn't create a PhysioOnClick account, you can safely ignore this email.`,
  );

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>",
      to: [email],
      subject: "Confirm your email for PhysioOnClick",
      html,
      text,
    }),
  });
  if (!res.ok) {
    console.error("verification email failed", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
  }

  rateLimitMap.set(decoded.uid, now);
  return NextResponse.json({ ok: true });
}
