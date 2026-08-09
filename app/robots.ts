import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://physioonclick.co.uk";

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/patient", "/api", "/auth"] },
    sitemap: `${base}/sitemap.xml`
  };
}
