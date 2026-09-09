import type { MetadataRoute } from "next";

import { services } from "@/lib/site-data";
import { blogArticles } from "@/lib/blog";
import {
  allConditionSlugs,
  allExerciseSlugs,
  allSelfTestSlugs,
  bodyAreas,
  getCondition,
  getSelfTest,
} from "@/lib/exercise-library";

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

  // Public exercise library (Phase 1). Every URL is derived from
  // lib/exercise-library.ts — the same read helpers the pages themselves use —
  // so a new condition, exercise or body area can't silently drift out of the
  // sitemap, and the encoding here matches the route params exactly.
  const exerciseLibraryEntries = [
    { url: `${base}/exercises` },
    { url: `${base}/exercises/how-we-make-this` },
  ];

  // Condition hubs carry a truthful `lastModified`: `reviewedOn` is a real
  // clinical-review date stamped on the record, not a build timestamp.
  const conditionEntries = allConditionSlugs().map((slug) => ({
    url: `${base}/exercises/for/${slug}`,
    lastModified: new Date(getCondition(slug)!.reviewedOn),
  }));

  // No `lastModified` on the individual exercise or body-area pages: there is
  // no per-item review date to report yet (Phase 2 tracks those), and stamping
  // the build date would be exactly the fabricated signal the static routes
  // above deliberately avoid.
  const exerciseEntries = allExerciseSlugs().map((slug) => ({
    url: `${base}/exercises/${slug}`,
  }));

  const bodyAreaEntries = bodyAreas().map((area) => ({
    url: `${base}/exercises/area/${encodeURIComponent(area)}`,
  }));

  // Self-check tests (Phase 1 - Part B). The index carries no `lastModified`
  // (same rule as /exercises: no single content-change date), but each test
  // record has a real `reviewedOn` clinical-review date, so a truthful
  // `lastModified` is a signal worth sending - same as the condition hubs.
  const selfTestEntries = [
    { url: `${base}/exercises/tests` },
    ...allSelfTestSlugs().map((slug) => ({
      url: `${base}/exercises/tests/${slug}`,
      lastModified: new Date(getSelfTest(slug)!.reviewedOn),
    })),
  ];

  return [
    ...staticEntries,
    ...serviceEntries,
    ...blogEntries,
    ...exerciseLibraryEntries,
    ...conditionEntries,
    ...exerciseEntries,
    ...bodyAreaEntries,
    ...selfTestEntries,
  ];
}
