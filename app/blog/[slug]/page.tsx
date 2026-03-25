import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { BlogDetailActions } from "@/components/blog-detail-actions";
import { blogArticles, getArticle } from "@/lib/blog";
import { fetchDynamicBlogBySlug } from "@/lib/firestore-content";
import { medicalImagePlaceholder } from "@/lib/image-placeholders";

export async function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    return {};
  }

  return {
    title: article.seoTitle,
    description: article.seoDescription
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
      <section className="page-hero article-hero">
        <div className="stack">
          <span className="eyebrow">{article.category}</span>
          <h1>{article.title}</h1>
          <p className="lead">{article.excerpt}</p>
          <BlogDetailActions article={article} />
        </div>
        <div className="article-hero-aside">
          <strong>Evidence-based patient education</strong>
          <p className="muted">
            Clear, UK-focused physiotherapy guidance designed to support informed decisions and safer self-management.
          </p>
        </div>
      </section>

      <section className="page-section article-content article-content-premium">
        <Image
          src={article.image}
          alt={article.title}
          width={1200}
          height={680}
          unoptimized
          placeholder="blur"
          blurDataURL={medicalImagePlaceholder}
        />
        {article.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p className="lead" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </section>
    </article>
  );
}
