import type { MetadataRoute } from "next";

import { services } from "@/lib/site-data";

const routes = [
  "",
  "/about",
  "/services",
  "/pricing",
  "/book",
  "/how-online-physiotherapy-works",
  "/glasgow-physiotherapist",
  "/professional-standards",
  "/privacy-policy",
  "/medical-disclaimer",
  "/cancellation-policy",
  "/terms",
  "/contact"
];

// Generated at build time. A per-request sitemap re-runs the blog lookup on
// every crawler hit, which is how this route started returning 500s and hangs
// alongside /blog.
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://physioonclick.co.uk";

  // No `lastModified` on the static routes: there is no real content-change
  // date to report, and stamping `new Date()` on every build told crawlers that
  // all twelve pages changed every time the site was deployed. An absent
  // lastmod is honest; a fabricated one trains Google to ignore the signal.
  const staticEntries = routes.map((route) => ({ url: `${base}${route}` }));

  // Derived from the services array (not a hardcoded list) so a new/renamed
  // service can't silently drift out of the sitemap.
  const serviceEntries = services.map((service) => ({ url: `${base}/services/${service.slug}` }));

  // Blog is hidden for now (nav link removed) and its pages are noindex, so
  // they are deliberately not submitted here — that's what triggered the
  // "Excluded by noindex tag" Search Console alert in the first place.
  return [...staticEntries, ...serviceEntries];
}
