"use client";
import type { CSSProperties } from "react";
import { useState } from "react";
import { ExerciseFigure } from "@/components/exercise-figure";
import { exerciseImageUrl, type ExerciseImageVariant } from "@/lib/exercise-images";
import { hasUploadedImage } from "@/lib/exercise-image-prompts";

export function ExerciseImage({
  exerciseId,
  name,
  pose,
  size = 52,
  className,
  imageFit = "contain",
  variant,
  decorative = true,
}: {
  exerciseId: string;
  name: string;
  pose?: string | null;
  size?: number;
  className?: string;
  imageFit?: "contain" | "cover";
  variant?: ExerciseImageVariant;
  decorative?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const classes = ["exercise-figure-tile", className].filter(Boolean).join(" ");
  const style = {
    width: size,
    height: size,
    "--exercise-image-fit": imageFit,
  } as CSSProperties;
  // The image route serves a placeholder SVG with HTTP 200 on a miss, so
  // <img onError> never fires. Only reach for an <img> when the real
  // illustration has actually been generated and uploaded for this exercise
  // (an authored prompt alone is not enough).
  if (failed || !hasUploadedImage(exerciseId)) {
    return <ExerciseFigure name={name} pose={pose} size={size} className={className} />;
  }
  // Small tiles (list/card views) fetch the 320px thumbnail; anything larger
  // (the exercise detail hero) fetches the 960px enlarged version.
  const resolvedVariant = variant ?? (size <= 140 ? "thumb" : "full");
  return (
    <span className={classes} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element -- needs onError fall-through to <ExerciseFigure>; images.unoptimized is on repo-wide */}
      <img
        src={exerciseImageUrl(exerciseId, resolvedVariant)}
        alt={decorative ? "" : `${name} exercise demonstration`}
        width={size}
        height={size}
        loading={resolvedVariant === "thumb" ? "lazy" : "eager"}
        style={{ width: "100%", height: "100%", objectFit: imageFit }}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
