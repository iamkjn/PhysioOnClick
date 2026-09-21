import { NextResponse } from "next/server";
import { exercises } from "@/lib/exercises";
import { selfTests } from "@/lib/self-tests";
import { downloadObject } from "@/lib/firebase-admin";
import { EXERCISE_IMAGE_PLACEHOLDER_SVG } from "@/lib/exercise-images";

// Not immutable: a clinically-rejected image must clear within a day, not sit
// in caches for a year.
const CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

const SELF_TEST_STEP_IMAGE_IDS = new Set(
  selfTests.flatMap((t) => t.steps.map((s) => s.imageId)),
);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let storagePrefix: "exercise-images" | "self-test-images";
  if (exercises.some((e) => e.id === id)) {
    storagePrefix = "exercise-images";
  } else if (SELF_TEST_STEP_IMAGE_IDS.has(id)) {
    storagePrefix = "self-test-images";
  } else {
    return new NextResponse("Not found", { status: 404 });
  }

  const size = new URL(req.url).searchParams.get("size") === "thumb" ? "320" : "960";
  const webp = await downloadObject(`${storagePrefix}/${id}-${size}.webp`).catch(() => null);
  if (webp) {
    return new NextResponse(webp as BodyInit, {
      headers: { "Content-Type": "image/webp", "Cache-Control": CACHE_CONTROL },
    });
  }

  const png = await downloadObject(`${storagePrefix}/${id}.png`).catch(() => null);
  if (png) {
    return new NextResponse(png as BodyInit, {
      headers: { "Content-Type": "image/png", "Cache-Control": CACHE_CONTROL },
    });
  }

  return new NextResponse(EXERCISE_IMAGE_PLACEHOLDER_SVG, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=300" },
  });
}
