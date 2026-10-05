import Link from "next/link";

import { PRACTICE_PHONE, PRACTICE_PHONE_HREF } from "@/lib/structured-data";

/**
 * UK/Glasgow service line for the CTA band on the exercise library pages.
 * Those pages draw searchers from everywhere; this gives them (and Google)
 * a clear signal that the service is UK-only, and links the high-traffic
 * library pages through to the local landing pages.
 */
export function UkServiceLinks() {
  return (
    <p className="uk-service-links">
      <Link href="/online-physiotherapy-scotland">Online physiotherapy across the UK</Link>
      {" · "}
      <Link href="/glasgow-physiotherapist">Home visits in Glasgow</Link>
      {PRACTICE_PHONE && PRACTICE_PHONE_HREF ? (
        <>
          {" · "}
          <a href={PRACTICE_PHONE_HREF}>Call {PRACTICE_PHONE}</a>
        </>
      ) : null}
    </p>
  );
}
