import { bookServiceFor, isBookServiceId } from "@/lib/cal-services";
import type { VisitType } from "@/lib/home-visit";
import type { BookServiceId } from "@/lib/site-data";

/**
 * Home visits cost the video price plus a travel fee per visit (owner decision
 * 2026-10-04). Bundles pay every visit's fee upfront. Discount codes never
 * reduce the travel fee. This is the only place the fee is defined.
 */
export const HOME_VISIT_TRAVEL_FEE_PENCE = 1500;

export function sessionPricePence(service: BookServiceId): number {
  return Math.round(bookServiceFor(service).price * 100);
}

export function travelFeePence(service: BookServiceId, visitType?: VisitType): number {
  if (visitType !== "home") return 0;
  return HOME_VISIT_TRAVEL_FEE_PENCE * bookServiceFor(service).sessions;
}

export function totalPence(input: { sessionPence: number; discountPence: number; travelFeePence: number }): number {
  return Math.max(0, input.sessionPence - input.discountPence) + input.travelFeePence;
}

/** "£55" for whole pounds, "£51.50" otherwise. */
export function formatPounds(pence: number): string {
  return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`;
}

export function travelFeeLabel(service: BookServiceId): string {
  const visits = bookServiceFor(service).sessions;
  return `Travel fee (${visits} home visit${visits === 1 ? "" : "s"} × ${formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE)})`;
}

export const TRAVEL_FEE_FALLBACK_LABEL = "Travel fee (home visit)";

/**
 * Label for a travel fee that has already been charged (receipt page, invoice
 * PDF, receipt email). Uses the same per-visit breakdown as the Stripe line
 * item, but only when the charge still matches the current fee for that
 * service; an unknown service, or a payment taken at a different fee, gets
 * the plain label so an old receipt never shows the wrong per-visit rate.
 */
export function chargedTravelFeeLabel(service: unknown, chargedPence: number): string {
  if (isBookServiceId(service) && travelFeePence(service, "home") === chargedPence) {
    return travelFeeLabel(service);
  }
  return TRAVEL_FEE_FALLBACK_LABEL;
}
