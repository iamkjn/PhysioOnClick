// Shivaliba Zala's round-2 clinical sign-off rulings (2026-10-04). Sources are
// recorded in docs/seo/phase-b-sources.md item 15l.
import { readFileSync } from "node:fs";
import path from "node:path";
import { onlinePhysioPages, getOnlinePhysioPage } from "@/lib/online-physio-pages";

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
