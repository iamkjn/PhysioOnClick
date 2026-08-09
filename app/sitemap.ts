import type { MetadataRoute } from "next";

import { fetchDynamicBlogs } from "@/lib/firestore-content";
import { services } from "@/lib/site-data";

const routes = [
  "",
  "/about",
  "/services",
  "/pricing",
  "/book",
  "/how-online-physiotherapy-works",
  "/blog",
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
  const blogArticles = await fetchDynamicBlogs();

  // No `lastModified` on the static routes: there is no real content-change
  // date to report, and stamping `new Date()` on every build told crawlers that
  // all twelve pages changed every time the site was deployed. An absent
  // lastmod is honest; a fabricated one trains Google to ignore the signal.
  const staticEntries = routes.map((route) => ({ url: `${base}${route}` }));

  // Derived from the services array (not a hardcoded list) so a new/renamed
  // service can't silently drift out of the sitemap.
  const serviceEntries = services.map((service) => ({ url: `${base}/services/${service.slug}` }));

  // The blog articles are currently `noindex` (see app/blog/[slug]/page.tsx).
  // They stay listed here deliberately — Google has to crawl them to discover
  // the noindex. Expect "Submitted URL marked noindex" in Search Console until
  // they are rewritten; that is the intended state, not a regression.
  const blogEntries = blogArticles.map((a) => ({ url: `${base}/blog/${a.slug}`, lastModified: new Date(a.publishedAt) }));

  return [...staticEntries, ...serviceEntries, ...blogEntries];
}
