"use client";

import { useState } from "react";

import { exerciseImageUrl } from "@/lib/exercise-images";
import { hasUploadedSelfTestImage } from "@/lib/self-test-image-prompts";

/**
 * The photo for one self-check test step.
 *
 * No self-test photos have been generated and uploaded yet
 * (`hasUploadedSelfTestImage` is always false for now), so the labelled
 * placeholder is what actually ships. It is styled to read as an intentional
 * "illustration coming soon" tile - a numbered card carrying the step label -
 * rather than a broken image. Once a photo lands at `/exercise-images/<id>`
 * (the same route + convention as the exercise illustrations) the `<img>`
 * renders, falling back to the placeholder if it fails to load.
 */
export function SelfTestImage({
  imageId,
  label,
  stepNumber,
}: {
  imageId: string;
  label: string;
  stepNumber: number;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !hasUploadedSelfTestImage(imageId)) {
    return (
      <div
        className="exlib-selftest-photo exlib-selftest-photo--placeholder"
        role="img"
        aria-label={`Step ${stepNumber}: ${label} (illustration coming soon)`}
      >
        <span className="exlib-selftest-photo__step" aria-hidden="true">
          Step {stepNumber}
        </span>
        <span className="exlib-selftest-photo__label" aria-hidden="true">
          {label}
        </span>
        <span className="exlib-selftest-photo__note" aria-hidden="true">
          Illustration coming soon
        </span>
      </div>
    );
  }

  return (
    <div className="exlib-selftest-photo">
      {/* eslint-disable-next-line @next/next/no-img-element -- needs onError fall-through to the placeholder; images.unoptimized is on repo-wide */}
      <img
        src={exerciseImageUrl(imageId)}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
