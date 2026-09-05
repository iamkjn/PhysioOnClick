import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import Link from "next/link";

import { BlogDetailActions } from "@/components/blog-detail-actions";
import { blogArticles, serviceSlugForCategory } from "@/lib/blog";
import { services } from "@/lib/site-data";
import { fetchDynamicBlogBySlug } from "@/lib/firestore-content";
import { medicalImagePlaceholder } from "@/lib/image-placeholders";
import { Reveal } from "@/components/reveal";
import { breadcrumbs, personRef, practiceRef } from "@/lib/structured-data";

// Article bodies come from generateStaticParams at build time. Without this the
// route stays dynamic and every request re-runs the content lookup inside the
// Worker, which is what took the whole /blog segment down (500s and hangs).
export const dynamic = "force-static";

// generateMetadata and the page component both need the article. Sharing one
// cached call per render means one lookup per request, not two.
const getArticle = cache(async (slug: string) => fetchDynamicBlogBySlug(slug));

export async function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {};
  }

  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: { canonical: `/blog/${slug}` },
    // Rewritten 2026-08-25 into 36 genuinely distinct, individually authored
    // articles (see lib/blog.ts) — the noindex that guarded against the prior
    // templated/duplicate-content version has been lifted.
    openGraph: {
      type: "article",
      title: article.seoTitle,
      description: article.seoDescription,
      // article.image is an SVG cover route — Facebook/LinkedIn/X/WhatsApp/Slack
      // all refuse to render SVG previews, so a per-article SVG here means every
      // share comes out imageless. Fall back to the raster site OG image until a
      // per-article raster pipeline exists.
      images: ["/og-default.png"]
    },
    twitter: {
      card: "summary_large_image",
      images: ["/og-default.png"]
    }
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const relatedServiceSlug = serviceSlugForCategory(article.category);
  const relatedService = relatedServiceSlug
    ? services.find((s) => s.slug === relatedServiceSlug)
    : undefined;

  return (
    <article className="site-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: article.title,
            description: article.excerpt,
            image: article.image,
            datePublished: article.publishedAt,
            dateModified: article.lastReviewedAt,
            author: personRef(),
            reviewedBy: personRef(),
            publisher: practiceRef()
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              { name: article.title, path: `/blog/${slug}` }
            ])
          )
        }}
      />
      <section className="page-hero article-hero">
        <Reveal direction="up" className="stack article-hero-copy">
          <div className="article-hero-meta">
            <span className="eyebrow">{article.category}</span>
            <span aria-hidden="true">&middot;</span>
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </time>
          </div>
          <h1>{article.title}</h1>
          <p className="lead">{article.excerpt}</p>
          <p className="muted article-byline">
            Written and reviewed by {article.author}
            {article.authorCredential ? `, ${article.authorCredential}` : ""}
            {" · "}
            Last reviewed{" "}
            <time dateTime={article.lastReviewedAt}>
              {new Date(article.lastReviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </time>
          </p>
          <BlogDetailActions article={article} />
        </Reveal>
        <Reveal direction="up" delay={80} className="article-hero-aside">
          <strong>Evidence-based patient education</strong>
          <p className="muted">
            Clear, UK-focused physiotherapy guidance designed to support informed decisions and safer self-management.
          </p>
        </Reveal>
      </section>

      <section className="page-section article-content article-content-premium">
        <Reveal direction="up" className="article-feature-media">
          <Image
            src={article.image}
            alt={article.title}
            width={1200}
            height={680}
            unoptimized
            placeholder="blur"
            blurDataURL={medicalImagePlaceholder}
          />
        </Reveal>
        <div className="article-reading-column">
          {article.sections.map((section, i) => (
            <section className="article-section" key={`${i}-${section.heading}`}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph, j) => (
                <p key={j}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </section>

      {relatedService ? (
        <section className="page-section simple-section">
          <Reveal direction="up">
            <div className="site-shell sessions-include-card">
              <h3>Need help with this in person?</h3>
              <p>
                {relatedService.summary} Every session is delivered by {article.author}, the same
                HCPC-registered physiotherapist, online across the UK.
              </p>
              <Link className="button primary" href={`/services/${relatedService.slug}`} prefetch>
                Explore {relatedService.title}
              </Link>
            </div>
          </Reveal>
        </section>
      ) : null}
    </article>
  );
}
