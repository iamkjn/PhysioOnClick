import { NextResponse } from "next/server";

/**
 * REMOVED — direct (unpaid) booking creation.
 *
 * Booking is now pay-first: the client goes through Stripe Checkout
 * (app/api/checkout/create), and the Cal.com booking is created only AFTER
 * payment is confirmed, by app/api/payments/webhook. This route previously
 * created a Cal.com booking with no payment and no auth, which let anyone
 * occupy a slot for £0 and bypassed the mandatory fee.
 *
 * It now creates nothing and returns 410 Gone. The shared createCalBooking
 * helper (lib/cal-booking.ts) lives on and is used by the payments webhook.
 */
export function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "This endpoint has been removed. Bookings must be made via /book, where payment is required.",
    },
    { status: 410 },
  );
}
