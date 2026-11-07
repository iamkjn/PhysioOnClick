import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
// Hero auth observer: never resolves, so the marketing hero stays rendered.
vi.mock("@/lib/firebase", () => ({ auth: {} }));
vi.mock("firebase/auth", () => ({ onAuthStateChanged: () => () => {} }));
vi.mock("@/components/home-dashboard", () => ({ HomeDashboard: () => <div>Dashboard</div> }));
// Async server component; not what this test is about.
vi.mock("@/components/trustpilot-reviews", () => ({ TrustpilotReviews: () => null }));

import HomePage, { metadata } from "@/app/page";
import { formatPounds, sessionPricePence, travelFeePence } from "@/lib/home-visit-pricing";

const video = formatPounds(sessionPricePence("initial-assessment"));
const home = formatPounds(sessionPricePence("initial-assessment") + travelFeePence("initial-assessment", "home"));

describe("homepage metadata", () => {
  const title = String(metadata.title);
  const description = String(metadata.description);

  it("leads the title with Glasgow home visits and neuro rehab", () => {
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title).toMatch(/^Physio Home Visits in Glasgow/);
    expect(title).toMatch(/Neuro Rehab/);
    expect(title).not.toMatch(/Online Physiotherapy UK/);
  });

  it("puts home visits first and video across the UK second, with derived prices", () => {
    expect(description.length).toBeGreaterThanOrEqual(120);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toContain(`${home} home assessment`);
    expect(description).toContain(`${video} by video`);
    expect(description.indexOf("home visits in Glasgow")).toBeGreaterThanOrEqual(0);
    expect(description.indexOf("home visits in Glasgow")).toBeLessThan(description.indexOf("video"));
    expect(description).toMatch(/stroke, Parkinson's, MS and FND/);
  });

  it("uses the same wording for link previews", () => {
    const og = metadata.openGraph as { title?: string; description?: string; url?: string };
    const twitter = metadata.twitter as { title?: string; description?: string };
    expect(og.title).toBe(title);
    expect(og.description).toBe(description);
    expect(og.url).toBe("/");
    expect(twitter.title).toBe(title);
    expect(twitter.description).toBe(description);
  });

  it("never implies a clinic or premises", () => {
    for (const text of [title, description]) {
      expect(text).not.toMatch(/clinic|premises|visit us|our practice in/i);
    }
  });
});

describe("homepage hero", () => {
  it("passes the derived home-visit and video prices into the hero", async () => {
    const { container } = render(await HomePage());
    const hero = container.querySelector(".home-hero");
    expect(hero?.textContent).toContain(`Home assessment ${home}`);
    expect(hero?.textContent).toContain(`${video} by video`);
  });
});
