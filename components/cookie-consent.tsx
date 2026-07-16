"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ponytail: localStorage + Google Consent Mode, no cookie library. The banner
// only exists to gate the analytics_storage consent set as "denied" by default
// in components/analytics.tsx. Essential/auth cookies never need consent.
const STORAGE_KEY = "poc-cookie-consent";

type Gtag = (command: string, action: string, params?: Record<string, unknown>) => void;

function updateConsent(granted: boolean) {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  gtag?.("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
}

export function CookieConsent() {
  // Start hidden; only reveal after we've confirmed no prior choice on the client,
  // to avoid a flash and SSR mismatch.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage blocked (private mode): show the banner, decision won't persist.
    }
    if (stored !== "granted" && stored !== "denied") {
      setVisible(true);
    }
  }, []);

  function choose(granted: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, granted ? "granted" : "denied");
    } catch {
      // ignore persistence failure
    }
    updateConsent(granted);
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="cookie-consent" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <p className="cookie-consent-text">
        We use essential cookies to run this site and, with your consent, anonymous analytics cookies to
        understand how it is used. See our{" "}
        <Link href="/privacy-policy">Privacy Policy</Link>.
      </p>
      <div className="cookie-consent-actions">
        <button type="button" className="cookie-consent-btn secondary" onClick={() => choose(false)}>
          Reject analytics
        </button>
        <button type="button" className="cookie-consent-btn primary" onClick={() => choose(true)}>
          Accept all
        </button>
      </div>
    </div>
  );
}
