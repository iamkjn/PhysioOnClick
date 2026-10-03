/**
 * Home visits (Glasgow area) are booked through the same flow, calendar and
 * prices as video calls. This module holds the shared vocabulary and the
 * address validation used by both the booking UI and /api/checkout/create.
 *
 * The home address is personal data: it is collected only for home visits,
 * capped in length, and must never be logged, put in analytics events or put
 * in a URL.
 */

export type VisitType = "video" | "home";

export const DEFAULT_VISIT_TYPE: VisitType = "video";

export const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  video: "Video call (anywhere in the UK)",
  home: "Home visit (Glasgow area)",
};

export const HOME_VISIT_HINT =
  "Home visits cover the Glasgow area. We'll confirm by email if your address is outside it.";

export const HOME_ADDRESS_MAX = 120;
export const HOME_POSTCODE_MAX = 10;

/**
 * Deliberately loose UK postcode shape (outward code + inward code). It only
 * catches obvious typos; it does not decide whether an address is in the
 * Glasgow area — the practice confirms that by email.
 */
const UK_POSTCODE = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/;

export function isVisitType(value: unknown): value is VisitType {
  return value === "video" || value === "home";
}

/** "g31  4hs" -> "G31 4HS". Leaves anything too short to split untouched (beyond trimming/upper-casing). */
export function normalisePostcode(raw: string): string {
  const compact = raw.replace(/\s+/g, "").toUpperCase();
  if (compact.length < 5) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

/** The single string stored in Stripe/Cal.com metadata and Firestore. */
export function formatHomeVisitAddress(addressLine: string, postcode: string): string {
  return `${addressLine}, ${postcode}`;
}

export type HomeVisitValidation =
  | { ok: true; addressLine: string; postcode: string; homeVisitAddress: string }
  | { ok: false; field: "address" | "postcode"; error: string };

export function validateHomeVisit(addressLine: unknown, postcode: unknown): HomeVisitValidation {
  const line = typeof addressLine === "string" ? addressLine.replace(/\s+/g, " ").trim() : "";
  if (!line) {
    return { ok: false, field: "address", error: "Enter the address for your home visit." };
  }
  if (line.length > HOME_ADDRESS_MAX) {
    return {
      ok: false,
      field: "address",
      error: `Keep the address to ${HOME_ADDRESS_MAX} characters or fewer.`,
    };
  }

  const rawPostcode = typeof postcode === "string" ? postcode.trim() : "";
  if (!rawPostcode) {
    return { ok: false, field: "postcode", error: "Enter the postcode for your home visit." };
  }
  if (rawPostcode.length > HOME_POSTCODE_MAX) {
    return { ok: false, field: "postcode", error: "That postcode doesn't look right." };
  }
  const cleanPostcode = normalisePostcode(rawPostcode);
  if (!UK_POSTCODE.test(cleanPostcode)) {
    return { ok: false, field: "postcode", error: "That postcode doesn't look right." };
  }

  return {
    ok: true,
    addressLine: line,
    postcode: cleanPostcode,
    homeVisitAddress: formatHomeVisitAddress(line, cleanPostcode),
  };
}

/**
 * "Home visit at <address>" for patient-facing copy, or null for a video
 * booking (or a home visit with no address on record). Callers must
 * HTML-escape the result themselves.
 */
export function homeVisitLabel(visitType: unknown, homeVisitAddress: unknown): string | null {
  if (visitType !== "home" || typeof homeVisitAddress !== "string" || !homeVisitAddress.trim()) return null;
  return `Home visit at ${homeVisitAddress.trim()}`;
}
