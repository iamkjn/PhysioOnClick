import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";

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

  if (Number.isNaN(combined.getTime())) {
    return `${date} ${time}`;
  }

  return combined.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function sendBookingEmail(payload: BookingPayload, appointmentLabel: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { sent: false };
  }

  const doctorEmail = process.env.ENQUIRY_EMAIL_TO || "zalashivali1998@gmail.com";
  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
  const safeNotes = escapeHtml(payload.notes || "No additional notes.").replaceAll("\n", "<br />");

  const emailHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #10233a; line-height: 1.6;">
      <h2 style="margin-bottom: 16px;">PhysioOnClick booking confirmation</h2>
      <p><strong>Patient:</strong> ${escapeHtml(payload.fullName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(payload.phone || "Not provided")}</p>
      <p><strong>Service:</strong> ${escapeHtml(payload.service)}</p>
      <p><strong>Requested appointment:</strong> ${escapeHtml(appointmentLabel)}</p>
      <p><strong>Notes:</strong><br />${safeNotes}</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [payload.email, doctorEmail],
      reply_to: doctorEmail,
      subject: `PhysioOnClick booking confirmation: ${payload.service}`,
      html: emailHtml
    })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return { sent: true };
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<BookingPayload>;
  const payload: BookingPayload = {
    fullName: String(body.fullName || "").trim(),
    email: String(body.email || "").trim(),
    phone: String(body.phone || "").trim(),
    service: String(body.service || "").trim(),
    appointmentDate: String(body.appointmentDate || "").trim(),
    appointmentTime: String(body.appointmentTime || "").trim(),
    notes: String(body.notes || "").trim()
  };

  if (!payload.fullName || !payload.email || !payload.service || !payload.appointmentDate || !payload.appointmentTime) {
    return NextResponse.json({ error: "Missing required booking details." }, { status: 400 });
  }

  const db = getAdminDb();

  if (!db) {
    return NextResponse.json(
      { error: "Server-side Firebase is not configured. Add admin credentials before using live bookings." },
      { status: 500 }
    );
  }

  const appointmentLabel = formatAppointmentLabel(payload.appointmentDate, payload.appointmentTime);

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
      status: "confirmed",
      source: "website-booking-form",
      createdAt: FieldValue.serverTimestamp()
    });

    let emailSent = false;

    try {
      const result = await sendBookingEmail(payload, appointmentLabel);
      emailSent = result.sent;
    } catch {
      emailSent = false;
    }

    return NextResponse.json({ ok: true, id: docRef.id, emailSent, appointmentLabel });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save booking.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
