import type { Metadata } from "next";

import { BlogDirectory } from "@/components/blog-directory";
import { blogCategories } from "@/lib/blog";
import { fetchDynamicBlogs } from "@/lib/firestore-content";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Physiotherapy Blog | PhysioOnClick",
  description: "100+ UK-focused physiotherapy articles on back pain, knee injuries, shoulder rehab and more."
};

export const dynamic = "force-static";

export default async function BlogPage() {
  const articles = await fetchDynamicBlogs();

  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <h1>
          Physiotherapy <span>Blog</span>
        </h1>
        <p>Expert advice, exercise guides and evidence-based articles on physiotherapy and rehabilitation.</p>
      </section>

      <Reveal direction="up">
        <BlogDirectory articles={articles} categories={blogCategories} />
      </Reveal>
    </div>
  );
}
