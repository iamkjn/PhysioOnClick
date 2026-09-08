// Author + clinical-review block shown on every exercise and condition page.
// Server component. Identity is read from lib/site-data, never hardcoded.

import { founder, invoiceIssuer } from "@/lib/site-data";

const initials = founder.name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]!.toUpperCase())
  .join("");

export function ByLine({ reviewedOn }: { reviewedOn: string }) {
  const reviewedLabel = new Date(reviewedOn).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
        <p className="exlib-byline__meta">Reviewed {reviewedLabel}</p>
      </div>
    </div>
  );
}
