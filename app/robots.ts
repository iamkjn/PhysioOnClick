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
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/patient", "/api", "/auth"] },
    sitemap: `${base}/sitemap.xml`
  };
}
