import { bookServiceFor } from "@/lib/cal-services";
import type { VisitType } from "@/lib/home-visit";
import type { BookServiceId } from "@/lib/site-data";
import { homeVisitBand, homeVisitBandOfDistrict } from "@/lib/home-visit-area";

/**
 * Home-visit price per band (see lib/home-visit-area for which district is in
 * which). Owner decision 2026-11-27; this is the only place the amounts live.
 * Patients see one whole price for their postcode, never a separate fee line,
 * and marketing says "from" the nearest band's price.
 */
export const HOME_VISIT_BANDS = [
  { initial: 8000, followUp: 7000 },
  { initial: 9500, followUp: 8500 },
  { initial: 11000, followUp: 10000 },
  { initial: 12000, followUp: 11000 },
] as const;

/** Extra per visit used only to describe packages bought before they were withdrawn. */
const RETIRED_PACKAGE_HOME_EXTRA_PENCE = 3000;

/**
 * What the patient pays. A home visit is priced by postcode; without a known,
 * covered postcode this gives the starting price. Anything that takes money
 * must pass the postcode.
 */
export function sessionPricePence(service: BookServiceId, visitType?: VisitType, postcode?: string): number {
  const { price, sessions } = bookServiceFor(service);
  const videoPence = Math.round(price * 100);
  if (visitType !== "home") return videoPence;
  if (service !== "initial-assessment" && service !== "follow-up") {
    return videoPence + RETIRED_PACKAGE_HOME_EXTRA_PENCE * sessions;
  }
  const band = HOME_VISIT_BANDS[homeVisitBand(postcode ?? "") ?? 0];
  return service === "follow-up" ? band.followUp : band.initial;
}

/** The whole price of a service booked as home visits. */
export function homeVisitPricePence(service: BookServiceId, postcode?: string): number {
  return sessionPricePence(service, "home", postcode);
}

/** "£55" for whole pounds, "£51.50" otherwise. */
export function formatPounds(pence: number): string {
  return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`;
}

/** Starting home-visit prices for marketing copy ("from £80"). */
export const homeVisitPrices = {
  initial: `from ${formatPounds(HOME_VISIT_BANDS[0].initial)}`,
  followUp: `from ${formatPounds(HOME_VISIT_BANDS[0].followUp)}`,
};

/** Price wording for a set of districts: one figure, or "from" the lowest. */
export function homeVisitPriceRange(districts: readonly string[]): { initial: string; followUp: string } {
  const bands = [...new Set(districts.map((d) => homeVisitBandOfDistrict(d) ?? 0))].sort();
  const lowest = HOME_VISIT_BANDS[bands[0] ?? 0];
  const prefix = bands.length > 1 ? "from " : "";
  return {
    initial: prefix + formatPounds(lowest.initial),
    followUp: prefix + formatPounds(lowest.followUp),
  };
}

/** The one sentence that explains "from". */
export const HOME_VISIT_PRICE_NOTE = "Your price is confirmed before you book.";

/** How to pay. Cash is for home visits only (owner decision 2026-11-27). */
export const PAYMENT_METHODS_NOTE = "For a home visit you can pay after your session in cash or by secure link.";
