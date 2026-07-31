import { NextResponse } from "next/server";

import { createCalBooking } from "@/lib/cal-booking";
import { FieldValue, getAdminDb } from "@/lib/firebase-admin";
import { metadataToIntent } from "@/lib/payments";
import { verifyStripeSignature } from "@/lib/payments/stripe";
import { calServiceFor } from "@/lib/cal-services";
import type { BookServiceId } from "@/lib/site-data";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      amount_total?: number;
      currency?: string;
      metadata?: Record<string, string>;
    };
  };
};

type SlotState = "free" | "taken" | "unknown";

/**
 * Ask Cal.com whether the exact slot is still offered.
 * - "free":    Cal answered and still offers the slot.
 * - "taken":   Cal answered but the slot is no longer offered.
 * - "unknown": we could NOT verify (network error, 5xx, 429, bad JSON).
 *
 * On "unknown" the caller should still attempt the booking and let Cal.com be
 * the authority — a momentary Cal outage must not charge a customer and then
 * record slot_unavailable for a slot that was actually free.
 */
async function checkSlot(service: BookServiceId, startISO: string): Promise<SlotState> {
  // Read live (not the module-level constant) so this route reacts to the
  // request-time env, matching how this handler is exercised in tests.
  const calUsername = process.env.NEXT_PUBLIC_CAL_USERNAME ?? "";
  if (!calUsername) return "unknown";
  const day = startISO.slice(0, 10); // YYYY-MM-DD
  const url = new URL("https://api.cal.com/v2/slots");
  url.searchParams.set("eventTypeSlug", calServiceFor(service).calSlug);
  url.searchParams.set("username", calUsername);
  url.searchParams.set("start", day);
  url.searchParams.set("end", day);

  let res: Response;
  try {
    // Slots endpoint requires cal-api-version 2024-09-04 (2024-08-13 is the
    // bookings version and returns an error here — see app/api/cal/slots).
    res = await fetch(url.toString(), { headers: { "cal-api-version": "2024-09-04" } });
  } catch {
    return "unknown";
  }
  if (!res.ok) return "unknown";

  let json: { data?: Record<string, Array<{ start?: string }>> };
  try {
    json = (await res.json()) as { data?: Record<string, Array<{ start?: string }>> };
  } catch {
    return "unknown";
  }

  const wanted = new Date(startISO).getTime();
  for (const slots of Object.values(json.data ?? {})) {
    for (const slot of slots ?? []) {
      if (slot.start && new Date(slot.start).getTime() === wanted) return "free";
    }
  }
  return "taken";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  // Idempotency: deterministic doc id per Stripe event.
  const paymentRef = db.collection("payments").doc(event.id);
  const existing = await paymentRef.get();
  if (existing.exists) return NextResponse.json({ received: true }, { status: 200 });

  const session = event.data.object;
  const intent = metadataToIntent(session.metadata);
  if (!intent) {
    console.error("Stripe webhook missing booking metadata", session.id);
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  // Reserve the idempotency doc BEFORE the slot check / booking. Any Stripe
  // retry after this point will see this doc at the read above and no-op —
  // it will never re-run the slot check or re-book. A doc stuck at
  // status:"processing" is an intentional signal for admin follow-up.
  await paymentRef.set({
    provider: "stripe",
    stripeSessionId: session.id,
    calBookingUid: "",
    amountPence: session.amount_total ?? 0,
    currency: session.currency ?? "gbp",
    status: "processing",
    email: intent.email,
    service: intent.service,
    createdAt: FieldValue.serverTimestamp(),
  });

  if ((await checkSlot(intent.service, intent.startISO)) === "taken") {
    // Cal confirmed the slot is gone between checkout and webhook. Record for
    // admin follow-up/refund. ("unknown" falls through to the booking attempt
    // below so a transient Cal error can't charge-without-booking.)
    await paymentRef.set({
      provider: "stripe",
      stripeSessionId: session.id,
      calBookingUid: "",
      amountPence: session.amount_total ?? 0,
      currency: session.currency ?? "gbp",
      status: "slot_unavailable",
      email: intent.email,
      service: intent.service,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.error("Paid but slot unavailable — refund required", session.id);
    return NextResponse.json({ received: true, warning: "slot_unavailable" }, { status: 200 });
  }

  const booking = await createCalBooking({
    service: intent.service,
    startISO: intent.startISO,
    name: intent.name,
    email: intent.email,
    timeZone: intent.timeZone,
    focusAreas: intent.focusAreas,
  });

  if (!booking.ok) {
    await paymentRef.set({
      provider: "stripe",
      stripeSessionId: session.id,
      calBookingUid: "",
      amountPence: session.amount_total ?? 0,
      currency: session.currency ?? "gbp",
      status: "booking_failed",
      email: intent.email,
      service: intent.service,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.error("Paid but Cal booking failed — refund required", session.id);
    return NextResponse.json({ received: true, warning: "booking_failed" }, { status: 200 });
  }

  await paymentRef.set({
    provider: "stripe",
    stripeSessionId: session.id,
    calBookingUid: booking.uid,
    amountPence: session.amount_total ?? 0,
    currency: session.currency ?? "gbp",
    status: "paid",
    email: intent.email,
    service: intent.service,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Reconcile: if cal-webhook already created the bookings doc, stamp it paid.
  // If it hasn't yet, cal-webhook will find this payment doc (Task 6).
  try {
    const bookingSnap = await db
      .collection("bookings")
      .where("calBookingUid", "==", booking.uid)
      .limit(1)
      .get();
    if (!bookingSnap.empty) {
      await bookingSnap.docs[0].ref.update({
        paid: true,
        amountPaidPence: session.amount_total ?? 0,
        paymentProvider: "stripe",
      });
    }
  } catch (error) {
    console.error("Payment recorded but booking paid-flag update failed", error);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
