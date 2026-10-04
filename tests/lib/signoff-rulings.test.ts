// Shivaliba Zala's clinical sign-off rulings (2026-10-03), applied across the
// Phase B/C content: no NHS-team claims (Q5), neuro and post-op clearance
// (Q6/Q9), no fixed session ranges (Q2), NICE sources (Q10-15), no competitor
// names (Q16) and the shared page disclaimer (Q17/18).
import { readFileSync } from "node:fs";
import path from "node:path";
import { guides, getGuide } from "@/lib/guides";
import { onlinePhysioPages, getOnlinePhysioPage } from "@/lib/online-physio-pages";
import { services } from "@/lib/site-data";
import { PAGE_DISCLAIMER } from "@/lib/exercise-disclaimer";
import { conditions } from "@/lib/conditions";

const NEURO_CLEARANCE = "Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy.";
const POSTOP_CLEARANCE =
  "starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you";

const pageText = (p: (typeof onlinePhysioPages)[number]) =>
  [p.h1, p.seoTitle, p.seoDescription, p.answer, ...p.howOnlineWorks, ...p.assessmentChecks, ...p.typicalPlan,
   p.timeline, ...p.inPersonInstead, ...p.faqs.flatMap((f) => [f.q, f.a]), ...p.sources.map((s) => `${s.label} ${s.url}`)].join("\n");
const guideText = (g: (typeof guides)[number]) =>
  [g.title, g.seoTitle, g.seoDescription, g.answer, ...g.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
   ...g.faqs.flatMap((f) => [f.q, f.a]), ...g.sources.map((s) => `${s.label} ${s.url}`)].join("\n");
const serviceText = (s: (typeof services)[number]) =>
  [s.summary, s.firstSession, s.typicalOutcomes, s.whenInPersonInstead, ...s.faqs.flatMap((f) => [f.question, f.answer])].join("\n");
const read = (rel: string) => readFileSync(path.resolve(__dirname, "../..", rel), "utf8");

const publicPageFiles = [
  "app/page.tsx",
  "app/glasgow-physiotherapist/page.tsx",
  "app/online-physiotherapy-scotland/page.tsx",
  "app/how-online-physiotherapy-works/page.tsx",
  "app/pricing/page.tsx",
];

const allContent = () => [
  ...onlinePhysioPages.map((p) => [`page ${p.slug}`, pageText(p)] as const),
  ...guides.map((g) => [`guide ${g.slug}`, guideText(g)] as const),
  ...services.map((s) => [`service ${s.slug}`, serviceText(s)] as const),
  ...publicPageFiles.map((f) => [f, read(f)] as const),
];

describe("Q5: no claims that we work with or coordinate with NHS teams", () => {
  const banned = [
    /work(s|ing)? alongside (your|the|any)/i,
    /alongside your (NHS|neurology|MS|Parkinson's|stroke|wider|medical|care)/i,
    /\bliaise\b/i,
    /(?<!(?:n't|not|never) )coordinate (?:your )?(?:care )?with your/i,
    /share (a |your )?(written )?summary/i,
    /summary of your (rehab )?progress/i,
    /supports your wider team/i,
    /one part of that team/i,
    /alongside a patient's wider medical team/i,
    /close coordination with/i,
    /(?<!(?:n't|not|never) )coordinat\w* with (a GP|the wider|in-person testing or the surgical)/i,
  ];
  it("none of the banned phrases appear in landing pages, guides, services or public pages", () => {
    for (const [where, text] of [...allContent(), ["lib/blog.ts", read("lib/blog.ts")] as const]) {
      for (const re of banned) expect(re.test(text), `${where}: ${re}`).toBe(false);
    }
  });
});

describe("Q6/Q9: clearance before starting", () => {
  it("every neuro landing page and the neuro service carry the GP/specialist clearance sentence", () => {
    for (const s of ["stroke-rehabilitation", "parkinsons", "multiple-sclerosis", "functional-neurological-disorder"]) {
      expect(pageText(getOnlinePhysioPage(s)!), s).toContain(NEURO_CLEARANCE);
    }
    expect(serviceText(services.find((s) => s.slug === "neurological-rehabilitation")!)).toContain(NEURO_CLEARANCE);
    expect(read("app/glasgow-physiotherapist/page.tsx")).toContain(NEURO_CLEARANCE);
  });
  it("MS pauses sessions until the GP or MS team clears restarting", () => {
    expect(pageText(getOnlinePhysioPage("multiple-sclerosis")!)).toMatch(/pause your sessions[^.]*until your GP or MS team/i);
  });
  it("every post-op landing page and the post-surgical service start when the surgical team says you are ready (round 2 Q1)", () => {
    for (const s of ["knee-replacement-rehab", "hip-replacement-rehab", "rotator-cuff-repair-rehab"]) {
      const t = pageText(getOnlinePhysioPage(s)!);
      expect(t, s).toContain(POSTOP_CLEARANCE);
      expect(t, s).not.toMatch(/cleared (you )?(to begin|to start)? ?exercise-based rehab/i);
    }
    expect(serviceText(services.find((s) => s.slug === "post-surgical-rehabilitation")!)).toContain(POSTOP_CLEARANCE);
  });
  it("other post-op mentions carry the ready-for-physiotherapy wording (round 2 Q1)", () => {
    const paed = services.find((s) => s.slug === "paediatric-physiotherapy")!;
    expect(paed.conditions.join(" ")).toMatch(/surgical team has said they are ready for outpatient or community physiotherapy/);
    const gait = services.find((s) => s.slug === "gait-and-mobility-assessment")!;
    expect(gait.conditions.join(" ") + serviceText(gait)).toMatch(/surgical team has said you are ready for outpatient or community physiotherapy/);
    expect(serviceText(gait)).toContain(POSTOP_CLEARANCE);
    expect(read("app/glasgow-physiotherapist/page.tsx")).toContain("rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy");
    expect(read("components/chat-widget.tsx")).toContain("Rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you.");
    const firstSession = services.find((s) => s.slug === "post-surgical-rehabilitation")!.firstSession;
    expect(firstSession).not.toMatch(/stage of healing|next 2, 6 and 12 weeks/);
  });
  it("the ACL blog routes breathlessness with calf symptoms to 999 or A&E and needs clearance", () => {
    const blog = read("lib/blog.ts");
    expect(blog).not.toMatch(/breathlessness, need urgent same-day medical assessment/);
    expect(blog).toMatch(/breathlessness or chest pain, call 999 or go to A&E \(possible clot in the lung\), and do not drive yourself/);
    expect(blog).not.toMatch(/phase-appropriate plan/);
  });
});

describe("Q2: no fixed session or recovery ranges presented as our typical plans", () => {
  it("landing pages, guides and services do not quote our own session ranges", () => {
    const re = /\b\d+\s*(?:-|to)\s*\d+\s*(?:weekly\s*)?sessions\b|\btypical course\b|most (of our )?plans run|\d+\s*(?:-|to)\s*\d+\s*month arc/i;
    for (const [where, text] of allContent()) expect(re.test(text), where).toBe(false);
  });
  it("exercise-hub recovery timelines use the estimate wording and quote no week or month ranges", () => {
    for (const c of conditions) {
      // Pelvic health hubs use neutral wording (no pelvic health service yet).
      const estimate = c.slug === "stress-urinary-incontinence" || c.slug === "pregnancy-pelvic-girdle-pain"
        ? "a pelvic health physiotherapist can estimate this after an assessment."
        : "It depends on your condition; your physiotherapist will give you an estimate after your assessment.";
      expect(c.recoveryTimeline, c.slug).toContain(estimate);
      expect(/\b\d+ (?:to|-) \d+ (?:weeks|months)\b/.test(c.recoveryTimeline), c.slug).toBe(false);
      for (const f of c.faqs) expect(/\b(?:most|many) people[^.]*\d+ (?:to|-) \d+ (?:weeks|months)/i.test(f.a), `${c.slug}: ${f.q}`).toBe(false);
    }
  });
  it("the sessions guide leads with the depends-on-your-condition estimate", () => {
    expect(getGuide("how-many-physiotherapy-sessions-do-i-need")!.answer).toMatch(
      /^It depends on your condition; your physiotherapist will give you an estimate after your assessment\./,
    );
  });
});

describe("Q10-15: NICE sources", () => {
  it("every landing page cites at least one nice.org.uk source", () => {
    for (const p of onlinePhysioPages) {
      expect(p.sources.some((s) => /^https:\/\/(www|cks)\.nice\.org\.uk\//.test(s.url)), p.slug).toBe(true);
    }
  });
  it("the expected guideline is cited per page", () => {
    const expected: Record<string, string[]> = {
      sciatica: ["ng59"], "low-back-pain": ["ng59"], "knee-pain": ["ng226"],
      "knee-replacement-rehab": ["ng157"], "hip-replacement-rehab": ["ng157"],
      "stroke-rehabilitation": ["ng236"], "multiple-sclerosis": ["ng220"], parkinsons: ["ng71", "ng249"],
      "functional-neurological-disorder": ["ng252"], "neck-pain": ["neck-pain-non-specific"],
      "shoulder-pain": ["topics/shoulder-pain"], "plantar-fasciitis": ["topics/plantar-fasciitis"],
      "tennis-elbow": ["topics/tennis-elbow"], "hip-pain": ["greater-trochanteric-pain-syndrome"],
    };
    for (const [slug, codes] of Object.entries(expected)) {
      const urls = getOnlinePhysioPage(slug)!.sources.map((s) => s.url).join(" ");
      for (const c of codes) expect(urls, `${slug}: ${c}`).toContain(c);
    }
  });
  it("the sessions guide cites NICE", () => {
    expect(getGuide("how-many-physiotherapy-sessions-do-i-need")!.sources.some((s) => s.url.includes("nice.org.uk"))).toBe(true);
  });
  it("never cites the replaced falls guideline CG161", () => {
    for (const [where, text] of allContent()) expect(text.includes("cg161"), where).toBe(false);
  });
});

describe("Safety routing from the review", () => {
  it("neck pain routes meningitis signs to 999 or A&E, cites the NHS page, and sends nerve symptoms to an urgent GP", () => {
    const p = getOnlinePhysioPage("neck-pain")!;
    expect(p.inPersonInstead.some((l) => /call 999 or go to A&E/i.test(l) && /meningitis/.test(l) && /neck pain or stiffness/.test(l) && /Do not drive yourself/.test(l))).toBe(true);
    expect(p.sources.some((s) => s.url === "https://www.nhs.uk/conditions/meningitis/")).toBe(true);
    expect(pageText(p)).not.toMatch(/See a GP if you have pins and needles/);
  });
  it("no page uses the vague 'in-person medical care straight away' route", () => {
    for (const [where, text] of allContent()) expect(/in-person medical care straight away/i.test(text), where).toBe(false);
  });
});

describe("Q16: no competitor names or websites on the site", () => {
  const names = /Nuffield|Complete Physio|complete-physio|PhysioFast|physiofast|Ascenti|PromoteHealth|promotehealth/i;
  it("guides, landing pages, services and public pages name no competitor", () => {
    for (const [where, text] of allContent()) expect(names.test(text), where).toBe(false);
  });
  it("Bupa appears only as an insurer, never as a physio provider in a price comparison", () => {
    for (const g of guides.filter((g) => g.slug !== "claim-physiotherapy-on-health-insurance")) {
      expect(/Bupa/.test(guideText(g)), g.slug).toBe(false);
    }
  });
  it("the choosing and cost guides keep an anonymised range", () => {
    for (const s of ["how-to-choose-an-online-physiotherapist-uk", "private-physiotherapy-cost-uk"]) {
      expect(guideText(getGuide(s)!), s).toContain("four UK providers we checked in October 2026");
    }
  });
});

describe("Q17/18: shared page disclaimer", () => {
  it("states the three agreed points", () => {
    expect(PAGE_DISCLAIMER).toMatch(/general and not a substitute for an assessment/);
    expect(PAGE_DISCLAIMER).toMatch(/Don't start a new exercise programme without advice from a physiotherapist or doctor who knows your condition/);
    expect(PAGE_DISCLAIMER).toMatch(/pain that doesn't settle, stop and seek advice/);
    expect([...PAGE_DISCLAIMER].every((ch) => ch.codePointAt(0)! <= 0x7f)).toBe(true);
  });
});
