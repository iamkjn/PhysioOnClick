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

  // Trustpilot is the primary channel. TRUSTPILOT_BCC_EMAIL is the unique
  // invite.trustpilot.com address — BCC'd here so Trustpilot sends its own
  // branded (verified) invitation. TRUSTPILOT_REVIEW_URL, if set, also adds a
  // direct "Review us on Trustpilot" button. GOOGLE_REVIEW_URL stays supported
  // as a fallback for the direct link only.
  const bcc = process.env.TRUSTPILOT_BCC_EMAIL || undefined;
  const reviewUrl =
    process.env.TRUSTPILOT_REVIEW_URL || process.env.GOOGLE_REVIEW_URL || undefined;

  if (!bcc && !reviewUrl) {
    console.error(
      "reviews/request-email: neither TRUSTPILOT_BCC_EMAIL nor a review URL configured; skipping"
    );
    return NextResponse.json(
      { sent: false, reason: "review channel not configured" },
      { status: 200 }
    );
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
    bcc,
    patientName: booking.patientName || booking.fullName || "",
    reviewUrl,
    referenceId: bookingId,
  });

  return NextResponse.json({ sent: result.sent }, { status: 200 });
}
