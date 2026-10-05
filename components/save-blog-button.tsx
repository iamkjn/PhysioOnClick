"use client";

import { useEffect, useState } from "react";

import {
  addSavedBlog,
  getSavedBlogs,
  onSavedBlogsChange,
  removeSavedBlog,
} from "@/lib/saved-content-store";
import { trackGrowthEvent } from "@/lib/growth-tracking";

export function SaveBlogButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getSavedBlogs().includes(slug));
    return onSavedBlogsChange((slugs) => setSaved(slugs.includes(slug)));
  }, [slug]);

  function toggle() {
    if (saved) {
      setSaved(removeSavedBlog(slug).includes(slug));
      return;
    }

    const next = addSavedBlog(slug);
    setSaved(next.includes(slug));
    trackGrowthEvent("blog_saved", {
      source: "blog_detail",
      blog_slug: slug,
      blog_title: title,
      saved_count: next.length,
    });
  }

  return (
    <button
      type="button"
      className="save-content-button"
      data-saved={saved ? "true" : "false"}
      aria-pressed={saved}
      onClick={toggle}
    >
      <span aria-hidden="true">{saved ? "✓" : "+"}</span>
      {saved ? "Saved article" : "Save article"}
      <span className="sr-only">: {title}</span>
    </button>
  );
}
