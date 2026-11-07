// lib/internal-paths.ts
//
// Visits that are the practice's own, not patients': the admin area, and any copy
// of the site that isn't the live one (dev.physioonclick.co.uk, localhost). These
// must not count in Google Analytics, and admin URLs carry patient and booking ids.
//
// Shared by lib/analytics.ts (Firebase Analytics calls) and components/analytics.tsx
// (the gtag.js tag, which sends its own automatic page views).

const LIVE_HOSTNAME = "physioonclick.co.uk";

export function isInternalLocation({ hostname, pathname }: Pick<Location, "hostname" | "pathname">): boolean {
  return hostname !== LIVE_HOSTNAME || pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Inline script that switches Google Analytics off during internal visits, using
 * Google's own per-property opt-out flag (`window['ga-disable-<measurement id>']`),
 * which gtag.js and Firebase both honour.
 *
 * It has to run before gtag.js loads, and it wraps pushState/replaceState rather
 * than waiting for a React effect, because gtag.js sends a page view from its own
 * history listener and would otherwise record the /admin navigation first.
 */
export function internalVisitGuardScript(measurementIds: string[]): string {
  return `
    (function () {
      var ids = ${JSON.stringify(measurementIds)};
      function sync() {
        var path = window.location.pathname;
        var off = window.location.hostname !== ${JSON.stringify(LIVE_HOSTNAME)} ||
          path === '/admin' || path.indexOf('/admin/') === 0;
        ids.forEach(function (id) { window['ga-disable-' + id] = off; });
      }
      sync();
      ['pushState', 'replaceState'].forEach(function (name) {
        var original = window.history[name];
        window.history[name] = function () {
          var result = original.apply(this, arguments);
          sync();
          return result;
        };
      });
      window.addEventListener('popstate', sync);
    })();
  `;
}
