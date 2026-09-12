import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * Without this, every `force-static` page (all of them - this site has no
 * ISR/`revalidate`) only has its prerendered HTML sitting in `.open-next/cache`,
 * which nothing serves: OpenNext falls back to fully re-rendering the page from
 * scratch on every request that lands on a Worker isolate without that render
 * already warm in memory. On a low-traffic site that's most requests, not a
 * cold-start edge case - confirmed in production 2026-09-12 as intermittent
 * "Worker exceeded CPU time limit" / Cloudflare 1102 errors on /exercises,
 * /blog and /services.
 *
 * This override reads the prerendered output back out of the Worker's own
 * static assets (the `ASSETS` binding every Worker already has) instead of
 * R2/KV, so it needs no new Cloudflare resource - `npm run deploy` copies
 * `.open-next/cache` into the assets bundle automatically. It's read-only
 * (no `revalidate` anywhere on this site, so nothing needs to write to it
 * post-deploy) - see the static-assets-incremental-cache override's own
 * docstring.
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
