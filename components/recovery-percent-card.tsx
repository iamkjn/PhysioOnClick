"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { getRecoveryScoreSeries, computeRecoveryPercent, isRecoveryRegressing } from "@/lib/recovery";
import { Skeleton, SkeletonCircle } from "@/components/skeleton";

interface Props {
  // Optional because staticPercent mode (below) never touches Firestore and
  // so never needs these — existing callers keep passing both as before.
  uid?: string;
  personId?: string;
  // When provided, skips the Firestore fetch entirely and renders this value
  // directly — e.g. an admin-entered sessionSummary.recoveryPercent, already
  // resolved by the caller and not tied to any particular uid/personId fetch.
  staticPercent?: number;
  // Overrides the default "Improvement since..." / regressing copy under the
  // ring, for callers whose percent isn't sourced from the check-in series
  // that copy describes.
  subtitle?: string;
}

// Geometry for the SVG progress ring. r drives the circumference the
// stroke-dasharray/offset animate against.
const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;

export function RecoveryPercentCard({ uid, personId, staticPercent, subtitle }: Props) {
  const [percent, setPercent] = useState<number | null | undefined>(
    staticPercent !== undefined ? staticPercent : undefined
  );
  const [regressing, setRegressing] = useState(false);
  // computeRecoveryPercent(logs) also returns null for a patient with no
  // check-ins yet, so a fetch failure needs its own flag — otherwise a real
  // network error renders the same welcoming "log your first check-in" copy
  // as a brand-new patient, which is misleading.
  const [fetchError, setFetchError] = useState(false);
  // Bumped by the retry button to re-run the effect (the error is usually
  // transient: a dropped connection or emulator that wasn't up yet).
  const [reloadKey, setReloadKey] = useState(0);
  // Count-up target for the percent label; ramps from 0 to `percent` on
  // change instead of snapping straight to the resolved value.
  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    if (staticPercent !== undefined) {
      setPercent(staticPercent);
      setRegressing(false);
      return;
    }
    if (!uid || !personId) return;
    let live = true;
    setPercent(undefined);
    setFetchError(false);
    getRecoveryScoreSeries(uid, personId, 9999)
      .then((logs) => {
        if (!live) return;
        setPercent(computeRecoveryPercent(logs));
        setRegressing(isRecoveryRegressing(logs));
      })
      .catch(() => {
        if (!live) return;
        setPercent(null);
        setFetchError(true);
      });
    return () => {
      live = false;
    };
  }, [uid, personId, reloadKey, staticPercent]);

  useEffect(() => {
    if (typeof percent !== "number") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayPercent(percent);
      return;
    }
    const duration = 900;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayPercent(Math.round(percent * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [percent]);

  if (percent === undefined) {
    return (
      <div className="panel recovery-percent-card recovery-percent-card--pending">
        <SkeletonCircle size="132px" />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", flex: 1 }}>
          <Skeleton height="1rem" width="120px" />
          <Skeleton height="0.75rem" width="80%" />
        </div>
      </div>
    );
  }

  if (percent === null) {
    return (
      <div className="panel recovery-percent-card recovery-percent-card--empty">
        <h3>Recovery score</h3>
        {fetchError ? (
          <>
            <p className="muted">We couldn&apos;t load your recovery score just now.</p>
            <button type="button" className="recovery-retry" onClick={() => setReloadKey((k) => k + 1)}>
              Try again
            </button>
          </>
        ) : (
          <>
            <p className="muted">Log your first pain check-in and your recovery score appears here.</p>
            <Link className="recovery-empty-link" href="/patient/recovery">
              Log a check-in
              <span aria-hidden>→</span>
            </Link>
          </>
        )}
      </div>
    );
  }

  const offset = RING_C * (1 - percent / 100);
  const stroke = regressing ? "var(--color-coral)" : "url(#recoveryRingGradient)";

  return (
    <div className="panel recovery-percent-card recovery-percent-card--result">
      <div className="recovery-ring" role="img" aria-label={`Recovery score ${percent} percent`}>
        <svg viewBox="0 0 120 120">
          <defs>
            <linearGradient id="recoveryRingGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-primary-dark)" />
              <stop offset="100%" stopColor="var(--color-primary-glow)" />
            </linearGradient>
          </defs>
          <circle className="recovery-ring-track" cx="60" cy="60" r={RING_R} />
          <circle
            className="recovery-ring-progress"
            cx="60"
            cy="60"
            r={RING_R}
            stroke={stroke}
            style={{ "--dash-c": `${RING_C}`, "--dash-offset": `${offset}` } as CSSProperties}
          />
        </svg>
        <div className="recovery-ring-value" aria-hidden>
          <b style={{ fontFamily: "var(--font-serif)" }}>{displayPercent}%</b>
        </div>
      </div>
      <div className="recovery-percent-copy">
        <h3>Recovery score</h3>
        <p className="muted">
          {subtitle ?? (regressing
            ? "Pain is higher than your first check-in. Mention it at your next session."
            : "Improvement since your first pain check-in.")}
        </p>
      </div>
    </div>
  );
}
