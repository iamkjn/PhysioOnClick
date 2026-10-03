import type { BookServiceId } from "@/lib/site-data";
import { isVisitType, type VisitType } from "@/lib/home-visit";

export type BookingIntent = {
  service: BookServiceId;
  startISO: string;
  name: string;
  email: string;
  timeZone: string;
  focusAreas?: string[];
  discountCode?: string;
  discountPercent?: string;
  originalAmountPence?: string;
  discountAmountPence?: string;
  /** Pre-payment self-assessment, submitted before checkout — see booking-step-time.tsx. */
  assessmentUid?: string;
  assessmentPersonId?: string;
  assessmentFormId?: string;
  /** "video" (default) or "home" (Glasgow-area home visit). Absent on legacy sessions = video. */
  visitType?: VisitType;
  /** "<address line>, <POSTCODE>" — home visits only (<= 132 chars, well under Stripe's 500). */
  homeVisitAddress?: string;
};

export type CreateCheckoutInput = {
  intent: BookingIntent;
  amountPence: number;
  serviceLabel: string;
  successUrl: string;
  cancelUrl: string;
};

export type CreateCheckoutResult =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; error: string };

/** Flatten a BookingIntent into Stripe metadata (string values only). */
export function intentToMetadata(intent: BookingIntent): Record<string, string> {
  return {
    service: intent.service,
    startISO: intent.startISO,
    name: intent.name,
    email: intent.email,
    timeZone: intent.timeZone,
    focusAreas: (intent.focusAreas ?? []).join(", "),
    ...(intent.discountCode ? { discountCode: intent.discountCode } : {}),
    ...(intent.discountPercent ? { discountPercent: intent.discountPercent } : {}),
    ...(intent.originalAmountPence ? { originalAmountPence: intent.originalAmountPence } : {}),
    ...(intent.discountAmountPence ? { discountAmountPence: intent.discountAmountPence } : {}),
    ...(intent.assessmentUid ? { assessmentUid: intent.assessmentUid } : {}),
    ...(intent.assessmentPersonId ? { assessmentPersonId: intent.assessmentPersonId } : {}),
    ...(intent.assessmentFormId ? { assessmentFormId: intent.assessmentFormId } : {}),
    ...(intent.visitType ? { visitType: intent.visitType } : {}),
    ...(intent.visitType === "home" && intent.homeVisitAddress
      ? { homeVisitAddress: intent.homeVisitAddress }
      : {}),
  };
}

/** Rebuild a BookingIntent from Stripe metadata. Returns null if required fields are missing. */
export function metadataToIntent(meta: Record<string, string> | undefined): BookingIntent | null {
  if (!meta) return null;
  const { service, startISO, name, email, timeZone } = meta;
  if (!service || !startISO || !name || !email || !timeZone) return null;
  const focusAreas = meta.focusAreas
    ? meta.focusAreas.split(",").map((f) => f.trim()).filter(Boolean)
    : undefined;
  return {
    service: service as BookServiceId,
    startISO,
    name,
    email,
    timeZone,
    focusAreas,
    ...(meta.discountCode ? { discountCode: meta.discountCode } : {}),
    ...(meta.discountPercent ? { discountPercent: meta.discountPercent } : {}),
    ...(meta.originalAmountPence ? { originalAmountPence: meta.originalAmountPence } : {}),
    ...(meta.discountAmountPence ? { discountAmountPence: meta.discountAmountPence } : {}),
    ...(meta.assessmentUid ? { assessmentUid: meta.assessmentUid } : {}),
    ...(meta.assessmentPersonId ? { assessmentPersonId: meta.assessmentPersonId } : {}),
    ...(meta.assessmentFormId ? { assessmentFormId: meta.assessmentFormId } : {}),
    ...(isVisitType(meta.visitType) ? { visitType: meta.visitType } : {}),
    // An address only means anything on a home visit; drop it otherwise.
    ...(meta.visitType === "home" && meta.homeVisitAddress
      ? { homeVisitAddress: meta.homeVisitAddress }
      : {}),
  };
}
