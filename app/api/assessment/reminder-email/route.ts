import { NextResponse } from "next/server";

import { sendAssessmentLinkEmail } from "@/lib/emails/assessment-link-email";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

type Booking = {
  email: string;
  patientName?: string;
  fullName?: string;
  service?: string;
  meetingUrl?: string;
  appointmentLabel?: string;
};

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { bookingId?: string };
  const bookingId = body.bookingId;
  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const snap = await db.collection("bookings").doc(bookingId).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const booking = snap.data() as Booking;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let assessmentUrl = `${siteUrl}/patient/assessment`;
  try {
    const adminAuth = getAdminAuth();
    if (adminAuth) {
      const verifyUrl = new URL("/auth/verify", siteUrl);
      verifyUrl.searchParams.set("email", booking.email);
      verifyUrl.searchParams.set("returnTo", "/patient/assessment");
      assessmentUrl = await adminAuth.generateSignInWithEmailLink(booking.email, {
        url: verifyUrl.toString(),
        handleCodeInApp: true,
      });
    }
  } catch (error) {
    console.error("Assessment magic-link generation failed; falling back to plain URL", error);
  }

  const result = await sendAssessmentLinkEmail({
    to: booking.email,
    patientName: booking.patientName || booking.fullName || "",
    serviceLabel: booking.service || "",
    assessmentUrl,
    meetingUrl: booking.meetingUrl,
    appointmentLabel: booking.appointmentLabel,
  });

  return NextResponse.json({ sent: result.sent }, { status: 200 });
}
