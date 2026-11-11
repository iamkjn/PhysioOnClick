import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Page, { metadata } from "@/app/physiotherapy-home-visits-glasgow/page";
import { formatPounds, homeVisitPricePence, sessionPricePence } from "@/lib/home-visit-pricing";

// A home visit has one whole price (lib/home-visit-pricing), never a fee on top.
const home = formatPounds(homeVisitPricePence("initial-assessment"));
const homeFollowUp = formatPounds(homeVisitPricePence("follow-up"));
const video = formatPounds(sessionPricePence("initial-assessment"));

describe("physiotherapy-home-visits-glasgow", () => {
  it("has a home-visit title and description within limits", () => {
    const title = String(metadata.title);
    const desc = String(metadata.description);
    expect(title.length).toBeLessThanOrEqual(65);
    expect(title.toLowerCase()).toContain("home physiotherapy glasgow");
    expect(desc.length).toBeGreaterThanOrEqual(120);
    expect(desc.length).toBeLessThanOrEqual(160);
    expect(desc).toContain(home);
  });

  it("states derived prices, coverage and the safety conditions", () => {
    const text = render(<Page />).container.textContent ?? "";
    expect(text).toMatch(new RegExp(`The initial home assessment is\\s+${home} all in, and follow-ups are ${homeFollowUp}\\.`));
    expect(text).toContain(
      `A home visit is one all-in price: ${home} for the initial assessment and ${homeFollowUp} for a follow-up, with nothing added at checkout (${video} for an assessment by video).`,
    );
    expect(text).not.toMatch(/travel fee/i);
    expect(text).not.toMatch(/assessment price plus/i);
    expect(text).toContain("G1–G53");
    expect(text).toContain("GP or specialist team must confirm");
    expect(text).toContain("responsible adult");
    expect(text).not.toMatch(/same prices|acupuncture is available/i);
  });
});

describe("physiotherapy-home-visits-glasgow 3D explanation", () => {
  it("says a 3D model shows the area involved and the muscles each exercise works", () => {
    const text = render(<Page />).container.textContent ?? "";
    expect(text).toContain("A 3D model of the body on screen, to show you the area involved and the muscles each of your exercises works");
  });
});
