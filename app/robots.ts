import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://physioonclick.co.uk";

  // dev.physioonclick.co.uk is a testing environment (see wrangler.jsonc's
  // env.dev + scripts/deploy-dev.sh) that ended up indexed by Google — block
  // crawling entirely there, no sitemap. See app/layout.tsx's matching
  // noindex meta tag and next.config.mjs's X-Robots-Tag header.
  if (base.includes("dev.physioonclick.co.uk")) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/patient",
        "/api",
        "/auth",
        // Bare SVG cover-image routes (no HTML page structure, no <title>) —
        // Googlebot discovers them via <img src> on /services, /blog etc.,
        // tries to index them as pages, and flags them "Soft 404" in Search
        // Console since a raw image response looks error-like as a page.
        // These aren't in the sitemap and were never meant to be crawled
        // directly; blocking here moves them to "Excluded by robots.txt"
        // instead of a false-positive error.
        "/service-images",
        "/blog-images",
        "/specialism-images",
      ],
    },
    sitemap: `${base}/sitemap.xml`
  };
}
