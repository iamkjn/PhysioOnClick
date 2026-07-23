"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { trackPageView } from "@/lib/analytics";

// Logs a Firebase Analytics "page_view" on every App Router navigation. The
// track() call is itself consent-gated and SSR-safe (see lib/analytics.ts), so
// this component is free to mount unconditionally in the root layout.
//
// Only the pathname is passed on (query strings are dropped in trackPageView) to
// avoid leaking any tokens/PII that live in the query into Analytics. We still
// depend on searchParams so a query-only navigation re-fires a page view.
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) {
      return;
    }
    trackPageView(pathname);
    // searchParams is a dependency so query-only route changes re-fire, but its
    // value is intentionally not forwarded to the logged path.
  }, [pathname, searchParams]);

  return null;
}

// useSearchParams() opts a component into client-side rendering and must sit
// under a Suspense boundary in Next 15, otherwise the whole route is forced
// dynamic at build. The fallback is null -- this renders nothing either way.
export function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
