import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { requireAdminRequest } from "@/lib/admin-request";
import { readCarerContact, readCarerEmails } from "@/lib/carer-access";
import { buildPortalInviteEmail } from "@/lib/emails/portal-invite-email";

// Admin-only. Emails the patient (and every carer on their record) a welcome
// invite with a one-click sign-in link plus plain "sign in again later" steps.
// Same Firebase email-link flow as /api/auth/magic-link, sent through Resend.

const UID_RE = /^[A-Za-z0-9_-]{6,128}$/;

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

export async function POST(request: Request) {
  const gate = await requireAdminRequest(request);
  if ("error" in gate) return gate.error;

  let body: { uid?: unknown };
  try {
    body = (await request.json()) as { uid?: unknown };
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const uid = typeof body.uid === "string" ? body.uid : "";
  if (!UID_RE.test(uid)) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const db = getAdminDb();
  const auth = getAdminAuth();
  if (!db || !auth) return NextResponse.json({ error: "Unavailable" }, { status: 500 });

  const snap = await db.collection("patients").doc(uid).get();
  if (!snap.exists) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  const patient = (snap.data() ?? {}) as Record<string, unknown>;
  const patientEmail = typeof patient.email === "string" ? patient.email.trim().toLowerCase() : "";
  const patientName = typeof patient.displayName === "string" ? patient.displayName.trim() : "";
  const contact = readCarerContact(patient);

  const recipients: { email: string; name: string; patientName?: string }[] = [];
  if (patientEmail) recipients.push({ email: patientEmail, name: firstName(patientName) });
  for (const email of readCarerEmails(patient)) {
    if (email === patientEmail) continue;
    const name = contact && contact.email === email ? firstName(contact.name) : "";
    recipients.push({ email, name, patientName: patientName || "your family member" });
  }
  if (recipients.length === 0) {
    return NextResponse.json({ error: "No email address on this record." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
  const portalUrl = new URL("/patient", siteUrl).toString();

  const sent: string[] = [];
  const failed: string[] = [];
  for (const r of recipients) {
    try {
      const verifyUrl = new URL("/auth/verify", siteUrl);
      verifyUrl.searchParams.set("email", r.email);
      verifyUrl.searchParams.set("returnTo", "/patient");
      const signInLink = await auth.generateSignInWithEmailLink(r.email, {
        url: verifyUrl.toString(),
        handleCodeInApp: true,
      });
      const mail = buildPortalInviteEmail({
        recipientName: r.name,
        recipientEmail: r.email,
        patientName: r.patientName,
        signInLink,
        portalUrl,
      });
      if (!apiKey) {
        if (process.env.NODE_ENV !== "production") {
          console.log(`[dev] portal invite for ${r.email}: ${signInLink}`);
          sent.push(r.email);
          continue;
        }
        throw new Error("RESEND_API_KEY not configured");
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [r.email],
          reply_to: "hello@physioonclick.co.uk",
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}`);
      sent.push(r.email);
    } catch (error) {
      console.error("send-invite failed for one recipient:", error instanceof Error ? error.message : error);
      failed.push(r.email);
    }
  }

  await db.collection("patients").doc(uid).update({
    portalInviteSentAt: new Date().toISOString(),
    portalInviteSentTo: sent,
  });

  return NextResponse.json({ sent, failed }, { status: failed.length && !sent.length ? 502 : 200 });
}
