// Client-only "my plan" list: exercise slugs the visitor has bookmarked from the
// public exercise library, persisted in localStorage.
//
// Storage discipline (same as the Artifact rules): a private window, disabled
// storage, or a corrupt value must never throw out of here. Every localStorage
// access is wrapped in try/catch and every read falls back to an empty plan.
// `typeof window === "undefined"` (SSR / test node env) is treated the same way.

const STORAGE_KEY = "pooc:exercise-plan";
const PLAN_CHANGE_EVENT = "pooc:plan-change";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

/** The current plan, or `[]` on any failure (SSR, blocked storage, bad JSON). */
export function getPlan(): string[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const slugs = parsed.filter(
      (value): value is string => typeof value === "string",
    );
    // De-dupe defensively — a hand-edited or legacy value may carry repeats.
    return Array.from(new Set(slugs));
  } catch {
    return [];
  }
}

function broadcast(slugs: string[]): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Storage blocked — callers still get the in-memory result.
  }
  try {
    window.dispatchEvent(
      new CustomEvent(PLAN_CHANGE_EVENT, { detail: slugs }),
    );
  } catch {
    // CustomEvent unsupported — vanishingly unlikely in a real browser.
  }
}

/** Add a slug (deduped), persist, broadcast, and return the new plan. */
export function addToPlan(slug: string): string[] {
  const next = getPlan();
  if (!next.includes(slug)) next.push(slug);
  broadcast(next);
  return next;
}

/** Remove a slug, persist, broadcast, and return the new plan. */
export function removeFromPlan(slug: string): string[] {
  const next = getPlan().filter((s) => s !== slug);
  broadcast(next);
  return next;
}

/**
 * Subscribe to plan changes from this tab (`pooc:plan-change` CustomEvent) and
 * from other tabs (the native `storage` event). Returns an unsubscribe fn.
 */
export function onPlanChange(cb: (slugs: string[]) => void): () => void {
  if (!hasWindow()) return () => {};

  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    cb(
      Array.isArray(detail)
        ? detail.filter((v): v is string => typeof v === "string")
        : getPlan(),
    );
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    cb(getPlan());
  };

  window.addEventListener(PLAN_CHANGE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(PLAN_CHANGE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
