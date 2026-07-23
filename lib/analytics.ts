// lib/analytics.ts
//
// SSR-safe, consent-gated Firebase Analytics wrapper.
//
// Firebase Analytics (`firebase/analytics`) only runs in the browser and must be
// feature-detected with `isSupported()` -- importing or calling it during SSR or
// on Cloudflare Workers throws. So this module NEVER imports `firebase/analytics`
// at the top level (the `import type` below is erased at compile time); it
// dynamically `import()`s the SDK only inside a browser + consent guard.
//
// Consent: mirrors the UK PECR gate used by components/analytics.tsx and
// components/cookie-consent.tsx. Nothing initialises or logs until the visitor
// has set localStorage `poc-cookie-consent` === 'granted'. Analytics also no-ops
// entirely when NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is unset (empty measurementId).
//
// Public API:
//   track(eventName, params?)  -- log any event; safe to call anywhere, anytime.
//   trackPageView(path)        -- log a SPA "page_view" on route change.

import { firebaseApp, firebaseMeasurementId } from "./firebase";
import type { Analytics } from "firebase/analytics";

type AnalyticsModule = typeof import("firebase/analytics");

const CONSENT_KEY = "poc-cookie-consent";

let analyticsInstance: Analytics | null = null;
let logEventFn: AnalyticsModule["logEvent"] | null = null;
let initPromise: Promise<void> | null = null;

function hasConsent(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    // localStorage blocked (private mode / SSR): treat as no consent.
    return false;
  }
}

// The full gate. Returns true only when it is safe to load and use Analytics:
// in the browser, with a configured app + measurementId, and granted consent.
function analyticsUsable(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(firebaseApp) &&
    Boolean(firebaseMeasurementId) &&
    hasConsent()
  );
}

// Lazily import and initialise Analytics exactly once. Every failure path
// resolves to a no-op so analytics can never break the surrounding app.
function ensureInitialised(): Promise<void> {
  if (analyticsInstance && logEventFn) {
    return Promise.resolve();
  }
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const mod = await import("firebase/analytics");
        // isSupported() guards environments where measurement/IndexedDB etc.
        // are unavailable -- it also throws-proofs SSR/Workers.
        if (!(await mod.isSupported())) {
          return;
        }
        analyticsInstance = mod.getAnalytics(firebaseApp!);
        logEventFn = mod.logEvent;
      } catch {
        // Swallow: leave analyticsInstance/logEventFn null -> track() no-ops.
      }
    })();
  }
  return initPromise;
}

/**
 * Log an analytics event. No-ops on the server, when the SDK is unsupported,
 * when consent has not been granted, or when measurementId is empty. Fire-and-
 * forget: never throws, never blocks, never awaits from the caller's side.
 */
export function track(eventName: string, params?: Record<string, unknown>): void {
  if (!analyticsUsable()) {
    return;
  }
  void ensureInitialised().then(() => {
    if (!analyticsInstance || !logEventFn) {
      return;
    }
    try {
      logEventFn(analyticsInstance, eventName, params);
    } catch {
      // ignore -- analytics must never surface an error to the user
    }
  });
}

/**
 * Log a single-page-app page view on route change.
 *
 * Only the pathname is logged (no query string): magic-link and other flows can
 * carry tokens/PII in the query, and those must never reach Analytics. This
 * matches the app's privacy posture and keeps page_path clean for engagement
 * reporting.
 */
export function trackPageView(path: string): void {
  const page_location =
    typeof window !== "undefined" ? `${window.location.origin}${path}` : undefined;
  const page_title = typeof document !== "undefined" ? document.title : undefined;
  track("page_view", {
    page_path: path,
    ...(page_location ? { page_location } : {}),
    ...(page_title ? { page_title } : {})
  });
}
