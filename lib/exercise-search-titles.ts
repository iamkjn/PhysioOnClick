// Search-result titles for the exercise pages that carry real impressions.
// Each name is the phrasing people actually type, taken from Search Console
// queries for that page (90 days to 2026-10-07): e.g. "spanish squat hold",
// "ankle pumps after surgery", "banded terminal knee extension". The catalogue
// title (H1, cards) is untouched; only <title> and the schema name use these.
// Re-pull GSC queries before adding to or changing this list.
export const EXERCISE_SEARCH_TITLES: Record<string, string> = {
  "spanish-squat": "Spanish Squat Hold (Isometric)",
  "quad-sets": "Quad Sets Exercise",
  "wall-squat-hold": "Wall Squat Hold",
  "wall-slide": "Wall Slides Exercise",
  "isometric-neck-hold": "Isometric Neck Holds",
  "elbow-flexion-extension": "Elbow Flexion and Extension Exercise",
  "ankle-pumps-post-surgery": "Ankle Pumps After Surgery",
  "hip-hitch": "Hip Hitch / Pelvic Drop Exercise",
  "chin-tuck": "Chin Tuck Exercise",
  "mckenzie-press-up": "McKenzie Press-Up (Push-Up)",
  "box-step-down": "Box Step-Down Exercise",
  "resisted-wrist-flexion": "Resisted Wrist Flexion Exercise",
  "tyler-twist-flexbar": "Tyler Twist (Tennis Elbow Twist Bar)",
  "single-leg-balance": "Single Leg Balance Exercise",
  "median-nerve-glide": "Median Nerve Glides",
  "nordic-hamstring-curl-assisted": "Assisted Nordic Hamstring Curl",
  "prone-neck-extension": "Prone Neck Extension (Neck Lifts)",
  "seated-calf-raise": "Seated Calf Raise (Soleus Raise)",
  "terminal-knee-extension-band": "Banded Terminal Knee Extension",
  "scapular-retraction-band-row": "Banded Scapular Retraction",
};

/** The name to lead the search title with: the searched phrasing when we
 *  have it, else the catalogue title (+ "Exercise" for short bare names). */
export function exerciseSearchName(slug: string, title: string): string {
  const searched = EXERCISE_SEARCH_TITLES[slug];
  if (searched) return searched;
  return title.length <= 18 && !/exercise$/i.test(title) ? `${title} Exercise` : title;
}

/** Full <title>. Long names drop "Properly" so the brand isn't truncated. */
export function exerciseSearchTitle(slug: string, title: string): string {
  const name = exerciseSearchName(slug, title);
  const full = `${name}: How to Do It Properly | PhysioOnClick`;
  return full.length <= 70 ? full : `${name}: How to Do It | PhysioOnClick`;
}
