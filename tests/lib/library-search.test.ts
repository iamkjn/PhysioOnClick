import { describe, it, expect } from "vitest";

import {
  SEARCH_SYNONYMS,
  buildSearchItems,
  searchItems,
  type SearchItem,
} from "@/lib/library-search";

const run = (query: string): SearchItem[] =>
  searchItems(buildSearchItems(), query);

const slugs = (results: SearchItem[]): string[] => results.map((r) => r.slug);

describe("library-search: buildSearchItems", () => {
  it("emits one item per exercise and per condition, each with a joined terms string", () => {
    const items = buildSearchItems();
    expect(items.length).toBeGreaterThan(150);
    expect(items.some((i) => i.kind === "exercise")).toBe(true);
    expect(items.some((i) => i.kind === "condition")).toBe(true);
    for (const item of items) {
      expect(typeof item.terms).toBe("string");
      expect(item.terms).toBe(item.terms.toLowerCase());
      expect(item.terms.length).toBeGreaterThan(0);
    }
  });

  it("folds the body-area label into an exercise's terms", () => {
    const clam = buildSearchItems().find(
      (i) => i.kind === "exercise" && i.slug === "clam-shell",
    );
    expect(clam?.terms).toContain("hip");
  });

  it("folds programme stage names into a condition's terms", () => {
    const lowBack = buildSearchItems().find(
      (i) => i.kind === "condition" && i.slug === "low-back-pain",
    );
    // "lumbago" comes from the aka list, "settle the flare" from a stage name.
    expect(lowBack?.terms).toContain("lumbago");
    expect(lowBack?.terms).toContain("settle the flare");
  });
});

describe("library-search: searchItems lay-language matching", () => {
  it("'kneecap pain' surfaces the patellofemoral hub and at least one knee exercise", () => {
    const results = run("kneecap pain");
    expect(
      results.some(
        (r) => r.kind === "condition" && r.slug === "patellofemoral-pain",
      ),
    ).toBe(true);
    expect(results.some((r) => r.kind === "exercise")).toBe(true);
  });

  it("'sore shoulder at night' surfaces the rotator cuff hub", () => {
    expect(slugs(run("sore shoulder at night"))).toContain(
      "rotator-cuff-tendinopathy",
    );
  });

  it("'trapped nerve in my leg' surfaces sciatica", () => {
    expect(slugs(run("trapped nerve in my leg"))).toContain("sciatica");
  });

  it("maps the common elbow / shoulder lay names to their hubs", () => {
    expect(slugs(run("tennis elbow"))).toContain("tennis-elbow");
    expect(slugs(run("golfers elbow"))).toContain("golfers-elbow");
    expect(slugs(run("frozen"))).toContain("frozen-shoulder");
  });

  it("returns nothing for an empty, whitespace-only or all-stopword query", () => {
    expect(run("")).toEqual([]);
    expect(run("   ")).toEqual([]);
    expect(run("the my for")).toEqual([]);
  });

  it("caps the ranked list at 12 and never repeats a (kind, slug)", () => {
    const results = run("shoulder");
    expect(results.length).toBeLessThanOrEqual(12);
    expect(results.length).toBe(12);
    const keys = results.map((r) => `${r.kind}:${r.slug}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("ranks an exact hub-name phrase match above incidental token hits", () => {
    const results = run("tennis elbow");
    expect(results[0]?.slug).toBe("tennis-elbow");
  });
});

describe("library-search: SEARCH_SYNONYMS shape", () => {
  it("every key is lower-case ASCII and every value is a non-empty ASCII array", () => {
    const entries = Object.entries(SEARCH_SYNONYMS);
    expect(entries.length).toBeGreaterThanOrEqual(25);
    for (const [key, value] of entries) {
      expect(key).toBe(key.toLowerCase());
      expect(key).toMatch(/^[a-z0-9 ]+$/);
      expect(Array.isArray(value)).toBe(true);
      expect(value.length).toBeGreaterThan(0);
      for (const term of value) {
        expect(term.length).toBeGreaterThan(0);
        // eslint-disable-next-line no-control-regex
        expect(term).toMatch(/^[\x00-\x7F]+$/);
      }
    }
  });
});
