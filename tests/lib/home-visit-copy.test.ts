import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "@/lib/chat-prompt";
import { guides } from "@/lib/guides";
import { onlinePhysioPages } from "@/lib/online-physio-pages";
import { services, pricing } from "@/lib/site-data";
import { practiceNode } from "@/lib/structured-data";
import { HOME_VISIT_AREA_LABEL } from "@/lib/home-visit-area";
import { formatPounds, HOME_VISIT_TRAVEL_FEE_PENCE } from "@/lib/home-visit-pricing";

// Home visits in the Glasgow area are offered, so no data file may deny them.
const DENIALS = [
  "no home visits",
  "video only",
  "online-only service",
  "online only service",
  "online-only physiotherapy",
  "we don't offer home visits",
  "we do not offer home visits",
  "do not make home visits",
  "we do not offer hands-on treatment or home visits",
  "work by video only",
  "sessions are by video only",
  "appointments are online only",
  "we are an online-only",
  "no in-person clinic",
  "online only",
  "online-only",
  "over video rather than in a clinic",
  "entirely through video",
  "entirely through online video",
  "entirely over video",
];

const PAGE_FILES = [
  "app/page.tsx",
  "app/how-online-physiotherapy-works/page.tsx",
  "app/online-physiotherapy-scotland/page.tsx",
  "app/glasgow-physiotherapist/page.tsx",
  "components/site-footer.tsx",
  "components/chat-widget.tsx",
  "lib/blog.ts",
  "lib/conditions.ts",
];

describe("home visit copy", () => {
  const corpus = JSON.stringify({ guides, onlinePhysioPages, services, pricing }).toLowerCase();

  it.each(DENIALS)("page data never says %j", (phrase) => {
    expect(corpus).not.toContain(phrase);
  });

  it.each(DENIALS)("chat prompt never says %j", (phrase) => {
    expect(buildSystemPrompt().toLowerCase()).not.toContain(phrase);
  });

  it.each(PAGE_FILES)("%s never denies home visits", (file) => {
    const src = readFileSync(file, "utf8").toLowerCase();
    for (const phrase of DENIALS) expect(src).not.toContain(phrase);
  });

  it("the cannot-do guide points Glasgow-area patients to a home visit", () => {
    const g = guides.find((x) => x.slug === "what-online-physiotherapy-cannot-do");
    expect(JSON.stringify(g)).toMatch(/home visit/i);
  });
});

describe("copy accuracy", () => {
  it("how-it-works describes the assessment before payment, with no reminder", () => {
    const src = readFileSync("app/how-online-physiotherapy-works/page.tsx", "utf8");
    expect(src).toMatch(/Before you pay, you fill in a short assessment/);
    expect(src).not.toMatch(/reminder is sent/i);
    expect(src).not.toMatch(/emailed ahead of your session/i);
    expect(src.indexOf("Complete a short assessment")).toBeLessThan(src.indexOf("Pay securely"));
    expect(src).not.toMatch(/confirmation email shows the visit address/);
    expect(src).toMatch(/our receipt email shows the visit address/);
  });

  it("the chat prompt uses the live domain", () => {
    expect(buildSystemPrompt()).not.toMatch(/physioonclick\.com\b/);
    expect(buildSystemPrompt()).toMatch(/physioonclick\.co\.uk/);
  });

  it("blog categories that describe delivery mention Glasgow home visits", () => {
    const src = readFileSync("lib/blog.ts", "utf8");
    expect(src).toMatch(/neurological conditions through video consultations, or home visits in the Glasgow area/);
    expect(src).toMatch(/post-surgery physiotherapy through video consultations, or home visits in the Glasgow area/);
    expect(src).toMatch(/Knee assessments at PhysioOnClick happen by video, or as a home visit in the Glasgow area/);
  });
});

describe("practiceNode home visits", () => {
  const node = practiceNode() as Record<string, any>;

  it("stays UK-wide and publishes no geo", () => {
    expect(JSON.stringify(node.areaServed)).toMatch(/United Kingdom/i);
    expect(node.geo).toBeUndefined();
  });

  it("offers a Glasgow home visit service", () => {
    expect(node.makesOffer.itemOffered.serviceType).toBe("Home visit physiotherapy");
    expect(node.makesOffer.itemOffered.areaServed).toEqual({ "@type": "City", name: "Glasgow" });
    expect(node.availableChannel.map((c: any) => c.serviceType)).toContain("Home visit physiotherapy");
  });
});

// Home visits cost the video price plus a travel fee per visit, and coverage
// is checked from the postcode at booking. Copy written before that change
// said "same prices" and "we'll confirm by email"; none may survive.
describe("home visit pricing and coverage copy", () => {
  const STALE = [
    /same prices?/i,
    /cost the same as video/i,
    /confirm by email if your address/i,
    /confirm by email if an address/i,
    /Home visit \(Glasgow area\)/,
  ];
  const FILES = [
    "app/page.tsx",
    "app/terms/page.tsx",
    "app/glasgow-physiotherapist/page.tsx",
    "app/how-online-physiotherapy-works/page.tsx",
    "app/online-physiotherapy-scotland/page.tsx",
    "app/pricing/page.tsx",
    "lib/site-data.ts",
    "lib/chat-prompt.ts",
    "lib/home-visit.ts",
    "components/chat-widget.tsx",
  ];

  it.each(FILES)("%s has no stale home-visit pricing or confirm-by-email copy", (file) => {
    const src = readFileSync(file, "utf8");
    for (const phrase of STALE) expect(src).not.toMatch(phrase);
  });

  // One price "for both" video and home visits is wrong now that home visits
  // add a travel fee: a "£" or a price expression, then "for both" / "whether
  // you choose" within the same sentence (or the reverse order).
  const SINGLE_PRICE_FOR_BOTH = [
    /(£|\{[^}]*(price|initial)[^}]*\})[^.]{0,80}\b(for both|whether you choose)\b/i,
    /\b(for both|whether you choose)\b[^.]{0,80}(£|\{[^}]*(price|initial)[^}]*\})/i,
  ];

  it.each(FILES)("%s never states one price for both video and home visits", (file) => {
    const src = readFileSync(file, "utf8");
    for (const pattern of SINGLE_PRICE_FOR_BOTH) expect(src).not.toMatch(pattern);
  });

  it.each(FILES)("%s does not limit home visits to the Glasgow area only", (file) => {
    const src = readFileSync(file, "utf8");
    expect(src).not.toMatch(/Glasgow area only|only in the Glasgow area/i);
  });

  it("the chat prompt states the travel fee and the covered area", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain(`plus a ${formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE)} travel fee per visit`);
    expect(prompt).toContain(HOME_VISIT_AREA_LABEL);
    expect(prompt).not.toMatch(/confirm by email/i);
  });

  it("the neuro FAQ's literal travel fee matches the constant", () => {
    // site-data cannot import the constant (import cycle), so pin it here.
    const neuro = services.find((s) => s.slug === "neurological-rehabilitation")!;
    const faq = neuro.faqs.find((f) => /in person/i.test(f.question))!;
    expect(faq.answer).toContain(`video price plus a ${formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE)} travel fee per visit`);
  });

  it("initial assessment and follow-up descriptions are visit-neutral", () => {
    for (const id of ["initial-assessment", "follow-up"]) {
      const item = pricing.find((p) => p.id === id)!;
      expect(item.description).not.toMatch(/video|home visit|Glasgow/i);
    }
  });
});
