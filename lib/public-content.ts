import { blogArticles, type BlogArticle } from "@/lib/blog";
import { pricing, services, testimonials, type PricingItem, type Service, type Testimonial } from "@/lib/site-data";

export type SearchItem = {
  href: string;
  title: string;
  description: string;
  type: "Service" | "Blog" | "Pricing";
};

export function getPublicServices(): Service[] {
  return services;
}

export function getPublicPricing(): PricingItem[] {
  return pricing;
}

export function getPublicTestimonials(): Testimonial[] {
  return testimonials;
}

export function getPublicBlogs(): BlogArticle[] {
  return blogArticles;
}

export function getPublicBlogBySlug(slug: string) {
  return blogArticles.find((article) => article.slug === slug);
}

export function getPublicSearchIndex(): SearchItem[] {
  return [
    ...services.map((service) => ({
      href: `/services#${service.slug}`,
      title: service.title,
      description: service.summary,
      type: "Service" as const
    })),
    ...pricing.map((item) => ({
      href: "/pricing",
      title: item.title,
      description: `${item.duration} • £${item.price} • ${item.description}`,
      type: "Pricing" as const
    })),
    ...blogArticles.slice(0, 60).map((article) => ({
      href: `/blog/${article.slug}`,
      title: article.title,
      description: article.excerpt,
      type: "Blog" as const
    }))
  ];
}
