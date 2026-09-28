import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Structural gate for docs/analytics-tracking.md (see that file's "Why this
// file won't silently go stale" section for the full reasoning). This test
// has exactly one job: keep the registry's list of screens in sync with the
// real `app/**/page.tsx` tree. It does NOT verify that the events listed for
// a page are still accurate -- that's not mechanically checkable from a
// markdown file, and stays on whoever adds/removes a track() call.
//
// Do not delete this test because it's "just" a doc-sync check -- that sync
// check is the entire mechanism that keeps docs/analytics-tracking.md honest.
// `npm run test:run` runs before every commit in this repo's normal workflow,
// so a page added/removed/moved without a matching registry update fails
// here until the docs are updated.

const APP_DIR = path.resolve(__dirname, "../../app");
const REGISTRY_PATH = path.resolve(__dirname, "../../docs/analytics-tracking.md");

/** Every `app/**\/page.tsx` path, relative to the repo root, forward-slashed
 *  and sorted -- the same "authoritative list" `find app -name "page.tsx" |
 *  sort` produces, which is how docs/analytics-tracking.md was built. */
function findPageFiles(): string[] {
  const entries = readdirSync(APP_DIR, { recursive: true, withFileTypes: true });
  const pages = entries
    .filter((entry) => entry.isFile() && entry.name === "page.tsx")
    .map((entry) => {
      // Node's recursive readdirSync reports `parentPath` (or the older
      // `path` on some versions) as the directory the entry lives in.
      const dir = (entry as { parentPath?: string; path?: string }).parentPath
        ?? (entry as { path?: string }).path
        ?? APP_DIR;
      return path.join(dir, entry.name);
    })
    .map((absolute) => path.relative(path.resolve(__dirname, "../.."), absolute).split(path.sep).join("/"));
  return pages.sort();
}

/** Every real page path (e.g. `app/exercises/area/[bodyArea]/page.tsx`)
 *  mentioned in backticks anywhere in the registry markdown, de-duplicated
 *  and sorted. The character class deliberately excludes glob/ellipsis
 *  characters like `*` and `.` (beyond the `.tsx` extension) so prose
 *  elsewhere in the doc -- e.g. describing the pattern `app/**\/page.tsx` in
 *  English -- can't be mistaken for a real, registered path. */
function findRegistryEntries(): string[] {
  const markdown = readFileSync(REGISTRY_PATH, "utf8");
  const matches = markdown.matchAll(
    /`(app\/(?:(?:[A-Za-z0-9_-]+|\[[A-Za-z0-9_-]+\])\/)*page\.tsx)`/g,
  );
  const paths = new Set<string>();
  for (const match of matches) {
    paths.add(match[1]);
  }
  return [...paths].sort();
}

describe("docs/analytics-tracking.md stays in sync with app/**/page.tsx", () => {
  it("finds a non-trivial number of real page.tsx files (sanity check on the glob itself)", () => {
    const pages = findPageFiles();
    // 49 at the time this test was written; asserting "a lot" rather than the
    // exact count keeps this assertion from being the thing that goes stale.
    expect(pages.length).toBeGreaterThan(40);
    expect(pages).toContain("app/page.tsx");
    expect(pages).toContain("app/exercises/page.tsx");
  });

  it("has a registry entry for every real page.tsx file", () => {
    const pages = findPageFiles();
    const registered = new Set(findRegistryEntries());
    const missing = pages.filter((page) => !registered.has(page));
    expect(
      missing,
      `The following page.tsx file(s) exist but have no entry in docs/analytics-tracking.md. ` +
        `Add a row documenting what tracks on them (including the automatic page_view):\n` +
        missing.join("\n"),
    ).toEqual([]);
  });

  it("has no registry entry for a page.tsx that no longer exists", () => {
    const pages = new Set(findPageFiles());
    const registered = findRegistryEntries();
    const stale = registered.filter((entry) => !pages.has(entry));
    expect(
      stale,
      `The following docs/analytics-tracking.md entries point at a page.tsx that no longer ` +
        `exists. Remove or update the row:\n` +
        stale.join("\n"),
    ).toEqual([]);
  });
});
