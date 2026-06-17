import type { MetadataRoute } from "next";

const routes = [
  "",
  "/about",
  "/services",
  "/pricing",
  "/book",
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

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date()
  }));
}
