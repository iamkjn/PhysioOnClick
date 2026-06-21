import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";

type EnquiryPayload = {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendNotificationEmail(payload: EnquiryPayload) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { sent: false, reason: "missing-api-key" };
  }

  const to = process.env.ENQUIRY_EMAIL_TO || "zalashivali1998@gmail.com";
  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
  const safeMessage = escapeHtml(payload.message).replaceAll("\n", "<br />");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: payload.email,
      subject: `New PhysioOnClick enquiry: ${payload.service}`,
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #10233a; line-height: 1.6;">
          <h2 style="margin-bottom: 16px;">New enquiry received</h2>
          <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(payload.phone || "Not provided")}</p>
          <p><strong>Service:</strong> ${escapeHtml(payload.service)}</p>
          <p><strong>Message:</strong><br />${safeMessage}</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Email notification failed: ${errorText}`);
  }

  return { sent: true };
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<EnquiryPayload>;
  const payload: EnquiryPayload = {
    name: String(body.name || "").trim(),
    email: String(body.email || "").trim(),
    phone: String(body.phone || "").trim(),
    service: String(body.service || "").trim(),
    message: String(body.message || "").trim()
  };

  if (!payload.name || !payload.email || !payload.service || !payload.message) {
    return NextResponse.json({ error: "Missing required enquiry fields." }, { status: 400 });
  }

  const db = getAdminDb();

  try {
    let saved = false;
    let id = "";
    let saveReason = "";

    if (db) {
      const docRef = await db.collection("enquiries").add({
        ...payload,
        emailLower: payload.email.toLowerCase(),
        status: "new",
        source: "website-contact-form",
        createdAt: FieldValue.serverTimestamp()
      });
      saved = true;
      id = docRef.id;
    } else {
      saveReason = "missing-admin-db";
    }

    let emailSent = false;
    let emailReason = "";

    try {
      const result = await sendNotificationEmail(payload);
      emailSent = result.sent;
      emailReason = result.sent ? "" : result.reason ?? "unknown";
    } catch (error) {
      emailReason = "provider-error";
      console.error("Enquiry notification email failed", error);
      emailSent = false;
    }

    return NextResponse.json({ ok: true, id, saved, saveReason, emailSent, emailReason });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save enquiry.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
