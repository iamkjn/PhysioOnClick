import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { BlogDetailActions } from "@/components/blog-detail-actions";
import { blogArticles } from "@/lib/blog";
import { fetchDynamicBlogBySlug } from "@/lib/firestore-content";
import { medicalImagePlaceholder } from "@/lib/image-placeholders";
import { Reveal } from "@/components/reveal";

export async function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchDynamicBlogBySlug(slug);

  if (!article) {
    return {};
  }

  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: article.seoTitle,
      description: article.seoDescription,
      images: [article.image]
    },
    twitter: {
      card: "summary_large_image",
      images: [article.image]
    }
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await fetchDynamicBlogBySlug(slug);

  if (!article) {
    notFound();
  }

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
            author: { "@type": "Organization", name: "PhysioOnClick" },
            publisher: { "@type": "Organization", name: "PhysioOnClick" }
          })
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
    </article>
  );
}
