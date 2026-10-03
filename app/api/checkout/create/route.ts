import { NextResponse } from "next/server";

import { bookServiceFor, isBookServiceId, serviceLabelFor } from "@/lib/cal-services";
import { normaliseDiscountCode, validateCheckoutDiscount } from "@/lib/checkout-discounts";
import { createStripeCheckout } from "@/lib/payments/stripe";
import type { BookingIntent } from "@/lib/payments";
import { DEFAULT_VISIT_TYPE, isVisitType, validateHomeVisit, type VisitType } from "@/lib/home-visit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_TIMEZONE = "Europe/London";

type Body = {
  service?: unknown;
  start?: unknown;
  name?: unknown;
  email?: unknown;
  timeZone?: unknown;
  focusAreas?: unknown;
  discountCode?: unknown;
  assessmentUid?: unknown;
  assessmentPersonId?: unknown;
  assessmentFormId?: unknown;
  visitType?: unknown;
  homeAddressLine?: unknown;
  homePostcode?: unknown;
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

  const {
    service,
    start,
    name,
    email,
    timeZone,
    focusAreas,
    discountCode,
    assessmentUid,
    assessmentPersonId,
    assessmentFormId,
    visitType,
    homeAddressLine,
    homePostcode,
  } = body;

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
  const normalizedEmail = trimmedEmail.toLowerCase();

  let resolvedTimeZone = DEFAULT_TIMEZONE;
  if (timeZone !== undefined && timeZone !== null) {
    if (typeof timeZone !== "string" || timeZone.trim() === "" || timeZone.length > 64) {
      return bad("Invalid timeZone.");
    }
    resolvedTimeZone = timeZone;
  }

  // Home visits (Glasgow area) cost the same and use the same calendar; they
  // only add a required address. Any address sent with a video booking is
  // ignored so it is never stored. Errors never echo the address back.
  let resolvedVisitType: VisitType = DEFAULT_VISIT_TYPE;
  if (visitType !== undefined && visitType !== null) {
    if (!isVisitType(visitType)) return bad("Invalid visit type.");
    resolvedVisitType = visitType;
  }
  let homeVisitAddress: string | undefined;
  if (resolvedVisitType === "home") {
    const home = validateHomeVisit(homeAddressLine, homePostcode);
    if (!home.ok) return bad(home.error);
    homeVisitAddress = home.homeVisitAddress;
  }

  const cleanedFocus = Array.isArray(focusAreas)
    ? focusAreas
        .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
        .map((f) => f.trim().slice(0, 40)) // cap each item so Stripe metadata can't overflow 500 chars
        .slice(0, 10)
    : undefined;

  const svc = bookServiceFor(service);
  const originalAmountPence = Math.round(svc.price * 100);
  let amountPence = originalAmountPence;
  let appliedDiscount:
    | { code: string; percent: number; amountPence: number }
    | null = null;

  const cleanedDiscountCode = normaliseDiscountCode(discountCode);
  if (cleanedDiscountCode) {
    const discount = await validateCheckoutDiscount({
      code: cleanedDiscountCode,
      email: normalizedEmail,
      service,
    });
    if (!discount.ok) return bad(discount.error);
    amountPence = discount.amountPence;
    appliedDiscount = {
      code: discount.code,
      percent: discount.percent,
      amountPence: discount.discountAmountPence,
    };
  }

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
    email: normalizedEmail,
    timeZone: resolvedTimeZone,
    focusAreas: cleanedFocus,
    visitType: resolvedVisitType,
    ...(homeVisitAddress ? { homeVisitAddress } : {}),
    ...(appliedDiscount
      ? {
          discountCode: appliedDiscount.code,
          discountPercent: String(appliedDiscount.percent),
          originalAmountPence: String(originalAmountPence),
          discountAmountPence: String(appliedDiscount.amountPence),
        }
      : {}),
    ...(isIdLike(assessmentUid) ? { assessmentUid } : {}),
    ...(isIdLike(assessmentPersonId) ? { assessmentPersonId } : {}),
    ...(isIdLike(assessmentFormId) ? { assessmentFormId } : {}),
  };

  const result = await createStripeCheckout({
    intent,
    amountPence,
    serviceLabel: serviceLabelFor(service, resolvedVisitType),
    successUrl: `${siteUrl}/book/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${siteUrl}/book?cancelled=1`,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, url: result.url });
}
