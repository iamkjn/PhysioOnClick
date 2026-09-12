export type ExerciseImageVariant = "thumb" | "full";

/**
 * Bump this whenever the uploaded artwork changes (a re-run of
 * scripts/upload-exercise-images.ts). The route's Cache-Control is 24h, so
 * without a version in the URL a browser/CDN that fetched the old bytes
 * would keep serving them for up to a day after a re-upload.
 */
const IMAGE_LIBRARY_VERSION = 2;

/**
 * `thumb` (320px webp) for list/card tiles, `full` (960px webp, falling back
 * to the 960px PNG) for the enlarged exercise detail view. Both are served by
 * the same route so a miss can fall through to the placeholder SVG.
 */
export function exerciseImageUrl(id: string, variant: ExerciseImageVariant = "full"): string {
  return `/exercise-images/${encodeURIComponent(id)}?size=${variant}&v=${IMAGE_LIBRARY_VERSION}`;
}

// A neutral "exercise" glyph so an <img> never shows a broken icon before the
// real illustration exists. The web card additionally swaps to <ExerciseFigure>.
export const EXERCISE_IMAGE_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="#EAF6FB"/><g fill="none" stroke="#0EA5E9" stroke-width="3" stroke-linecap="round"><circle cx="32" cy="20" r="6"/><path d="M32 27v16M24 34h16M27 51l5-8 5 8"/></g></svg>`;
