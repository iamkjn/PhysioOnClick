"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { BlogArticle } from "@/lib/blog";
import { medicalImagePlaceholder } from "@/lib/image-placeholders";

type SortMode = "newest" | "oldest" | "a-z";

export function BlogDirectory({
  articles,
  categories
}: {
  articles: BlogArticle[];
  categories: string[];
}) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const visibleArticles = useMemo(() => {
    const filtered =
      activeCategory === "All" ? articles : articles.filter((article) => article.category.toLowerCase() === activeCategory.toLowerCase());

    const sorted = [...filtered];

    if (sortMode === "newest") {
      sorted.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    if (sortMode === "oldest") {
      sorted.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    }

    if (sortMode === "a-z") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sorted;
  }, [activeCategory, articles, sortMode]);

  return (
    <>
      <section className="page-section">
        <div className="blog-toolbar">
          <div className="blog-toolbar-grid">
            <div className="blog-toolbar-block">
              <span className="blog-toolbar-label">Filter by topic</span>
              <div className="blog-filter-row">
                <button
                  className={`blog-chip ${activeCategory === "All" ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveCategory("All")}
                >
                  All articles
                </button>
                {categories.map((category) => (
                  <button
                    className={`blog-chip ${activeCategory === category ? "active" : ""}`}
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="blog-toolbar-block blog-toolbar-block-right">
              <span className="blog-toolbar-label">Sort and view</span>
              <div className="blog-sort-controls">
                <label className="blog-sort-label">
                  <span className="sr-only">Sort blog articles</span>
                  <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="a-z">A to Z</option>
                  </select>
                </label>
              </div>
              <span className="blog-result-count">{visibleArticles.length} articles</span>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section article-grid simple-blog-grid">
        {visibleArticles.map((article) => (
          <article className="simple-blog-card" key={article.slug}>
            <div className="simple-blog-card-top">
              <span className="simple-category-pill">{article.category}</span>
            </div>
            <Image
              src={article.image}
              alt={article.title}
              width={720}
              height={420}
              unoptimized
              placeholder="blur"
              blurDataURL={medicalImagePlaceholder}
            />
            <h2>{article.title}</h2>
            <p>{article.excerpt}</p>
            <span className="muted">
              {new Date(article.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <Link className="blog-card-link" href={`/blog/${article.slug}`}>
              Read article
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}
