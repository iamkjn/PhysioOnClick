import { onlinePhysioPages, getOnlinePhysioPage, allOnlinePhysioSlugs } from "@/lib/online-physio-pages";
import { getCondition, getSelfTest } from "@/lib/exercise-library";
import { getArticle } from "@/lib/blog";
import { getGuide } from "@/lib/guides";
import { services } from "@/lib/site-data";
import { readFileSync } from "node:fs";
import path from "node:path";

const sourcesDoc = readFileSync(path.resolve(__dirname, "../../docs/seo/phase-b-sources.md"), "utf8");
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const allText = (p: (typeof onlinePhysioPages)[number]) =>
  [p.h1, p.seoTitle, p.seoDescription, p.answer, ...p.howOnlineWorks, ...p.assessmentChecks, ...p.typicalPlan,
   p.timeline, ...p.inPersonInstead, ...p.faqs.flatMap((f) => [f.q, f.a])].join("\n");

describe("online physio landing pages", () => {
  it("unique slugs and lookups", () => {
    expect(new Set(allOnlinePhysioSlugs()).size).toBe(onlinePhysioPages.length);
    for (const p of onlinePhysioPages) {
      expect(p.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(getOnlinePhysioPage(p.slug)).toBe(p);
      expect(p.h1.toLowerCase().startsWith("online physiotherapy for"), p.slug).toBe(true);
    }
    expect(getOnlinePhysioPage("nope")).toBeNull();
  });
  it("SEO length rules", () => {
    for (const p of onlinePhysioPages) {
      expect(p.seoTitle.endsWith("| PhysioOnClick"), p.slug).toBe(true);
      expect(p.seoTitle.length, p.slug).toBeLessThanOrEqual(65);
      expect(p.seoDescription.length, p.slug).toBeGreaterThanOrEqual(120);
      expect(p.seoDescription.length, p.slug).toBeLessThanOrEqual(160);
      expect(words(p.answer), p.slug).toBeGreaterThanOrEqual(40);
      expect(words(p.answer), p.slug).toBeLessThanOrEqual(70);
    }
  });
  it("depth, safety and sources", () => {
    for (const p of onlinePhysioPages) {
      expect(words(allText(p)), p.slug).toBeGreaterThanOrEqual(650);
      expect(p.assessmentChecks.length, p.slug).toBeGreaterThanOrEqual(4);
      expect(p.inPersonInstead.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(p.faqs.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(p.sources.length, p.slug).toBeGreaterThanOrEqual(2);
      for (const s of p.sources) expect(sourcesDoc.includes(s.url), `${p.slug}: ${s.url}`).toBe(true);
    }
  });
  it("cross-references resolve", () => {
    const svc = new Set(services.map((s) => s.slug));
    for (const p of onlinePhysioPages) {
      expect(svc.has(p.serviceSlug), p.slug).toBe(true);
      if (p.exerciseHubSlug) expect(getCondition(p.exerciseHubSlug), p.slug).not.toBeNull();
      for (const t of p.selfTestSlugs ?? []) expect(getSelfTest(t), `${p.slug}/${t}`).toBeTruthy();
      for (const b of p.blogSlugs ?? []) expect(getArticle(b), `${p.slug}/${b}`).toBeTruthy();
      for (const g of p.guideSlugs ?? []) expect(getGuide(g), `${p.slug}/${g}`).not.toBeNull();
    }
  });
  it("copy rules and no reused paragraphs", () => {
    const seen = new Map<string, string>();
    for (const p of onlinePhysioPages) {
      const t = allText(p);
      expect(/[–—‘’“”]/.test(t), p.slug).toBe(false);
      expect(/[^\x00-\xff£]/.test(t), p.slug).toBe(false);
      expect(/\b(best|leading|no\.?\s?1|cure[sd]?)\b/i.test(t), `${p.slug}: superlative or cure claim`).toBe(false);
      expect(/£\d/.test(t), `${p.slug}: hardcoded price`).toBe(false);
      for (const para of [...p.howOnlineWorks, ...p.typicalPlan]) {
        expect(seen.has(para), `${p.slug} reuses a paragraph from ${seen.get(para)}`).toBe(false);
        seen.set(para, p.slug);
      }
    }
  });
});
