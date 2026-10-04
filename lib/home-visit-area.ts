import { normalisePostcode } from "@/lib/home-visit";

/**
 * Where home visits are offered, by postcode district (outward code).
 * This is the ONLY copy of the list: the booking UI, /api/checkout/create and
 * (stage 3) the mobile app's coverage endpoint all read it from here.
 * Owner decision 2026-10-04: Glasgow G1-G53, Paisley PA1-PA3, Hamilton ML3.
 */
const GLASGOW = Array.from({ length: 53 }, (_, i) => `G${i + 1}`);
export const HOME_VISIT_DISTRICTS: ReadonlySet<string> = new Set([...GLASGOW, "PA1", "PA2", "PA3", "ML3"]);

export const HOME_VISIT_AREA_LABEL = "Glasgow (G1–G53), Paisley (PA1–PA3) and Hamilton (ML3)";

/** "g31 4hs" -> "G31". Empty string when there is no recognisable district. */
export function outwardCode(postcode: string): string {
  const normalised = normalisePostcode(postcode.trim());
  const space = normalised.indexOf(" ");
  return space > 0 ? normalised.slice(0, space) : "";
}

export function isCoveredPostcode(postcode: string): boolean {
  const district = outwardCode(postcode);
  return district !== "" && HOME_VISIT_DISTRICTS.has(district);
}

export function outOfAreaMessage(postcode: string): string {
  const district = outwardCode(postcode) || "your area";
  return `We don't offer home visits in ${district} yet. Video consultations work anywhere in the UK, or contact us and we'll see if we can help.`;
}
