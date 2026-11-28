"use client";

import { useState } from "react";
import { normalisePostcode } from "@/lib/home-visit";
import { homeVisitBand, outwardCode } from "@/lib/home-visit-area";
import { formatPounds, sessionPricePence } from "@/lib/home-visit-pricing";

/** What a postcode costs. Owner-only screen, so it can name the price band. */
export function PostcodePrice({ postcode }: { postcode: string }) {
  const district = outwardCode(postcode);
  if (!district) {
    return <p className="muted owner-price__hint">Enter a full postcode, for example G31 4HS.</p>;
  }
  const band = homeVisitBand(postcode);
  if (band === null) {
    return (
      <p className="owner-price__outside" role="status">
        <strong>{district} is outside your home-visit area.</strong> There is no set price for it.
      </p>
    );
  }
  return (
    <dl className="owner-price" role="status">
      <div><dt>Initial assessment</dt><dd>{formatPounds(sessionPricePence("initial-assessment", "home", postcode))}</dd></div>
      <div><dt>Follow-up</dt><dd>{formatPounds(sessionPricePence("follow-up", "home", postcode))}</dd></div>
      <div><dt>Area</dt><dd>{district}, band {band + 1} of 4</dd></div>
    </dl>
  );
}

export function AdminPriceChecker() {
  const [postcode, setPostcode] = useState("");
  return (
    <div className="stack">
      <div>
        <h1>Price checker</h1>
        <p className="muted">Home-visit price for any postcode. Only you can see this page.</p>
      </div>
      <div className="panel stack owner-form">
        <label>
          Patient&apos;s postcode
          <input
            className="input"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            onBlur={() => setPostcode((p) => normalisePostcode(p))}
            autoComplete="off"
            maxLength={10}
          />
        </label>
        <PostcodePrice postcode={postcode} />
        <p className="muted owner-price__hint">
          Video appointments: initial assessment {formatPounds(sessionPricePence("initial-assessment"))}, follow-up{" "}
          {formatPounds(sessionPricePence("follow-up"))}.
        </p>
      </div>
    </div>
  );
}
