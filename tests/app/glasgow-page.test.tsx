import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import GlasgowPage, { metadata } from "@/app/glasgow-physiotherapist/page";
import { formatPounds, HOME_VISIT_TRAVEL_FEE_PENCE, sessionPricePence } from "@/lib/home-visit-pricing";

const video = formatPounds(sessionPricePence("initial-assessment"));
const home = formatPounds(sessionPricePence("initial-assessment") + HOME_VISIT_TRAVEL_FEE_PENCE);
const fee = formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE);

describe("glasgow-physiotherapist metadata", () => {
  it("targets Glasgow home visits within length limits", () => {
    const title = String(metadata.title);
    const desc = String(metadata.description);
    expect(title.length).toBeLessThanOrEqual(65);
    expect(title.endsWith("| PhysioOnClick")).toBe(true);
    expect(title.toLowerCase()).toContain("glasgow");
    expect(title.toLowerCase()).toContain("home visits");
    expect(desc.length).toBeGreaterThanOrEqual(120);
    expect(desc.length).toBeLessThanOrEqual(160);
  });

  it("quotes the video and home-visit assessment prices separately", () => {
    const desc = String(metadata.description);
    expect(desc).toContain(`${video} video assessment`);
    expect(desc).toContain(`${home} home visit`);
  });
});

describe("glasgow-physiotherapist home-visit pricing copy", () => {
  it("states the travel fee and both prices in the page and the visible FAQ", () => {
    const { container } = render(<GlasgowPage />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/same prices|cost the same as video|confirm by email/i);
    expect(text).toContain(`${video} by video`);
    expect(text).toContain(`${home} as a home visit`);
    expect(text).toContain(`plus a ${fee} travel fee per visit`);
    expect(text).toContain("Home visit in Glasgow");
    expect(text).toContain("How much does a home visit cost?");
  });

  it("emits no FAQPage JSON-LD (global constraint: no FAQPage schema)", () => {
    const { container } = render(<GlasgowPage />);
    const scripts = [...container.querySelectorAll('script[type="application/ld+json"]')];
    expect(scripts.some((s) => JSON.parse(s.textContent ?? "{}")["@type"] === "FAQPage")).toBe(false);
  });
});
