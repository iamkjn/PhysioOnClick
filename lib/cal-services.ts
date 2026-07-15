import { pricing, type BookServiceId, type PricingItem } from "@/lib/site-data";

/**
 * Maps each bookable tier to a real Cal.com event type.
 *
 * Both the slots lookup and booking creation hit Cal.com's *public* v2 API,
 * which authenticates by `eventTypeSlug` + `username` and needs no API key —
 * so CAL_API_KEY is deliberately NOT used here. (It is still required by
 * /api/appointments/sync and admin cancel, which read/mutate existing bookings.)
 *
 * ponytail: the bundles have no Cal.com event type of their own, so they book
 * their FIRST session against the initial-assessment type. Give the bundles
 * their own event types in Cal.com and this mapping is the only thing to change.
 */
export type CalService = {
  id: BookServiceId;
  /** Cal.com event type slug — verified live against the public /v2/slots API. */
  calSlug: string;
  /** Length of the booked session, matching the Cal.com event type. Drives the
   *  calendar-file end time. Bundles book a 60-min first session. */
  minutes: number;
  /** How many sessions the tier buys. Drives the rail checklist copy. */
  sessions: number;
  /** "What's included" checklist shown in the left rail. */
  included: string[];
};

const CAL_SERVICES: Record<BookServiceId, CalService> = {
  "initial-assessment": {
    id: "initial-assessment",
    calSlug: "initial-online-assessment",
    minutes: 60,
    sessions: 1,
    included: [
      "60-minute video consultation",
      "Full movement and pain assessment",
      "Personalised exercise plan",
      "Written summary in your portal"
    ]
  },
  "follow-up": {
    id: "follow-up",
    calSlug: "online-follow-up",
    minutes: 30,
    sessions: 1,
    included: [
      "30-minute video consultation",
      "Progress review and plan update",
      "Adjusted exercise programme"
    ]
  },
  "bundle-4": {
    id: "bundle-4",
    calSlug: "initial-online-assessment",
    minutes: 60,
    sessions: 4,
    included: [
      "Four sessions, booked as you go",
      "Full assessment in session one",
      "Personalised exercise plan",
      "Progress tracking in your portal"
    ]
  },
  "bundle-8": {
    id: "bundle-8",
    calSlug: "initial-online-assessment",
    minutes: 60,
    sessions: 8,
    included: [
      "Eight sessions, booked as you go",
      "Full assessment in session one",
      "Personalised exercise plan",
      "Review milestones and progress tracking"
    ]
  }
};

export const CAL_USERNAME = process.env.NEXT_PUBLIC_CAL_USERNAME ?? "";

export function isBookServiceId(value: unknown): value is BookServiceId {
  return typeof value === "string" && value in CAL_SERVICES;
}

export function calServiceFor(id: BookServiceId): CalService {
  return CAL_SERVICES[id];
}

/** The tier's marketing copy (title/price/duration) joined to its Cal mapping. */
export function bookServiceFor(id: BookServiceId): CalService & PricingItem {
  const item = pricing.find((p) => p.id === id);
  if (!item) throw new Error(`No pricing entry for service "${id}"`);
  return { ...item, ...CAL_SERVICES[id] };
}

export function allBookServices(): Array<CalService & PricingItem> {
  return pricing.map((p) => ({ ...p, ...CAL_SERVICES[p.id] }));
}

/** Focus areas — spec Screen 1, multi-select, purely descriptive metadata. */
export const FOCUS_AREAS = [
  "Back & neck",
  "Shoulder",
  "Post-surgery",
  "Sports injury",
  "Neuro",
  "Paediatric"
] as const;

export type FocusArea = (typeof FOCUS_AREAS)[number];
