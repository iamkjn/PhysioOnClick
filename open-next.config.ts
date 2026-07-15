import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * ponytail: no incrementalCache override. This site is 141 static pages plus a
 * handful of force-dynamic routes and has no ISR revalidation, so there is
 * nothing for a cache layer to do yet. Add the R2 incremental cache
 * (`@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache`)
 * the day a route starts using `revalidate`.
 */
export default defineCloudflareConfig({});
