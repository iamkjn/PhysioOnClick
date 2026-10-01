import { guides, getGuide, allGuideSlugs } from "@/lib/guides";
import { readFileSync } from "node:fs";
import path from "node:path";

const sourcesDoc = readFileSync(path.resolve(__dirname, "../../docs/seo/phase-b-sources.md"), "utf8");
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const allText = (g: (typeof guides)[number]) =>
  [g.title, g.seoTitle, g.seoDescription, g.answer, ...g.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
   ...g.faqs.flatMap((f) => [f.q, f.a])].join("\n");

describe("guides data", () => {
  it("has unique kebab-case slugs and working lookups", () => {
    expect(guides.length).toBeGreaterThanOrEqual(1);
    expect(new Set(allGuideSlugs()).size).toBe(guides.length);
    for (const g of guides) {
      expect(g.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(getGuide(g.slug)).toBe(g);
    }
    expect(getGuide("nope")).toBeNull();
  });
  it("meets SEO length rules", () => {
    for (const g of guides) {
      expect(g.seoTitle.endsWith("| PhysioOnClick"), g.slug).toBe(true);
      expect(g.seoTitle.length, g.slug).toBeLessThanOrEqual(65);
      expect(g.seoDescription.length, g.slug).toBeGreaterThanOrEqual(120);
      expect(g.seoDescription.length, g.slug).toBeLessThanOrEqual(160);
      expect(words(g.answer), g.slug).toBeGreaterThanOrEqual(40);
      expect(words(g.answer), g.slug).toBeLessThanOrEqual(70);
    }
  });
  it("has real depth, FAQs, sources and related links", () => {
    for (const g of guides) {
      expect(g.sections.length, g.slug).toBeGreaterThanOrEqual(3);
      expect(words(allText(g)), g.slug).toBeGreaterThanOrEqual(700);
      expect(g.faqs.length, g.slug).toBeGreaterThanOrEqual(3);
      expect(g.sources.length, g.slug).toBeGreaterThanOrEqual(2);
      for (const s of g.sources) {
        expect(s.url.startsWith("https://"), s.url).toBe(true);
        expect(sourcesDoc.includes(s.url), `${g.slug}: ${s.url} missing from phase-b-sources.md`).toBe(true);
      }
      expect(g.related.length, g.slug).toBeGreaterThanOrEqual(2);
      for (const r of g.related) expect(r.href.startsWith("/"), r.href).toBe(true);
      expect(g.publishedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(g.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("follows the copy rules", () => {
    for (const g of guides) {
      const t = allText(g);
      expect(/[–—‘’“”]/.test(t), `${g.slug}: curly quote or long dash`).toBe(false);
      expect(/[^\x00-\xff£]/.test(t), `${g.slug}: non Latin-1 character`).toBe(false);
      expect(/\b(best|leading|no\.?\s?1)\b/i.test(t), `${g.slug}: superlative`).toBe(false);
      expect(/£\d/.test(t), `${g.slug}: hardcoded price - interpolate from site-data instead`).toBe(false);
    }
  });
  it("no paragraph is reused across guides", () => {
    const seen = new Map<string, string>();
    for (const g of guides) for (const s of g.sections) for (const p of s.paragraphs) {
      expect(seen.has(p), `${g.slug} repeats a paragraph from ${seen.get(p)}`).toBe(false);
      seen.set(p, g.slug);
    }
  });
  it("has the phase B2 guides", () => {
    for (const s of ["private-physiotherapy-cost-uk", "claim-physiotherapy-on-health-insurance",
      "do-i-need-a-gp-referral-for-physiotherapy", "how-many-physiotherapy-sessions-do-i-need",
      "nhs-physio-waiting-times-scotland"]) expect(getGuide(s), s).not.toBeNull();
  });
  it("has the phase B3 guides", () => {
    for (const s of ["does-online-physiotherapy-work", "can-a-physio-diagnose-over-video",
      "what-online-physiotherapy-cannot-do"]) expect(getGuide(s), s).not.toBeNull();
  });
});
