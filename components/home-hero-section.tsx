"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { HomeDashboard } from "@/components/home-dashboard";
import { useToast } from "@/components/toast-provider";

export function HomeHeroSection({ founderName }: { founderName: string }) {
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

  if (resolvedAuth && user) {
    return <HomeDashboard user={user} />;
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
