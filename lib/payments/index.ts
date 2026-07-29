import type { BookServiceId } from "@/lib/site-data";

export type BookingIntent = {
  service: BookServiceId;
  startISO: string;
  name: string;
  email: string;
  timeZone: string;
  focusAreas?: string[];
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
  return { service: service as BookServiceId, startISO, name, email, timeZone, focusAreas };
}
