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
import { formatPounds, homeVisitPricePence, sessionPricePence } from "@/lib/home-visit-pricing";

// A home visit has one whole price (lib/home-visit-pricing), never a fee on top.
const video = formatPounds(sessionPricePence("initial-assessment"));
const home = formatPounds(homeVisitPricePence("initial-assessment"));
const homeFollowUp = formatPounds(homeVisitPricePence("follow-up"));

describe("homepage metadata", () => {
  const title = String(metadata.title);
  const description = String(metadata.description);

  it("leads the title with physio at home in Glasgow and neuro rehab", () => {
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title).toMatch(/^Physio at Home in Glasgow/);
    expect(title).toMatch(/Neuro Rehab/);
    expect(title).not.toMatch(/Online Physiotherapy UK/);
  });

  it("puts home visits first and video across the UK second, with derived prices", () => {
    expect(description.length).toBeGreaterThanOrEqual(120);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toContain(`${home} home assessment`);
    expect(description).toContain(`${video} by video`);
    expect(description.indexOf("Home physiotherapy in Glasgow")).toBe(0);
    expect(description.indexOf(`${home} home assessment`)).toBeLessThan(description.indexOf(`${video} by video`));
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

describe("homepage home-visit pricing", () => {
  it("quotes the whole home-visit prices in the in-person FAQ, with no travel fee", async () => {
    const { container } = render(await HomePage());
    const faq = [...container.querySelectorAll("details")].find((d) =>
      /Can I be seen in person\?/.test(d.querySelector("summary")?.textContent ?? ""),
    );
    expect(faq).toBeDefined();
    expect(faq!.textContent).toContain(
      `A home visit is ${home} for the initial assessment and ${homeFollowUp} for a follow-up, all in`,
    );
    expect(faq!.textContent).not.toMatch(/travel fee|video price plus/i);
  });

  it("never mentions a travel fee anywhere on the page", async () => {
    const { container } = render(await HomePage());
    expect(container.textContent).not.toMatch(/travel fee/i);
  });
});

describe("homepage evenings, weekends and family", () => {
  it("leads the snippet with evenings and weekends", () => {
    expect(String(metadata.description)).toContain("on weekday evenings and weekends");
  });

  it("shows the two selling points right after the trust bar", async () => {
    const { container } = render(await HomePage());
    const section = container.querySelector(".home-week-section");
    expect(section).not.toBeNull();
    const text = section!.textContent ?? "";
    expect(text).toContain("Evenings and weekends");
    expect(text).toContain("on weekday evenings from 6pm to 9pm, and on Saturdays and Sundays from 9am to 7pm");
    expect(text).toContain("We teach the family too");
    // It sits above "Meet your physiotherapist", so it is the first thing after the trust bar.
    const all = container.textContent ?? "";
    expect(all.indexOf("We teach the family too")).toBeLessThan(all.indexOf("Meet your physiotherapist"));
    expect(section!.querySelector('a[href="/book?visit=home"]')).not.toBeNull();
    expect(section!.querySelector('a[href="/services/neurological-rehabilitation"]')).not.toBeNull();
  });

  it("answers when appointments are, including the 24-hour home-visit notice", async () => {
    const { container } = render(await HomePage());
    const faq = [...container.querySelectorAll("details")].find((d) =>
      /When are appointments available\?/.test(d.querySelector("summary")?.textContent ?? ""),
    );
    expect(faq?.textContent).toContain("Home visits need booking at least 24 hours ahead.");
  });

  it("lists evenings and weekends in the trust bar", async () => {
    const { container } = render(await HomePage());
    expect(container.querySelector(".trust-bar")?.textContent).toContain("Evenings & weekends");
  });
});
