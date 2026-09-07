import { NextResponse } from "next/server";
import { exercises } from "@/lib/exercises";
import { downloadObject } from "@/lib/firebase-admin";
import { EXERCISE_IMAGE_PLACEHOLDER_SVG } from "@/lib/exercise-images";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!exercises.some((e) => e.id === id)) return new NextResponse("Not found", { status: 404 });

  const bytes = await downloadObject(`exercise-images/${id}.png`).catch(() => null);
  if (bytes) {
    return new NextResponse(bytes as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        // Not immutable: a clinically-rejected image must clear within a day,
        // not sit in caches for a year.
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }
  return new NextResponse(EXERCISE_IMAGE_PLACEHOLDER_SVG, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=300" },
  });
}
