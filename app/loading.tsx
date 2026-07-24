// Route-level loading UI (Next.js Suspense fallback). Shows a branded spinner
// during navigations and server data waits so transitions read as one system
// rather than a blank flash.
export default function Loading() {
  return (
    <div className="route-status" role="status" aria-live="polite" aria-label="Loading">
      <span className="app-spinner" aria-hidden="true" />
      <span className="route-status-text">Loading…</span>
    </div>
  );
}
