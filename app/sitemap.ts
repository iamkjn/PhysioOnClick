import type { MetadataRoute } from "next";

import { services } from "@/lib/site-data";
import { blogArticles } from "@/lib/blog";

const routes = [
  "",
  "/about",
  "/services",
  "/blog",
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

  // Blog was noindex/omitted here until the 2026-08-25 rewrite (108 templated
  // articles collapsed into 36 genuinely distinct ones, see lib/blog.ts) — now
  // submitted like any other content. Unlike the static routes, blog posts have
  // a real content date, so a truthful `lastModified` (last review, else publish
  // date) is a signal worth sending rather than a fabricated one.
  const blogEntries = blogArticles.map((article) => ({
    url: `${base}/blog/${article.slug}`,
    lastModified: new Date(article.lastReviewedAt || article.publishedAt),
  }));

  return [...staticEntries, ...serviceEntries, ...blogEntries];
}
