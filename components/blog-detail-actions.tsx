"use client";

import Link from "next/link";

import type { BlogArticle } from "@/lib/blog";
import { BlogFavoriteButton } from "@/components/blog-favorite-button";

export function BlogDetailActions({ article }: { article: BlogArticle }) {
  return (
    <div className="button-row blog-detail-actions">
      <span className="article-meta-pill">{article.readTime}</span>
      <BlogFavoriteButton article={article} />
      <Link className="button secondary small" href="/blog">
        Back to blog
      </Link>
    </div>
  );
}
