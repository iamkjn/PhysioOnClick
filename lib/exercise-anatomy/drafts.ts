// lib/exercise-anatomy/drafts.ts
// Draft clinical content shows only where NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS=1
// (.env.development, so the dev site). Next inlines the value at build time;
// prod builds never set it, so prod shows approved content only. The flag
// predates its wider use: it gates draft anatomy copy, draft exercises
// (`Exercise.draft`) and draft library areas (`BodyArea.draft`) alike.

export function draftsVisible(): boolean {
  return process.env.NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS === "1";
}
