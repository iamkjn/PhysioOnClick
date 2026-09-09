// lib/age.ts
// Shared age helpers. DOB is stored as an ISO date string ("YYYY-MM-DD") on
// `patients`/`users` docs and on `dependents`. The default backfilled value for
// pre-existing accounts is DEFAULT_DOB — treat an age derived from it as
// "unknown" in the UI where that distinction matters.

export const DEFAULT_DOB = "2000-01-01";

export function calcAge(dob: string | undefined | null, now: Date = new Date()): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age <= 130 ? age : null;
}

// "42 yrs" / "" when unknown. Kept terse for table rows and header chips.
export function formatAge(dob: string | undefined | null): string {
  const age = calcAge(dob);
  return age === null ? "" : `${age} yr${age === 1 ? "" : "s"}`;
}
