import { NextResponse } from "next/server";

import { allExerciseSlugs, getExerciseBySlug } from "@/lib/exercise-library";
import { EMBEDS_ENABLED, renderEmbedDisabledHtml, renderEmbedHtml } from "@/lib/exercise-embed";

// A route handler (not a page) so the embed escapes the root layout: no site
// header, chat, cookie banner or analytics inside other people's websites.
// Framing is allowed for /embed/* only - see next.config.mjs. Deliberately no
// `dynamicParams = false` - on OpenNext that 404s every path on deploy.
export const dynamic = "force-static";

export function generateStaticParams() {
  return allExerciseSlugs().map((slug) => ({ slug }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exercise = getExerciseBySlug(slug);

  if (!exercise) {
    return new NextResponse("Not found", { status: 404 });
  }

  const html = EMBEDS_ENABLED ? renderEmbedHtml(exercise) : renderEmbedDisabledHtml(exercise);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
