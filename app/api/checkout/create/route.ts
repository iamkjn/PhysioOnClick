import { NextResponse } from "next/server";

import { bookServiceFor, isBookServiceId } from "@/lib/cal-services";
import { createStripeCheckout } from "@/lib/payments/stripe";
import type { BookingIntent } from "@/lib/payments";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_TIMEZONE = "Europe/London";

type Body = {
  service?: unknown;
  start?: unknown;
  name?: unknown;
  email?: unknown;
  timeZone?: unknown;
  focusAreas?: unknown;
  assessmentUid?: unknown;
  assessmentPersonId?: unknown;
  assessmentFormId?: unknown;
};

/** A Firestore auto-id / uid: alphanumeric, reasonable length. */
function isIdLike(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(v);
}

function bad(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return bad("Invalid request body.");
  }

  const { service, start, name, email, timeZone, focusAreas, assessmentUid, assessmentPersonId, assessmentFormId } =
    body;

  if (!isBookServiceId(service)) return bad("Invalid or missing service.");
  if (typeof start !== "string" || start.trim() === "") return bad("Invalid or missing start time.");
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return bad("Invalid start time.");
  if (startDate.getTime() <= Date.now()) return bad("start must be in the future.");

  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!trimmedName || trimmedName.length > 100) return bad("Invalid or missing name.");

  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  if (!trimmedEmail || trimmedEmail.length > 200 || !EMAIL_PATTERN.test(trimmedEmail)) {
    return bad("Invalid or missing email.");
  }

  let resolvedTimeZone = DEFAULT_TIMEZONE;
  if (timeZone !== undefined && timeZone !== null) {
    if (typeof timeZone !== "string" || timeZone.trim() === "" || timeZone.length > 64) {
      return bad("Invalid timeZone.");
    }
    resolvedTimeZone = timeZone;
  }

  const cleanedFocus = Array.isArray(focusAreas)
    ? focusAreas
        .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
        .map((f) => f.trim().slice(0, 40)) // cap each item so Stripe metadata can't overflow 500 chars
        .slice(0, 10)
    : undefined;

  const svc = bookServiceFor(service);
  const amountPence = Math.round(svc.price * 100);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // All three are optional (a free service or an edge case might skip the
  // pre-payment assessment step), but if present they must be well-formed —
  // they're trusted as-is by the payment webhook to patch Firestore docs.
  if (assessmentUid !== undefined && !isIdLike(assessmentUid)) return bad("Invalid assessmentUid.");
  if (assessmentPersonId !== undefined && !isIdLike(assessmentPersonId)) return bad("Invalid assessmentPersonId.");
  if (assessmentFormId !== undefined && !isIdLike(assessmentFormId)) return bad("Invalid assessmentFormId.");

  const intent: BookingIntent = {
    service,
    startISO: startDate.toISOString(),
    name: trimmedName,
    email: trimmedEmail,
    timeZone: resolvedTimeZone,
    focusAreas: cleanedFocus,
    ...(isIdLike(assessmentUid) ? { assessmentUid } : {}),
    ...(isIdLike(assessmentPersonId) ? { assessmentPersonId } : {}),
    ...(isIdLike(assessmentFormId) ? { assessmentFormId } : {}),
  };

  const result = await createStripeCheckout({
    intent,
    amountPence,
    serviceLabel: svc.title,
    successUrl: `${siteUrl}/book/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${siteUrl}/book?cancelled=1`,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, url: result.url });
}
