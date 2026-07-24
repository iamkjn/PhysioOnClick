"use client";

import { useEffect } from "react";
import Link from "next/link";

// Route error boundary (Next.js). Catches render/data errors and shows a
// recoverable screen — "Try again" re-runs the segment, matching the app's
// other state screens rather than crashing to a blank page.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div className="site-shell">
      <section className="page-hero stack">
        <span className="eyebrow">Something went wrong</span>
        <h1>We hit a snag loading this page.</h1>
        <p className="lead">
          This is usually temporary. Try again, and if it keeps happening you can head back home or contact us.
        </p>
        <nav className="button-row" aria-label="Recovery options">
          <button type="button" className="button primary" onClick={() => reset()}>
            Try again
          </button>
          <Link className="button secondary" href="/">
            Return home
          </Link>
          <Link className="button secondary" href="/contact">
            Contact us
          </Link>
        </nav>
      </section>
    </div>
  );
}
