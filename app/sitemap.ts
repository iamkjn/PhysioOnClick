import type { MetadataRoute } from "next";

import { blogArticles } from "@/lib/blog";

const routes = [
  "",
  "/about",
  "/services",
  "/pricing",
  "/blog",
  "/symptom-checker",
  "/patient",
  "/admin",
  "/glasgow-physiotherapist",
  "/privacy-policy",
  "/medical-disclaimer",
  "/cancellation-policy",
  "/contact"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return [
    ...routes.map((route) => ({
      url: `${base}${route}`,
      lastModified: new Date()
    })),
    ...blogArticles.map((article) => ({
      url: `${base}/blog/${article.slug}`,
      lastModified: new Date(article.publishedAt)
    }))
  ];
}
