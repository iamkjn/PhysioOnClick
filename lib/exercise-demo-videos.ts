// Our own filmed demo videos for public exercise pages, keyed by catalogue slug.
//
// Only add PhysioOnClick's own footage (Shivaliba demonstrating), uploaded to
// the PhysioOnClick YouTube channel. Never a third-party video: the page and
// its VideoObject claim it as ours. Filming brief for the first batch:
// docs/seo/exercise-video-brief.md.
//
// Google needs name, thumbnail and upload date for a video result; duration
// is strongly recommended. To add one: upload, copy the 11-character id from
// the YouTube URL, fill in the entry below.
export type ExerciseDemoVideo = {
  /** YouTube video id, e.g. "dQw4w9WgXcQ" from youtube.com/watch?v=dQw4w9WgXcQ */
  youtubeId: string;
  /** Date the video was published on YouTube, YYYY-MM-DD. */
  uploadDate: string;
  /** Length in whole seconds. */
  durationSeconds: number;
};

export const EXERCISE_DEMO_VIDEOS: Record<string, ExerciseDemoVideo> = {
  // "spanish-squat": { youtubeId: "xxxxxxxxxxx", uploadDate: "2026-10-20", durationSeconds: 45 },
};

export function demoVideoForSlug(slug: string): ExerciseDemoVideo | null {
  return EXERCISE_DEMO_VIDEOS[slug] ?? null;
}

/** ISO 8601 duration, e.g. 75 -> "PT1M15S". */
export function isoDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `PT${m ? `${m}M` : ""}${s || !m ? `${s}S` : ""}`;
}
