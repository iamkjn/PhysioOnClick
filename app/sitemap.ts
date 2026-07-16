import type { MetadataRoute } from "next";

import { fetchDynamicBlogs } from "@/lib/firestore-content";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const blogArticles = await fetchDynamicBlogs();

  const staticEntries = routes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() }));
  const blogEntries = blogArticles.map((a) => ({ url: `${base}/blog/${a.slug}`, lastModified: new Date(a.publishedAt) }));

  return [...staticEntries, ...blogEntries];
}
