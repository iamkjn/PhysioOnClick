"use client";

import { useState } from "react";

import { isCoveredPostcode, outwardCode } from "@/lib/home-visit-area";
import { formatPounds, sessionPricePence } from "@/lib/home-visit-pricing";
import { normalisePostcode } from "@/lib/home-visit";
import { PRACTICE_PHONE, PRACTICE_PHONE_HREF } from "@/lib/practice-contact";
import { REQUEST_POSTCODE_KEY, VISIT_REQUEST_PATH } from "@/lib/visit-request";

const FULL_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/;

/** Homepage "do you visit me?" check. The postcode stays in this browser. */
export function HomePostcodeCheck() {
  const [postcode, setPostcode] = useState("");
  const normalised = normalisePostcode(postcode.trim());
  const complete = FULL_POSTCODE.test(normalised);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (complete) window.sessionStorage.setItem(REQUEST_POSTCODE_KEY, normalised);
    } catch {
      // Storage blocked: the form asks again.
    }
    window.location.assign(VISIT_REQUEST_PATH);
  }

  return (
    <section className="page-section simple-section" aria-labelledby="postcode-check-heading">
      <div className="site-shell home-postcode-check">
        <h2 id="postcode-check-heading">Do we visit your home?</h2>
        <form onSubmit={submit}>
          <label htmlFor="home-postcode">Your postcode</label>
          <div className="home-postcode-row">
            <input
              id="home-postcode"
              autoComplete="postal-code"
              autoCapitalize="characters"
              placeholder="G31 4HS"
              maxLength={10}
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
            />
            <button className="button primary" type="submit">
              Request a visit
            </button>
          </div>
        </form>
        <p role="status" className={complete && isCoveredPostcode(normalised) ? "visit-coverage is-covered" : "visit-coverage"}>
          {!complete
            ? "No payment to send a request."
            : isCoveredPostcode(normalised)
              ? `Yes, we visit ${outwardCode(normalised)}. First visit ${formatPounds(sessionPricePence("initial-assessment", "home", normalised))}.`
              : `${outwardCode(normalised)} is outside our usual area. Ask us anyway, or choose video.`}
        </p>
        <p className="visit-request-small">
          Rather talk? Call <a href={PRACTICE_PHONE_HREF}>{PRACTICE_PHONE}</a>.
        </p>
      </div>
    </section>
  );
}
