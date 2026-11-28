import { NextResponse } from "next/server";

import { buildReminderEmail, reminderDue, type ReminderBooking } from "@/lib/appointment-reminder";
import { getAdminDb } from "@/lib/firebase-admin";

// Called only by the sendAppointmentReminders Cloud Function. Re-reads the
// booking so cancelled or moved appointments are judged on what is stored now.
export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("x-cron-secret") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { bookingId?: string };
  const bookingId = body.bookingId;
  if (!bookingId) return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const ref = db.collection("bookings").doc(bookingId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const booking = snap.data() as ReminderBooking & { bookedBy?: string };

  const now = new Date();
  const check = reminderDue(booking, now);
  if (!check.due) return NextResponse.json({ sent: false, reason: check.reason });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ sent: false, reason: "email not configured" });

  let accountName = "";
  if (booking.bookedBy) {
    const account = await db.collection("patients").doc(booking.bookedBy).get();
    accountName = String(account.data()?.displayName ?? "");
  }

  const email = buildReminderEmail({ booking, start: check.start, accountName, now });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Stops a second copy if two runs overlap before the stamp is written.
      "Idempotency-Key": `appointment-reminder/${bookingId}/${check.start.toISOString()}`,
    },
    body: JSON.stringify({
      from: process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>",
      to: [booking.email],
      ...email,
    }),
  });
  if (!response.ok) {
    // Not stamped, so the next run tries again.
    console.error("appointments/reminder-email: Resend error", response.status);
    return NextResponse.json({ sent: false, reason: "send failed" }, { status: 502 });
  }

  // Write the whole map: the admin shim's merge replaces nested maps.
  await ref.update({
    reminders: { ...(booking.reminders ?? {}), appointmentReminderFor: check.start.toISOString() },
  });
  return NextResponse.json({ sent: true });
}
