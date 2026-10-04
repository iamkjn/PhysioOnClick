// Shivaliba Zala's round-2 clinical sign-off rulings (2026-10-04). Sources are
// recorded in docs/seo/phase-b-sources.md item 15l.
import { readFileSync } from "node:fs";
import path from "node:path";
import { onlinePhysioPages, getOnlinePhysioPage } from "@/lib/online-physio-pages";
import { conditions } from "@/lib/conditions";

const read = (rel: string) => readFileSync(path.resolve(__dirname, "../..", rel), "utf8");

const pageText = (p: (typeof onlinePhysioPages)[number]) =>
  [p.answer, ...p.howOnlineWorks, ...p.assessmentChecks, ...p.typicalPlan, p.timeline, ...p.inPersonInstead,
   ...p.faqs.flatMap((f) => [f.q, f.a])].join("\n");

const CONTENT_FILES = [
  "lib/online-physio-pages.ts",
  "lib/conditions.ts",
  "lib/blog.ts",
  "lib/guides.ts",
  "lib/site-data.ts",
  "lib/chat-prompt.ts",
  "components/chat-widget.tsx",
  "app/glasgow-physiotherapist/page.tsx",
];

describe("Q1: post-op start follows UK guidance, not 'no restrictions'", () => {
  it("no content file keeps the old 'no restrictions' start rule", () => {
    for (const f of CONTENT_FILES) {
      // The HCPC Register's own status wording ("Registered ... with no
      // restrictions") is not a post-op rule, so strip it before checking.
      const text = read(f).replace(/on the Register with no restrictions/g, "");
      expect(/no restrictions/i.test(text), f).toBe(false);
    }
  });
  it("knee and hip replacement pages say UK guidance starts rehab in hospital", () => {
    for (const s of ["knee-replacement-rehab", "hip-replacement-rehab"]) {
      expect(pageText(getOnlinePhysioPage(s)!), s).toMatch(/on the day of surgery if possible/);
    }
  });
});

const AE_OR_111 = "go to A&E now, or call NHS 111 straight away if you are not sure where to go";
const hub = (slug: string) => conditions.find((c) => c.slug === slug)!;

describe("Q3/Q4: shoulder infection signs route to A&E, each sign on its own ('or')", () => {
  it("the shoulder landing pages use NICE CKS's 'or' and the A&E route", () => {
    for (const s of ["shoulder-pain", "rotator-cuff-repair-rehab"]) {
      const lines = getOnlinePhysioPage(s)!.inPersonInstead;
      const line = lines.find((l) => /joint infection/.test(l));
      expect(line, s).toMatch(/red or hot skin over the joint, or a fever, or you feel generally unwell/);
      expect(line, s).toContain(AE_OR_111);
      expect(lines.join("\n"), s).not.toMatch(/red, hot and painful and you have a fever/);
      // Feeling feverish or unwell must never be routed only to a GP or 111.
      expect(lines.some((l) => /feverish or unwell/.test(l) && !l.includes("A&E")), s).toBe(false);
    }
  });
  it("every shoulder exercise hub carries the shoulder infection flag in its urgent box", () => {
    for (const c of conditions.filter((c) => c.bodyArea === "Shoulder")) {
      expect(c.urgentFlags!.some((f) => /red or hot skin over the joint, or a fever, or feeling generally unwell/.test(f) && f.includes(AE_OR_111)), c.slug).toBe(true);
    }
  });
  it("the frozen shoulder blog uses the same route", () => {
    expect(read("lib/blog.ts")).toMatch(/Shoulder pain with red or hot skin over the joint, or a fever, or feeling generally unwell needs A&E now/);
  });
});

describe("Q5: knee, heel and elbow infection signs route to A&E or 111, consistently", () => {
  it("every temperature/infection line on the knee, heel and elbow pages uses the A&E route", () => {
    for (const s of ["knee-pain", "plantar-fasciitis", "tennis-elbow"]) {
      const p = getOnlinePhysioPage(s)!;
      const infection = p.inPersonInstead.filter((l) => /temperature|infection/i.test(l));
      expect(infection.length, s).toBeGreaterThan(0);
      for (const l of infection) expect(l, s).toContain(AE_OR_111);
      for (const f of p.faqs.filter((f) => /temperature/.test(f.a))) expect(f.a, `${s}: ${f.q}`).toContain(AE_OR_111);
      expect(p.answer, s).toMatch(/A&E/);
      expect(p.sources.some((x) => x.url === "https://www.nhs.uk/conditions/septic-arthritis/"), s).toBe(true);
      expect(p.sources.some((x) => x.url === "https://cks.nice.org.uk/topics/knee-pain-assessment/"), s).toBe(true);
    }
  });
  it("the matching exercise hubs carry the shared A&E infection flag", () => {
    for (const slug of ["knee-osteoarthritis", "patellofemoral-pain", "achilles-tendinopathy", "tennis-elbow", "golfers-elbow"]) {
      const c = hub(slug);
      expect(c.urgentFlags!.some((f) => /red, hot or swollen and you have a fever/.test(f) && f.includes(AE_OR_111)), slug).toBe(true);
    }
  });
  it("the knee blog routes a hot, red, swollen knee with fever to A&E", () => {
    expect(read("lib/blog.ts")).toMatch(/A knee that is hot, red and swollen with a fever needs A&E now/);
  });
});

describe("Q6: being unable to pass urine at all", () => {
  it("routes to 999 or A&E (NHS inform: acute urinary retention is a medical emergency)", () => {
    const line = hub("stress-urinary-incontinence").urgentFlags!.find((f) => /cannot pass urine at all/.test(f));
    expect(line).toMatch(/call 999 or go to A&E\. Do not drive yourself\./);
  });
});
