import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://physioonclick.co.uk";

  // dev.physioonclick.co.uk is a testing environment (see wrangler.jsonc's
  // env.dev + scripts/deploy-dev.sh) that ended up indexed by Google. It is
  // de-indexed by the noindex meta tag (app/layout.tsx) and X-Robots-Tag
  // header (next.config.mjs). Crawling stays allowed on purpose: a robots.txt
  // block stops Google from ever seeing the noindex, so already-indexed dev
  // URLs would linger. No sitemap.
  if (base.includes("dev.physioonclick.co.uk")) {
    return { rules: { userAgent: "*", allow: "/" } };
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
        // The generated SVG image routes (/blog-images, /exercise-og, ...) are
        // deliberately NOT disallowed: they carry an X-Robots-Tag: noindex
        // header (next.config.mjs), and Google has to be able to crawl them
        // to see it and drop the ones it had already indexed.
      ],
    },
    sitemap: `${base}/sitemap.xml`
  };
}
