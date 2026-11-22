// Author + clinical-review block shown on every exercise and condition page.
// Server component. Identity is read from lib/site-data, never hardcoded.

import { founder, invoiceIssuer } from "@/lib/site-data";

const initials = founder.name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]!.toUpperCase())
  .join("");

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function ByLine({
  reviewedOn,
  updatedOn,
  pending = false,
}: {
  reviewedOn: string;
  updatedOn?: string;
  /** Draft content not yet signed off: never claim a review that hasn't happened. */
  pending?: boolean;
}) {
  const reviewedLabel = longDate(reviewedOn);

  if (pending) {
    return (
      <div className="exlib-byline">
        <span className="exlib-byline__avatar" aria-hidden>
          {initials}
        </span>
        <div className="exlib-byline__text">
          <p className="exlib-byline__line">
            Draft awaiting clinical review by {founder.name}, HCPC-registered
            physiotherapist ({invoiceIssuer.hcpcNumber})
          </p>
          <p className="exlib-byline__meta">Not yet reviewed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exlib-byline">
      <span className="exlib-byline__avatar" aria-hidden>
        {initials}
      </span>
      <div className="exlib-byline__text">
        <p className="exlib-byline__line">
          Written and clinically reviewed by {founder.name}, HCPC-registered
          physiotherapist ({invoiceIssuer.hcpcNumber})
        </p>
        <p className="exlib-byline__meta">
          Reviewed {reviewedLabel}
          {updatedOn && updatedOn > reviewedOn ? `. Updated ${longDate(updatedOn)}` : null}
        </p>
      </div>
    </div>
  );
}
