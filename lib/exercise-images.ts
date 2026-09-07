export function exerciseImageUrl(id: string): string {
  return `/exercise-images/${encodeURIComponent(id)}`;
}

// A neutral "exercise" glyph so an <img> never shows a broken icon before the
// real illustration exists. The web card additionally swaps to <ExerciseFigure>.
export const EXERCISE_IMAGE_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="#EAF6FB"/><g fill="none" stroke="#0EA5E9" stroke-width="3" stroke-linecap="round"><circle cx="32" cy="20" r="6"/><path d="M32 27v16M24 34h16M27 51l5-8 5 8"/></g></svg>`;
