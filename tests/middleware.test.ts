import { NextRequest } from "next/server";

import { middleware } from "@/middleware";
import { blogArticles } from "@/lib/blog";
import { removedBlogSlugs } from "@/lib/removed-blog-slugs";

const req = (path: string) => new NextRequest(`https://physioonclick.co.uk${path}`);

describe("middleware: retired blog slugs", () => {
  it("answers a retired slug with 410 Gone", () => {
    const res = middleware(req("/blog/managing-knee-injuries-what-to-know-about-exercise-pacing-65"));
    expect(res.status).toBe(410);
  });

  it("also matches with a trailing slash", () => {
    const res = middleware(req("/blog/managing-knee-injuries-what-to-know-about-exercise-pacing-65/"));
    expect(res.status).toBe(410);
  });

  it("passes live articles through", () => {
    const res = middleware(req(`/blog/${blogArticles[0].slug}`));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("never retires a slug that is live today", () => {
    for (const article of blogArticles) {
      expect(removedBlogSlugs.has(article.slug)).toBe(false);
    }
  });
});
