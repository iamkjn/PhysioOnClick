// lib/exercise-anatomy/drafts.ts
// Draft anatomy content shows only where NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS=1
// (.env.development, so the dev site). Next inlines the value at build time;
// prod builds never set it, so prod shows approved content only.

export function draftsVisible(): boolean {
  return process.env.NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS === "1";
}
