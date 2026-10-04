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

// Self-check test pages: one combined note (guide not diagnosis, see a doctor if
// severe, and the same own-risk guidance as the shared sentences above).
export const SELF_TEST_DISCLAIMER = [
  "This is a guide, not a diagnosis.",
  "It cannot rule a problem in or out - a physiotherapist can.",
  "If your symptoms are severe, spreading, or you feel unwell, see a doctor.",
  "Please do not start exercises based on these tests without guidance from a physiotherapist who has assessed you; doing so is at your own risk.",
].join(" ");

export const EXERCISE_DISCLAIMER = EXERCISE_DISCLAIMER_SENTENCES.join(" ");

// Clinical sign-off round 2, Q2 (2026-10-04): every exercise in the library is
// labelled "For reference only" - a badge on every exercise card and list row,
// and the badge plus the one-line note on every exercise page, the library
// browser preview and the embed. Rendered by components/exercise-library/
// reference-only-label.tsx and lib/exercise-embed.ts. ASCII only.
export const REFERENCE_ONLY_LABEL = "For reference only";
export const REFERENCE_ONLY_FOLLOW_UP = "Follow the advice of a physiotherapist who has assessed you.";
export const REFERENCE_ONLY_NOTE = `${REFERENCE_ONLY_LABEL}. ${REFERENCE_ONLY_FOLLOW_UP}`;

// Page-level variant for the editorial guides (app/guides/[slug]) and the
// "online physiotherapy for" landing pages (app/online-physiotherapy-for/[slug]).
// Rendered once per page by those two route components. Clinical sign-off
// (Q17/Q18): general information only, no new programme without advice from
// someone who knows your condition, stop if pain does not settle.
export const PAGE_DISCLAIMER_SENTENCES = [
  "This information is general and not a substitute for an assessment.",
  "Don't start a new exercise programme without advice from a physiotherapist or doctor who knows your condition.",
  "If an exercise causes pain that doesn't settle, stop and seek advice.",
] as const;

export const PAGE_DISCLAIMER = PAGE_DISCLAIMER_SENTENCES.join(" ");
