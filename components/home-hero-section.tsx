"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { User } from "firebase/auth";

import { SkeletonStatGrid, SkeletonText } from "@/components/skeleton";
import { track } from "@/lib/analytics";
import { accountUserOrNull } from "@/lib/guest-booking";

// home-dashboard.tsx's own tree (person-switcher.tsx -> lib/dependents.ts,
// recovery-percent-card.tsx -> lib/recovery.ts) does `import { db } from
// "@/lib/firebase"` — a value import, not the type-only one below — which
// pulls in the whole Firebase Auth/Firestore/Storage SDK at module scope. A
// static import here would undo the lazy-auth work above for every visitor,
// signed in or not, since it's evaluated regardless of which branch renders.
// It's only ever rendered once `user` is confirmed truthy, so loading it as
// an async chunk costs signed-out visitors (the vast majority on marketing
// traffic) nothing.
const HomeDashboard = dynamic(
  () => import("@/components/home-dashboard").then((mod) => mod.HomeDashboard),
  { ssr: false }
);

export function HomeHeroSection({
  founderName,
  homeVisitPrice,
  videoPrice,
  initialSignedIn = false,
}: {
  founderName: string;
  /** Formatted initial-assessment prices, derived from lib/home-visit-pricing by app/page.tsx. */
  homeVisitPrice: string;
  videoPrice: string;
  initialSignedIn?: boolean;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [resolvedAuth, setResolvedAuth] = useState(false);

  // Firebase Auth is loaded as an async chunk (not a top-level import) so it
  // doesn't delay hydration of the hero — the LCP element on this page — for
  // every anonymous visitor. See components/site-header.tsx for the same
  // pattern and rationale.
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    Promise.all([import("@/lib/firebase"), import("firebase/auth")]).then(
      ([{ auth }, { onAuthStateChanged }]) => {
        if (cancelled) return;
        if (!auth) {
          setResolvedAuth(true);
          return;
        }
        unsubscribe = onAuthStateChanged(auth, (u) => {
          setResolvedAuth(true);
          // A guest-checkout (anonymous) session gets the marketing hero, not
          // an empty patient dashboard.
          setUser(accountUserOrNull(u));
        });
      }
    );

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // Resolved and signed in → the dashboard.
  if (resolvedAuth && user) {
    return <HomeDashboard user={user} />;
  }

  // Still resolving. If the poc-auth cookie says this visitor was signed in,
  // show a dashboard-shaped loader instead of the marketing hero — otherwise a
  // returning patient sees the logged-out hero flash before their dashboard
  // paints. The cookie is read server-side (app/page.tsx) so this same branch
  // is chosen on the server and the client, avoiding a hydration mismatch.
  // Signed-out visitors (no cookie) get the marketing hero immediately, which
  // keeps it as the LCP element for SEO.
  if (!resolvedAuth && initialSignedIn) {
    return (
      <section className="home-dashboard">
        <div className="home-dashboard-glow" aria-hidden />
        <div className="site-shell home-dashboard-inner" aria-busy="true" aria-label="Loading your dashboard">
          <SkeletonText lines={2} lastLineWidth="45%" />
          <div style={{ marginTop: "var(--space-5)" }}>
            <SkeletonStatGrid count={4} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="home-hero">
      <Image
        className="home-hero-image"
        src="/home-hero-premium.webp"
        // Purely decorative hero photography sitting behind the real
        // H1/subhead text, which already carry the page's content.
        alt=""
        fill
        priority
      />
      <div className="home-hero-overlay" />
      <div className="site-shell home-hero-content">
        <div className="home-hero-text">
          <span className="location-pill">Home visits in Glasgow · Evenings &amp; weekends</span>
          <h1>
            Physiotherapy at home
            <span> in Glasgow</span>
          </h1>
          <p className="home-hero-copy">
            {founderName}, an HCPC registered physiotherapist, comes to your home in Glasgow, Paisley or
            Hamilton on weekday evenings and at weekends, so there&rsquo;s no need to take time off work.
            That includes neurological rehabilitation for stroke, Parkinson&rsquo;s, MS and FND. Home
            assessment {homeVisitPrice}, or {videoPrice} by video anywhere in the UK.
          </p>
          <div className="button-row">
            <Link
              className="button primary"
              href="/book?visit=home"
              prefetch
              onClick={() => track("book_now_click", { source: "homepage_hero" })}
            >
              Book a home visit
            </Link>
            <Link className="button secondary inverted" href="/physiotherapy-home-visits-glasgow" prefetch>
              Check areas &amp; prices
            </Link>
          </div>
          {/* Video is the second option: a quiet link under the CTAs rather
              than a third competing button, for visitors outside the
              home-visit area. */}
          <Link
            href="/how-online-physiotherapy-works"
            className="home-hero-secondary-link"
            style={{ color: "inherit", textDecoration: "underline", opacity: 0.85, marginTop: "0.75rem" }}
          >
            Outside Glasgow? See how video appointments work
          </Link>
        </div>
      </div>
    </section>
  );
}
