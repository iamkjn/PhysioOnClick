import { describe, expect, it } from "vitest";
import { blogArticles } from "@/lib/blog";

// SAFETY: blog red-flag text must route emergency signs the way the NHS pages in
// docs/seo/phase-b-sources.md do (items 10, 11, 13): cauda equina, possible
// stroke (FAST), chest pain / clot in the lung -> 999 or A&E.

const RED_FLAG_HEADING = /red flag|urgent|extra help/i;

const redFlagSentences = () => {
  const out: Array<[string, string]> = [];
  for (const a of blogArticles) {
    for (const s of a.sections) {
      if (!RED_FLAG_HEADING.test(s.heading)) continue;
      for (const para of s.body) {
        for (const sentence of para.split(/(?<=[.!?])\s+/)) out.push([a.slug, sentence]);
      }
    }
  }
  return out;
};

const EMERGENCY_TERMS: Array<[string, RegExp]> = [
  ["cauda equina", /cauda equina|saddle|genitals|bladder or bowel|both legs|bilateral leg/i],
  ["FAST / stroke", /stroke|facial droop|drooping face|slurred speech|trouble speaking/i],
  ["chest pain / clot in the lung", /chest pain|chest tightness|breathless/i],
];

describe("blog red flags", () => {
  it("covers both category and hand-authored red-flag sections", () => {
    const slugs = new Set(redFlagSentences().map(([slug]) => slug));
    expect(slugs.size).toBe(blogArticles.length);
    expect(slugs).toContain("online-physiotherapy-for-frozen-shoulder");
  });

  it.each(EMERGENCY_TERMS)("%s terms always come with 999 or A&E", (_label, re) => {
    let hits = 0;
    for (const [slug, sentence] of redFlagSentences()) {
      if (!re.test(sentence)) continue;
      hits += 1;
      expect(sentence, slug).toMatch(/999|A&E/);
    }
    expect(hits).toBeGreaterThan(0);
  });

  it("emergency routes say not to drive yourself", () => {
    for (const [slug, sentence] of redFlagSentences()) {
      if (/call 999 or go to A&E/i.test(sentence) && /cauda|genitals|both legs|clot/i.test(sentence)) {
        expect(sentence, slug).toMatch(/do not drive yourself/i);
      }
    }
  });

  it("a hot swollen joint with fever routes to A&E or NHS 111", () => {
    for (const [slug, sentence] of redFlagSentences()) {
      if (/hot,? (red,? )?(and )?swollen|septic/i.test(sentence) && /fever/i.test(sentence)) {
        expect(sentence, slug).toMatch(/A&E/);
        expect(sentence, slug).toMatch(/NHS 111/);
      }
    }
  });
});
