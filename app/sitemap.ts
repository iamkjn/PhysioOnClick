import type { MetadataRoute } from "next";

import { blogArticles } from "@/lib/blog";

const routes = [
  "",
  "/about",
  "/services",
  "/pricing",
  "/book",
  "/blog",
  "/glasgow-physiotherapist",
  "/privacy-policy",
  "/medical-disclaimer",
  "/cancellation-policy",
  "/terms",
  "/contact"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticEntries = routes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() }));
  const blogEntries = blogArticles.map((a) => ({ url: `${base}/blog/${a.slug}`, lastModified: new Date(a.publishedAt) }));

  return [...staticEntries, ...blogEntries];
}
