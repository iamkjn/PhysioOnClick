import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";

import type { BlogArticle } from "@/lib/blog";
import { blogArticles } from "@/lib/blog";
import type { PricingItem, Service, Testimonial } from "@/lib/site-data";
import { pricing, services, testimonials } from "@/lib/site-data";
import { db } from "@/lib/firebase";

const useLivePublicContent = process.env.NEXT_PUBLIC_USE_LIVE_CONTENT === "true";

function toBlogArticle(doc: Record<string, unknown>, fallback?: BlogArticle): BlogArticle {
  return {
    slug: String(doc.slug || fallback?.slug || ""),
    title: String(doc.title || fallback?.title || "Untitled article"),
    category: String(doc.category || fallback?.category || "General") as BlogArticle["category"],
    excerpt: String(doc.excerpt || fallback?.excerpt || ""),
    readTime: String(doc.readTime || fallback?.readTime || "6 min read"),
    seoTitle: String(doc.seoTitle || fallback?.seoTitle || String(doc.title || "PhysioOnClick")),
    seoDescription: String(doc.seoDescription || fallback?.seoDescription || ""),
    publishedAt: String(doc.publishedAt || fallback?.publishedAt || new Date().toISOString()),
    image: String(doc.image || fallback?.image || ""),
    sections: Array.isArray(doc.sections) && doc.sections.length
      ? (doc.sections as BlogArticle["sections"])
      : fallback?.sections || []
  };
}

function toService(doc: Record<string, unknown>, fallback?: Service): Service {
  const faqs = Array.isArray(doc.faqs) ? doc.faqs : fallback?.faqs || [];

  return {
    slug: String(doc.slug || fallback?.slug || ""),
    title: String(doc.title || fallback?.title || "Untitled service"),
    image: String(doc.image || fallback?.image || ""),
    summary: String(doc.summary || fallback?.summary || ""),
    conditions: Array.isArray(doc.conditions) ? doc.conditions.map(String) : fallback?.conditions || [],
    approach: Array.isArray(doc.approach) ? doc.approach.map(String) : fallback?.approach || [],
    faqs: faqs.map((item) => ({
      question: String((item as { question?: unknown }).question || ""),
      answer: String((item as { answer?: unknown }).answer || "")
    })),
    seoTitle: String(doc.seoTitle || fallback?.seoTitle || String(doc.title || "PhysioOnClick")),
    seoDescription: String(doc.seoDescription || fallback?.seoDescription || "")
  };
}

function toPricingItem(doc: Record<string, unknown>, fallback?: PricingItem): PricingItem {
  const mode = String(doc.mode || fallback?.mode || "In-person") as PricingItem["mode"];

  return {
    title: String(doc.title || fallback?.title || "Untitled pricing"),
    duration: String(doc.duration || fallback?.duration || ""),
    price: Number(doc.price || fallback?.price || 0),
    description: String(doc.description || fallback?.description || ""),
    mode: ["In-person", "Online", "Package"].includes(mode) ? mode : "In-person"
  };
}

function toTestimonial(doc: Record<string, unknown>, fallback?: Testimonial): Testimonial {
  return {
    name: String(doc.name || fallback?.name || "Anonymous"),
    location: String(doc.location || fallback?.location || ""),
    quote: String(doc.quote || fallback?.quote || ""),
    focus: String(doc.focus || fallback?.focus || "")
  };
}

export type SearchItem = {
  href: string;
  title: string;
  description: string;
  type: "Service" | "Blog" | "Pricing";
};

export async function fetchDynamicBlogs() {
  if (!db || !useLivePublicContent) {
    return blogArticles;
  }

  try {
    const ref = query(collection(db, "blogs"), orderBy("publishedAt", "desc"), limit(120));
    const snapshot = await getDocs(ref);

    if (snapshot.empty) {
      return blogArticles;
    }

    return snapshot.docs.map((doc, index) => toBlogArticle(doc.data(), blogArticles[index]));
  } catch {
    return blogArticles;
  }
}

export async function fetchDynamicBlogBySlug(slug: string) {
  if (!db || !useLivePublicContent) {
    return blogArticles.find((article) => article.slug === slug);
  }

  try {
    const ref = query(collection(db, "blogs"), where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(ref);

    if (!snapshot.empty) {
      return toBlogArticle(snapshot.docs[0].data(), blogArticles.find((article) => article.slug === slug));
    }
  } catch {
    return blogArticles.find((article) => article.slug === slug);
  }

  return blogArticles.find((article) => article.slug === slug);
}

export async function fetchDynamicServices() {
  if (!db || !useLivePublicContent) {
    return services;
  }

  try {
    const ref = query(collection(db, "services"), orderBy("order", "asc"), limit(20));
    const snapshot = await getDocs(ref);

    if (snapshot.empty) {
      return services;
    }

    return snapshot.docs.map((doc, index) => toService(doc.data(), services[index]));
  } catch {
    return services;
  }
}

export async function fetchDynamicPricing() {
  if (!db || !useLivePublicContent) {
    return pricing;
  }

  try {
    const ref = query(collection(db, "pricing"), orderBy("order", "asc"), limit(20));
    const snapshot = await getDocs(ref);

    if (snapshot.empty) {
      return pricing;
    }

    return snapshot.docs.map((doc, index) => toPricingItem(doc.data(), pricing[index]));
  } catch {
    return pricing;
  }
}

export async function fetchDynamicTestimonials() {
  if (!db || !useLivePublicContent) {
    return testimonials;
  }

  try {
    const ref = query(collection(db, "testimonials"), orderBy("order", "asc"), limit(20));
    const snapshot = await getDocs(ref);

    if (snapshot.empty) {
      return testimonials;
    }

    return snapshot.docs.map((doc, index) => toTestimonial(doc.data(), testimonials[index]));
  } catch {
    return testimonials;
  }
}

export async function fetchSearchIndex(): Promise<SearchItem[]> {
  const [serviceItems, pricingItems, blogItems] = await Promise.all([
    fetchDynamicServices(),
    fetchDynamicPricing(),
    fetchDynamicBlogs()
  ]);

  return [
    ...serviceItems.map((service) => ({
      href: "/services",
      title: service.title,
      description: service.summary,
      type: "Service" as const
    })),
    ...pricingItems.map((item) => ({
      href: "/pricing",
      title: item.title,
      description: `${item.duration} • £${item.price} • ${item.description}`,
      type: "Pricing" as const
    })),
    ...blogItems.slice(0, 60).map((article) => ({
      href: `/blog/${article.slug}`,
      title: article.title,
      description: article.excerpt,
      type: "Blog" as const
    }))
  ];
}
