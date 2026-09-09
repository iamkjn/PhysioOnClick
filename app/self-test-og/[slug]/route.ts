import { NextResponse } from "next/server";

import { allSelfTestSlugs, getSelfTest } from "@/lib/exercise-library";
import { generateSelfTestOgSvg } from "@/lib/exercise-library-svg";

// Cards are built from the static records at build time; without this the route
// stays dynamic and re-runs the lookup inside the Worker on every hit.
export const dynamic = "force-static";

export function generateStaticParams() {
  return allSelfTestSlugs().map((slug) => ({ slug }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const test = getSelfTest(slug);

  if (!test) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(generateSelfTestOgSvg(test), {
    headers: {
      "Content-Type": "image/svg+xml",
      // Not immutable: the test copy gets re-reviewed, so a stale card must
      // clear within a day rather than sit in caches for a year.
      "Cache-Control": "public, max-age=86400",
    },
  });
}
