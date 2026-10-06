import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Page, { metadata } from "@/app/physiotherapy-home-visits-glasgow/page";
import { formatPounds, HOME_VISIT_TRAVEL_FEE_PENCE, sessionPricePence } from "@/lib/home-visit-pricing";

const home = formatPounds(sessionPricePence("initial-assessment") + HOME_VISIT_TRAVEL_FEE_PENCE);
const fee = formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE);

describe("physiotherapy-home-visits-glasgow", () => {
  it("has a home-visit title and description within limits", () => {
    const title = String(metadata.title);
    const desc = String(metadata.description);
    expect(title.length).toBeLessThanOrEqual(65);
    expect(title.toLowerCase()).toContain("home visits glasgow");
    expect(desc.length).toBeGreaterThanOrEqual(120);
    expect(desc.length).toBeLessThanOrEqual(160);
    expect(desc).toContain(home);
  });

  it("states derived prices, coverage and the safety conditions", () => {
    const text = render(<Page />).container.textContent ?? "";
    expect(text).toContain(`plus a ${fee} travel fee per visit`);
    expect(text).toContain("G1–G53");
    expect(text).toContain("GP or specialist team must confirm");
    expect(text).toContain("responsible adult");
    expect(text).not.toMatch(/same prices|acupuncture is available/i);
  });
});
