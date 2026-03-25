import { NextResponse } from "next/server";

import { generateServiceCoverSvg } from "@/lib/service-image-svg";
import { services } from "@/lib/site-data";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((entry) => entry.slug === slug);

  if (!service) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(generateServiceCoverSvg(service), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
