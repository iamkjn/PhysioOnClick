import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { createEventWithMeet } from "@/lib/google-calendar";

type BookingPayload = {
  fullName: string;
  email: string;
  phone: string;
  service: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatAppointmentLabel(date: string, time: string) {
  const combined = new Date(`${date}T${time}:00`);
  if (Number.isNaN(combined.getTime())) return `${date} ${time}`;
  return combined.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function sendBookingEmail(
  payload: BookingPayload,
  appointmentLabel: string,
  meetLink: string | null,
  portalLink: string | null,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false };

  const doctorEmail = process.env.ENQUIRY_EMAIL_TO || "zalashivali1998@gmail.com";
  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
  const safeNotes = escapeHtml(payload.notes || "No additional notes.").replaceAll("\n", "<br />");

  const meetSection = meetLink
    ? `<div style="margin: 20px 0; padding: 16px 20px; background: #ECFEFF; border-left: 4px solid #0891B2; border-radius: 8px;">
        <p style="margin: 0 0 8px; font-weight: bold; color: #0E7490;">📹 Google Meet link</p>
        <a href="${meetLink}" style="color: #0891B2; font-size: 15px;">${meetLink}</a>
        <p style="margin: 8px 0 0; font-size: 13px; color: #6B8FA0;">Click to join your online session at the scheduled time.</p>
       </div>`
    : `<p style="color: #6B8FA0; font-size: 13px;">📅 A calendar invite will be sent once your appointment is confirmed.</p>`;

  const portalSection = portalLink
    ? `<div style="margin: 24px 0; text-align: center;">
        <a href="${escapeHtml(portalLink)}"
           style="display: inline-block; background: linear-gradient(135deg, #0891B2, #0E7490);
                  color: white; text-decoration: none; padding: 14px 32px;
                  border-radius: 8px; font-weight: bold; font-size: 15px;">
          Access your patient portal →
        </a>
        <p style="margin: 10px 0 0; font-size: 12px; color: #6B8FA0;">
          This link signs you in automatically. It expires after 24 hours and can only be used once.
        </p>
      </div>`
    : "";

  const emailHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #10233A; line-height: 1.6; max-width: 600px;">
      <div style="background: linear-gradient(135deg, #0891B2, #0E7490); padding: 28px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; color: white; font-size: 22px;">PhysioOnClick</h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Appointment Request Received</p>
      </div>
      <div style="padding: 28px 32px; background: white; border: 1px solid #E8F6FA; border-top: none; border-radius: 0 0 12px 12px;">
        <p>Hi <strong>${escapeHtml(payload.fullName)}</strong>,</p>
        <p>Thank you for booking with PhysioOnClick. Here are your appointment details:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #F8FEFF;">
            <td style="padding: 10px 14px; font-weight: 600; color: #0E7490; width: 40%; border-bottom: 1px solid #E0F7FA;">Service</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #E0F7FA;">${escapeHtml(payload.service)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-weight: 600; color: #0E7490; border-bottom: 1px solid #E0F7FA;">Date &amp; Time</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #E0F7FA;">${escapeHtml(appointmentLabel)}</td>
          </tr>
          <tr style="background: #F8FEFF;">
            <td style="padding: 10px 14px; font-weight: 600; color: #0E7490; border-bottom: 1px solid #E0F7FA;">Email</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #E0F7FA;">${escapeHtml(payload.email)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-weight: 600; color: #0E7490; border-bottom: 1px solid #E0F7FA;">Phone</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #E0F7FA;">${escapeHtml(payload.phone || "Not provided")}</td>
          </tr>
          ${payload.notes ? `<tr style="background: #F8FEFF;"><td style="padding: 10px 14px; font-weight: 600; color: #0E7490;">Notes</td><td style="padding: 10px 14px;">${safeNotes}</td></tr>` : ""}
        </table>

        ${meetSection}
        ${portalSection}

        <div style="margin-top: 24px; padding: 16px 20px; background: #FFF9EC; border-radius: 8px; font-size: 13px; color: #92400E;">
          ⚠️ Please cancel at least 24 hours in advance if you need to reschedule. Contact us at hello@physioonclick.co.uk.
        </div>

        <p style="margin-top: 24px; color: #6B8FA0; font-size: 13px;">
          — The PhysioOnClick Team<br />
          <a href="mailto:hello@physioonclick.co.uk" style="color: #0891B2;">hello@physioonclick.co.uk</a>
        </p>
      </div>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.email, doctorEmail],
      reply_to: doctorEmail,
      subject: `Appointment confirmed: ${payload.service} — ${appointmentLabel}`,
      html: emailHtml,
    }),
  });

  if (!response.ok) throw new Error(await response.text());
  return { sent: true };
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<BookingPayload>;
  const payload: BookingPayload = {
    fullName: String(body.fullName || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    phone: String(body.phone || "").trim(),
    service: String(body.service || "").trim(),
    appointmentDate: String(body.appointmentDate || "").trim(),
    appointmentTime: String(body.appointmentTime || "").trim(),
    notes: String(body.notes || "").trim(),
  };

  if (!payload.fullName || !payload.email || !payload.service || !payload.appointmentDate || !payload.appointmentTime) {
    return NextResponse.json({ error: "Missing required booking details." }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Server-side Firebase is not configured." },
      { status: 500 },
    );
  }

  const appointmentLabel = formatAppointmentLabel(payload.appointmentDate, payload.appointmentTime);

  // Create Google Calendar event with Meet link (best-effort — booking proceeds even if this fails)
  let meetLink: string | null = null;
  let calendarEventId: string | null = null;
  try {
    const calResult = await createEventWithMeet({
      summary: `PhysioOnClick — ${payload.service} (${payload.fullName})`,
      description: `Patient: ${payload.fullName}\nEmail: ${payload.email}\nPhone: ${payload.phone || "N/A"}\nNotes: ${payload.notes || "None"}`,
      startDateTime: `${payload.appointmentDate}T${payload.appointmentTime}:00`,
      endDurationMinutes: 45,
      attendeeEmail: payload.email,
    });
    if (calResult) {
      meetLink = calResult.meetLink || null;
      calendarEventId = calResult.eventId;
    }
  } catch {
    // Calendar creation is non-blocking — booking still saves
  }

  try {
    const docRef = await db.collection("bookings").add({
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      service: payload.service,
      appointmentDate: payload.appointmentDate,
      appointmentTime: payload.appointmentTime,
      appointmentLabel,
      notes: payload.notes,
      meetLink: meetLink ?? "",
      calendarEventId: calendarEventId ?? "",
      status: "pending",
      source: "website-booking-form",
      createdAt: FieldValue.serverTimestamp(),
    });

    let portalLink: string | null = null;
    try {
      const adminAuth = getAdminAuth();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      if (adminAuth) {
        portalLink = await adminAuth.generateSignInWithEmailLink(payload.email, {
          url: `${siteUrl}/auth/verify?email=${encodeURIComponent(payload.email)}`,
          handleCodeInApp: true,
        });
      }
    } catch {
      // Non-blocking — booking proceeds without portal link
    }

    let emailSent = false;
    try {
      const result = await sendBookingEmail(payload, appointmentLabel, meetLink, portalLink);
      emailSent = result.sent;
    } catch {
      emailSent = false;
    }

    return NextResponse.json({
      ok: true,
      id: docRef.id,
      emailSent,
      appointmentLabel,
      meetLink,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save booking.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
