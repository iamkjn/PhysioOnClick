// Route-level loading UI (Next.js Suspense fallback) for the signed-in areas.
// Shows a branded spinner during navigations and server data waits so
// transitions read as one system rather than a blank flash.
//
// Deliberately NOT at app/loading.tsx: a root Suspense boundary lets the 200
// status stream before a public page can call notFound(), so every unknown
// /blog, /services and /exercises slug answered 200 instead of 404 (soft-404s
// in Search Console). Public pages are static and prefetched, so they don't
// need the spinner; keep loading.tsx files below the public dynamic routes.
export default function Loading() {
  return (
    <div className="route-status" role="status" aria-live="polite" aria-label="Loading">
      <span className="app-spinner" aria-hidden="true" />
      <span className="route-status-text">Loading…</span>
    </div>
  );
}
