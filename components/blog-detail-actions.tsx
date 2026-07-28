"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { track } from "@/lib/analytics";
import type { BlogArticle } from "@/lib/blog";

export function BlogDetailActions({ article }: { article: BlogArticle }) {
  // Fire `blog_read_complete` once when the reader reaches ~90% of the page —
  // a truer "did they read it" signal than the `page_view` fired on open.
  const firedRef = useRef(false);
  useEffect(() => {
    firedRef.current = false;
    function onScroll() {
      if (firedRef.current) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total > 0 && scrolled / total >= 0.9) {
        firedRef.current = true;
        track("blog_read_complete", { slug: article.slug });
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [article.slug]);

  return (
    <div className="button-row blog-detail-actions">
      <span className="article-meta-pill">{article.readTime}</span>
      <Link className="button secondary small" href="/blog">
        Back to blog
      </Link>
    </div>
  );
}
