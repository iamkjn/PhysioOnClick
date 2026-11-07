import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import GlasgowPage, { metadata } from "@/app/glasgow-physiotherapist/page";
import { formatPounds, homeVisitPricePence, sessionPricePence } from "@/lib/home-visit-pricing";

// A home visit has one whole price (lib/home-visit-pricing), never a fee on top.
const video = formatPounds(sessionPricePence("initial-assessment"));
const home = formatPounds(homeVisitPricePence("initial-assessment"));
const homeFollowUp = formatPounds(homeVisitPricePence("follow-up"));

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
  it("states the whole home-visit prices and the video price in the page and the visible FAQ", () => {
    const { container } = render(<GlasgowPage />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/same prices|cost the same as video|confirm by email/i);
    expect(text).toContain(`The initial assessment is ${home} as a home visit, all in, or ${video} by video.`);
    expect(text).toContain(`A home visit is one all-in price: ${home} for the initial assessment and ${homeFollowUp} for a follow-up, with nothing added at checkout.`);
    expect(text).toMatch(new RegExp(`A home visit is ${home} for the initial assessment and ${homeFollowUp} for a follow-up\\. That\\s+is the whole price, with nothing added at checkout\\.`));
    expect(text).toContain("The same booking flow for both, with one all-in price for each");
    expect(text).toContain("Home visit in Glasgow");
    expect(text).toContain("How much does a home visit cost?");
  });

  it("never mentions a travel fee or prices a home visit as video plus extra", () => {
    const { container } = render(<GlasgowPage />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/travel fee/i);
    expect(text).not.toMatch(/video (appointment )?price plus/i);
    expect(String(metadata.description)).not.toMatch(/travel/i);
  });

  it("emits no FAQPage JSON-LD (global constraint: no FAQPage schema)", () => {
    const { container } = render(<GlasgowPage />);
    const scripts = [...container.querySelectorAll('script[type="application/ld+json"]')];
    expect(scripts.some((s) => JSON.parse(s.textContent ?? "{}")["@type"] === "FAQPage")).toBe(false);
  });
});
