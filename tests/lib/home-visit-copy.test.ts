import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "@/lib/chat-prompt";
import { guides } from "@/lib/guides";
import { onlinePhysioPages } from "@/lib/online-physio-pages";
import { services, pricing } from "@/lib/site-data";
import { practiceNode } from "@/lib/structured-data";

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
];

const PAGE_FILES = [
  "app/page.tsx",
  "app/how-online-physiotherapy-works/page.tsx",
  "app/online-physiotherapy-scotland/page.tsx",
  "app/glasgow-physiotherapist/page.tsx",
  "components/site-footer.tsx",
  "components/chat-widget.tsx",
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
