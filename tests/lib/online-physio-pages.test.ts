import { onlinePhysioPages, getOnlinePhysioPage, allOnlinePhysioSlugs, onlinePhysioPageForHub, sentenceName } from "@/lib/online-physio-pages";
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
      expect(/^online physiotherapy (for|after) /i.test(p.h1), p.slug).toBe(true);
    }
    expect(getOnlinePhysioPage("nope")).toBeNull();
  });
  it("includes the back, neck, shoulder and knee pages", () => {
    for (const s of ["low-back-pain", "neck-pain", "shoulder-pain", "knee-pain"]) {
      expect(allOnlinePhysioSlugs(), s).toContain(s);
    }
    expect(getOnlinePhysioPage("shoulder-pain")?.blogSlugs).toContain("online-physiotherapy-for-frozen-shoulder");
    expect(getOnlinePhysioPage("knee-pain")?.sources.some((s) => s.url.includes("S0140-6736(23)02630-2"))).toBe(true);
    expect(getOnlinePhysioPage("low-back-pain")?.howOnlineWorks.join(" ")).toContain("/online-physiotherapy-for/sciatica");
  });
  it("includes the heel, elbow and hip pages", () => {
    for (const s of ["plantar-fasciitis", "tennis-elbow", "hip-pain"]) {
      expect(allOnlinePhysioSlugs(), s).toContain(s);
    }
    expect(getOnlinePhysioPage("plantar-fasciitis")?.exerciseHubSlug).toBeUndefined();
    expect(getOnlinePhysioPage("tennis-elbow")?.exerciseHubSlug).toBe("tennis-elbow");
    expect(getOnlinePhysioPage("hip-pain")?.exerciseHubSlug).toBe("gluteal-tendinopathy");
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

describe("phase C post-surgery pages and sentenceName", () => {
  it("sentenceName uses nameInSentence, else the lowercased name", () => {
    const base = getOnlinePhysioPage("knee-pain")!;
    expect(sentenceName({ ...base, name: "Parkinson's", nameInSentence: undefined })).toBe("parkinson's");
    expect(sentenceName({ ...base, name: "Parkinson's", nameInSentence: "Parkinson's" })).toBe("Parkinson's");
    expect(sentenceName(getOnlinePhysioPage("knee-replacement-rehab")!)).toBe("knee replacement");
  });
  it("the three post-surgery slugs exist with 'after' h1s", () => {
    for (const s of ["knee-replacement-rehab", "hip-replacement-rehab", "rotator-cuff-repair-rehab"]) {
      const p = getOnlinePhysioPage(s);
      expect(p, s).not.toBeNull();
      expect(p!.h1.startsWith("Online physiotherapy after "), s).toBe(true);
      expect(p!.serviceSlug).toBe("post-surgical-rehabilitation");
      const t = allText(p!).toLowerCase();
      expect(t, s).toContain("surgical team");
      expect(t, s).toMatch(/999/);
    }
    expect(getOnlinePhysioPage("rotator-cuff-repair-rehab")?.blogSlugs ?? []).not.toContain("online-physiotherapy-after-acl-reconstruction");
    expect(getOnlinePhysioPage("knee-replacement-rehab")?.faqs.map((f) => f.a).join(" ")).toContain("/blog/online-physiotherapy-after-acl-reconstruction");
  });
  it("post-surgical service links the three slugs", () => {
    const svc = services.find((s) => s.slug === "post-surgical-rehabilitation")!;
    expect(svc.onlinePhysioSlugs).toEqual(["knee-replacement-rehab", "hip-replacement-rehab", "rotator-cuff-repair-rehab"]);
  });
});

describe("phase C neurological pages", () => {
  const slugs = ["stroke-rehabilitation", "parkinsons", "multiple-sclerosis", "functional-neurological-disorder"];
  it("the four neuro slugs exist, served by the neuro service, with the right h1 and nameInSentence", () => {
    const expected: Record<string, [string, string]> = {
      "stroke-rehabilitation": ["Online physiotherapy for stroke recovery", "stroke recovery"],
      parkinsons: ["Online physiotherapy for Parkinson's", "Parkinson's"],
      "multiple-sclerosis": ["Online physiotherapy for multiple sclerosis", "MS"],
      "functional-neurological-disorder": ["Online physiotherapy for functional neurological disorder (FND)", "FND"],
    };
    for (const s of slugs) {
      const p = getOnlinePhysioPage(s);
      expect(p, s).not.toBeNull();
      expect(p!.serviceSlug).toBe("neurological-rehabilitation");
      expect(p!.h1).toBe(expected[s][0]);
      expect(sentenceName(p!)).toBe(expected[s][1]);
    }
  });
  it("neuro service links the four slugs", () => {
    const svc = services.find((s) => s.slug === "neurological-rehabilitation")!;
    expect(svc.onlinePhysioSlugs).toEqual(slugs);
  });
  it("every neuro page puts FAST / 999 first, says triage confirms video suits, and avoids specialist claims", () => {
    for (const s of slugs) {
      const p = getOnlinePhysioPage(s)!;
      expect(p.inPersonInstead[0], s).toMatch(/999/);
      expect(p.inPersonInstead[0], s).toMatch(/face/i);
      expect(p.inPersonInstead.join(" "), s).toMatch(/do not drive/i);
      const t = allText(p);
      expect(t, s).toMatch(/triage/i);
      expect(t, s).toMatch(/medically stable|stable/i);
      expect(/neuro(logical)? specialist|specialist neuro|acute/i.test(t.replace(/not (an )?acute|acute care/gi, "")), `${s}: specialist/acute claim`).toBe(false);
      expect(/\b(reverse|slow(s|ing)? (down )?the (disease|condition)|halt)\b/i.test(t), s).toBe(false);
    }
  });
  it("Parkinson's uses the falls hub and links the gait service; FND frames Physio4FMD honestly", () => {
    const pd = getOnlinePhysioPage("parkinsons")!;
    expect(pd.exerciseHubSlug).toBe("falls-prevention");
    expect(allText(pd)).toContain("/services/gait-and-mobility-assessment");
    const fnd = getOnlinePhysioPage("functional-neurological-disorder")!;
    const t = allText(fnd);
    expect(t).toContain("Physio4FMD");
    expect(t).not.toContain("Physio4FND");
    expect(t).toMatch(/neurologist/i);
    expect(t).toMatch(/did not find a difference/i);
    expect(/\b(recover(y|ed) rate|will recover|full recovery|guarantee)/i.test(t)).toBe(false);
  });
  it("MS page carries the NHS MS 999 routing", () => {
    const t = getOnlinePhysioPage("multiple-sclerosis")!.inPersonInstead.join(" ");
    expect(t).toMatch(/one arm|1 arm/i);
    expect(t).toMatch(/balance/i);
    expect(t).toMatch(/A&E/);
  });
});

describe("phase B internal linking helpers", () => {
  it("onlinePhysioPageForHub reverse-looks-up by exercise hub slug", () => {
    expect(onlinePhysioPageForHub("sciatica")?.slug).toBe("sciatica");
    expect(onlinePhysioPageForHub("nope")).toBeNull();
  });
  it("every service onlinePhysioSlugs entry resolves", () => {
    const withSlugs = services.filter((s) => s.onlinePhysioSlugs?.length);
    expect(withSlugs.map((s) => s.slug).sort()).toEqual(
      ["musculoskeletal-physiotherapy", "neurological-rehabilitation", "online-rehab-programmes", "post-surgical-rehabilitation"],
    );
    for (const s of withSlugs) {
      for (const slug of s.onlinePhysioSlugs!) {
        expect(getOnlinePhysioPage(slug), `${s.slug}/${slug}`).not.toBeNull();
      }
    }
  });
});
