"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { forgetGrowthVisitor } from "@/lib/growth-tracking";

// ponytail: localStorage + Google Consent Mode, no cookie library. The banner
// gates the analytics_storage consent set as "denied" by default in
// components/analytics.tsx, and "Reject analytics" also switches off our own
// visit statistics (lib/growth-tracking.ts). Essential/auth cookies never need consent.
const STORAGE_KEY = "poc-cookie-consent";

type Gtag = (command: string, action: string, params?: Record<string, unknown>) => void;

function updateConsent(granted: boolean) {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  gtag?.("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
}

export function CookieConsent() {
  const pathname = usePathname();
  // Start hidden; only reveal after we've confirmed no prior choice on the client,
  // to avoid a flash and SSR mismatch.
  const [visible, setVisible] = useState(false);
  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) {
      setVisible(false);
      return;
    }

    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage blocked (private mode): show the banner, decision won't persist.
    }
    if (stored !== "granted" && stored !== "denied") {
      setVisible(true);
    }
  }, [isAdminRoute]);

  function choose(granted: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, granted ? "granted" : "denied");
    } catch {
      // ignore persistence failure
    }
    updateConsent(granted);
    if (!granted) forgetGrowthVisitor();
    setVisible(false);
  }

  if (!visible || isAdminRoute) {
    return null;
  }

  return (
    <div className="cookie-consent" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <p className="cookie-consent-text">
        We use essential cookies to run this site. To improve it we also keep simple visit statistics (pages
        viewed, where you came from, your approximate area) and, if you accept, Google Analytics cookies.
        &ldquo;Reject analytics&rdquo; turns both off. See our{" "}
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
