import { NextResponse } from "next/server";

import { blogArticles } from "@/lib/blog";
import { generateBlogCoverSvg } from "@/lib/blog-image-svg";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = blogArticles.find((entry) => entry.slug === slug);

  if (!article) {
    return new NextResponse("Not found", { status: 404 });
  }

  const svg = generateBlogCoverSvg(article);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
