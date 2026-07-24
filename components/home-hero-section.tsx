"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { HomeDashboard } from "@/components/home-dashboard";
import { SkeletonStatGrid, SkeletonText } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

export function HomeHeroSection({
  founderName,
  initialSignedIn = false,
}: {
  founderName: string;
  initialSignedIn?: boolean;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [resolvedAuth, setResolvedAuth] = useState(false);
  const { show } = useToast();
  const welcomedRef = useRef(false);

  useEffect(() => {
    if (!auth) {
      setResolvedAuth(true);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setResolvedAuth(true);
      setUser(u);
      if (u && !welcomedRef.current) {
        welcomedRef.current = true;
        show(`Welcome back, ${u.displayName?.split(' ')[0] || 'there'}!`, 'info');
      }
    });
  }, [show]);

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
          <div style={{ marginTop: "1.5rem" }}>
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
        src="/home-hero-premium.svg"
        // Purely decorative background art (an assisted-stretch/mobility-
        // assessment illustration) sitting behind a dark overlay and the
        // real H1/subhead text, which already carry the page's content —
        // alt="" tells screen readers to skip it rather than double up.
        alt=""
        fill
        priority
      />
      <div className="home-hero-overlay" />
      <div className="site-shell home-hero-content">
        <span className="location-pill">Online Across the UK</span>
        <h1>
          Expert Physiotherapy,
          <span> One Click Away</span>
        </h1>
        <p className="home-hero-copy">
          Evidence-based physiotherapy by {founderName}, HCPC registered physiotherapist. Online consultations
          across the UK.
        </p>
        <div className="button-row">
          <Link className="button primary" href="/book" prefetch>
            Book Your Session
          </Link>
          <Link className="button secondary inverted" href="/services" prefetch>
            Explore Services
          </Link>
        </div>
      </div>
    </section>
  );
}
