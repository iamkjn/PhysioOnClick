import { NextResponse } from "next/server";

import { FieldValue, getAdminDb } from "@/lib/firebase-admin";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { PRACTICE_PHONE } from "@/lib/practice-contact";
import { channelLabel, cleanChannel } from "@/lib/traffic-source";
import { parseVisitRequest, timeLabels, type VisitRequest } from "@/lib/visit-request";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.startsWith("0") ? `+44${digits.slice(1)}` : digits;
}

async function sendRequestEmail(request: VisitRequest, channel: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("[visit-request] RESEND_API_KEY not set; request saved but not emailed", request.postcode);
    return { sent: false, reason: "missing-api-key" };
  }

  const to = process.env.ENQUIRY_EMAIL_TO || "hello@physioonclick.co.uk";
  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
  const times = timeLabels(request.times);
  const area = request.covered
    ? "Inside the home-visit area"
    : "OUTSIDE the home-visit area: offer a video appointment or check the drive";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Call back request: ${request.name}, ${request.postcode}`,
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #10233a; line-height: 1.6;">
          <h2 style="margin: 0 0 12px;">Please call back: home visit request</h2>
          <p style="font-size: 18px; margin: 0 0 12px;"><strong>${escapeHtml(request.name)}</strong> ·
            <a href="tel:${escapeHtml(telHref(request.phone))}">${escapeHtml(request.phone)}</a></p>
          <p><strong>Postcode:</strong> ${escapeHtml(request.postcode)} (${area})</p>
          <p><strong>Visit times that suit:</strong> ${escapeHtml(times.length ? times.join(", ") : "Not given")}</p>
          <p><strong>What it's for:</strong><br />${request.note ? escapeHtml(request.note).replaceAll("\n", "<br />") : "Not given"}</p>
          <p style="color: #5b6b7a; font-size: 13px;">Came from: ${escapeHtml(channelLabel(channel))}. Also in the admin Enquiries tab.
          After the call: Admin → Patients → Add patient, then add a package and send the payment link.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) throw new Error(`Visit request email failed: ${await response.text()}`);
  return { sent: true };
}

export async function POST(request: Request) {
  if (await isRateLimited("FORM_RATE_LIMITER", clientIp(request))) {
    return NextResponse.json({ error: "Too many requests sent. Please wait a minute and try again." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: a hidden "website" field people never see. Bots fill it; pretend success.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const parsed = parseVisitRequest(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const visit = parsed.value;
  const channel = cleanChannel(body.channel) || "direct";

  const db = getAdminDb();
  let saved = false;
  if (db) {
    try {
      await db.collection("enquiries").add({
        name: visit.name,
        email: "",
        phone: visit.phone,
        postcode: visit.postcode,
        covered: visit.covered,
        visitTimes: visit.times,
        service: "Home visit: call back request",
        message: visit.note,
        kind: "visit-request",
        source: "visit-request-form",
        channel,
        status: "new",
        createdAt: FieldValue.serverTimestamp(),
      });
      saved = true;
    } catch (error) {
      console.error("[visit-request] save failed", error);
    }
  }

  let emailSent = false;
  try {
    emailSent = (await sendRequestEmail(visit, channel)).sent;
  } catch (error) {
    console.error("[visit-request] email failed", error);
  }

  if (!saved && !emailSent) {
    return NextResponse.json(
      { error: `Sorry, your request didn't go through. Please call or text ${PRACTICE_PHONE}.` },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true, saved, emailSent, covered: visit.covered });
}
