import type { Metadata } from "next";

import { BlogDirectory } from "@/components/blog-directory";
import { blogCategories } from "@/lib/blog";
import { getPublicBlogs } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Physiotherapy Blog | PhysioOnClick",
  description: "100+ UK-focused physiotherapy articles on back pain, knee injuries, shoulder rehab and more."
};

export const dynamic = "force-static";

export default function BlogPage() {
  const articles = getPublicBlogs();

  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <h1>
          Physiotherapy <span>Blog</span>
        </h1>
        <p>Expert advice, exercise guides and evidence-based articles on physiotherapy and rehabilitation.</p>
      </section>

      <BlogDirectory articles={articles} categories={blogCategories} />
    </div>
  );
}
