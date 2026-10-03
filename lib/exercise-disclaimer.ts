// Single source of truth for the exercise-library "use at your own risk"
// wording. Rendered by ExerciseSafetyNote (every exercise page, condition hub,
// body-area page and the library index), by ExerciseUseDisclaimer (self-check
// test pages) and mirrored in the terms ("Use of exercise and health
// information"). ASCII only. Deliberately guidance + own-risk, not an
// exclusion of liability: nothing here limits liability that cannot be
// limited by law (see the terms).

export const EXERCISE_DISCLAIMER_SENTENCES = [
  "This is general information only.",
  "Please do not start these exercises without guidance from a physiotherapist who has assessed you.",
  "Stop if pain is sharp or does not settle, and seek advice.",
  "Using them without an assessment is at your own risk.",
] as const;

export const EXERCISE_DISCLAIMER = EXERCISE_DISCLAIMER_SENTENCES.join(" ");
