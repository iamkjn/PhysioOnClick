import { bookServiceFor } from "@/lib/cal-services";
import type { VisitType } from "@/lib/home-visit";
import type { BookServiceId } from "@/lib/site-data";

/**
 * A home visit costs the video price plus this much per visit (owner decision
 * 2026-11-07: £40, priced just under the Glasgow home-physio competition; it
 * replaced a separately shown £15 "travel fee"). Patients only ever see the
 * whole home-visit price, never a separate fee line. Bundles pay every visit's
 * amount upfront. This is the only place the amount is defined.
 */
export const HOME_VISIT_EXTRA_PENCE = 4000;

/**
 * What the patient pays before any discount: the video price, or for a home
 * visit the whole home-visit price (video price + HOME_VISIT_EXTRA_PENCE per
 * visit). Discount codes apply to this whole figure.
 */
export function sessionPricePence(service: BookServiceId, visitType?: VisitType): number {
  const { price, sessions } = bookServiceFor(service);
  const videoPence = Math.round(price * 100);
  return visitType === "home" ? videoPence + HOME_VISIT_EXTRA_PENCE * sessions : videoPence;
}

/** The whole price of a service booked as home visits. */
export function homeVisitPricePence(service: BookServiceId): number {
  return sessionPricePence(service, "home");
}

/** "£55" for whole pounds, "£51.50" otherwise. */
export function formatPounds(pence: number): string {
  return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`;
}

/** Formatted whole home-visit prices for marketing copy ("£80"). */
export const homeVisitPrices = {
  initial: formatPounds(homeVisitPricePence("initial-assessment")),
  followUp: formatPounds(homeVisitPricePence("follow-up")),
};
