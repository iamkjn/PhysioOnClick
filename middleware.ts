import { NextResponse, type NextRequest } from "next/server";

import { removedBlogSlugs } from "@/lib/removed-blog-slugs";

// Retired blog URLs need a real error status. The page's notFound() can't give
// one: app/loading.tsx wraps every route in a Suspense boundary, so the 200
// status is already streamed before the page decides the slug is unknown.
// Search Console then logs them as "Excluded by noindex" indefinitely.
export function middleware(request: NextRequest) {
  const slug = request.nextUrl.pathname.slice("/blog/".length).replace(/\/$/, "");

  if (!removedBlogSlugs.has(slug)) {
    return NextResponse.next();
  }

  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Article removed | PhysioOnClick</title></head><body style="font-family:system-ui,sans-serif;max-width:36rem;margin:4rem auto;padding:0 1rem;color:#14213d"><h1>This article has been removed</h1><p>We've replaced our older articles with a new set of guides.</p><p><a href="/blog">Browse the current articles</a> or <a href="/">return to the homepage</a>.</p></body></html>`,
    { status: 410, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export const config = {
  matcher: "/blog/:slug",
};
