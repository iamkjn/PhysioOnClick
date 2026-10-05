"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { BlogArticle } from "@/lib/blog";
import {
  getSavedBlogs,
  onSavedBlogsChange,
  removeSavedBlog,
} from "@/lib/saved-content-store";

export function SavedBlogList({ articles }: { articles: BlogArticle[] }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(getSavedBlogs());
    return onSavedBlogsChange((next) => setSlugs(next));
  }, []);

  const articleBySlug = useMemo(
    () => new Map(articles.map((article) => [article.slug, article])),
    [articles],
  );
  const saved = slugs
    .map((slug) => articleBySlug.get(slug))
    .filter((article): article is BlogArticle => Boolean(article));

  if (saved.length === 0) {
    return (
      <div className="blog-saved blog-saved--empty">
        <div className="blog-saved__empty-mark" aria-hidden="true">★</div>
        <div>
          <span className="eyebrow">Saved articles</span>
          <h2>Your reading queue starts here</h2>
          <p>
            Save advice you want to revisit. Blog saves stay here in the Blog
            tab, separate from exercises that may need a treatment plan.
          </p>
        </div>
        <Link className="button secondary small" href="#articles">
          Explore articles
        </Link>
      </div>
    );
  }

  return (
    <section className="blog-saved" aria-labelledby="saved-blog-heading">
      <div className="blog-saved__head">
        <div>
          <span className="eyebrow">Saved articles</span>
          <h2 id="saved-blog-heading">Continue where you left off</h2>
          <p>
            Helpful reads you saved from the blog. Keep learning here, and save
            exercises separately when you want something reviewed clinically.
          </p>
        </div>
        <strong>{saved.length}</strong>
      </div>
      <ul className="blog-saved__list">
        {saved.map((article, index) => (
          <li key={article.slug} className="blog-saved__item">
            <span className="blog-saved__number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <span className="blog-saved__category">{article.category}</span>
              <Link href={`/blog/${article.slug}`}>{article.title}</Link>
              <p>{article.readTime} · Last reviewed {new Date(article.lastReviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <button type="button" onClick={() => removeSavedBlog(article.slug)}>
              Remove
              <span className="sr-only"> {article.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
