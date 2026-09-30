import type { MouseEvent } from "react";

// Deterrents for casual copying of our exercise illustrations. None of this can
// stop a determined screenshot; the watermark makes sure a screenshot still
// credits us. The image files themselves are never modified.

/** Below this rendered size (px) an image is a thumbnail and skips the watermark. */
export const WATERMARK_MIN_SIZE = 200;

/** Suppresses the browser's "Save image as..." context menu. */
export function preventImageSave(event: MouseEvent) {
  event.preventDefault();
}

export function ImageWatermark() {
  return (
    <span className="image-watermark" aria-hidden="true">
      © physioonclick.co.uk
    </span>
  );
}
