import { NextResponse } from "next/server";

import { sendReviewRequestEmail } from "@/lib/emails/review-request-email";
import { getAdminDb } from "@/lib/firebase-admin";

type Booking = {
  email: string;
  patientName?: string;
  fullName?: string;
};

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviewUrl = process.env.GOOGLE_REVIEW_URL;
  if (!reviewUrl) {
    console.error("reviews/request-email: GOOGLE_REVIEW_URL not configured; skipping");
    return NextResponse.json({ sent: false, reason: "GOOGLE_REVIEW_URL not configured" }, { status: 200 });
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

  const result = await sendReviewRequestEmail({
    to: booking.email,
    patientName: booking.patientName || booking.fullName || "",
    reviewUrl,
  });

  return NextResponse.json({ sent: result.sent }, { status: 200 });
}
