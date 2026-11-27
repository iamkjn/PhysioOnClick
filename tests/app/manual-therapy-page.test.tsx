import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Page, { metadata } from "@/app/manual-therapy-glasgow/page";
import sitemap from "@/app/sitemap";
import { buildSystemPrompt } from "@/lib/chat-prompt";
import { formatPounds, homeVisitPricePence } from "@/lib/home-visit-pricing";

// Techniques confirmed by Shivaliba on 2026-11-15. Adding any other technique
// needs her sign-off first.
const TECHNIQUES = ["Joint mobilisation", "Soft tissue work", "Stretching and muscle energy techniques"];
const home = `from ${formatPounds(homeVisitPricePence("initial-assessment"))}`;
const homeFollowUp = `from ${formatPounds(homeVisitPricePence("follow-up"))}`;

function jsonLd(container: HTMLElement) {
  return [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent ?? "{}"));
}

describe("manual-therapy-glasgow metadata", () => {
  it("targets manual therapy in Glasgow within snippet limits, with derived prices", () => {
    const title = String(metadata.title);
    const desc = String(metadata.description);
    expect(title).toBe("Manual Therapy at Home in Glasgow | PhysioOnClick");
    expect(title.length).toBeLessThanOrEqual(60);
    expect(desc.length).toBeGreaterThanOrEqual(120);
    expect(desc.length).toBeLessThanOrEqual(160);
    expect(desc).not.toContain("£");
    expect(desc).toMatch(/joint mobilisation, soft tissue work and stretching/);
  });
});

describe("manual-therapy-glasgow content", () => {
  const text = () => render(<Page />).container.textContent ?? "";

  it("names only the three confirmed techniques", () => {
    const t = text();
    for (const technique of TECHNIQUES) expect(t).toContain(technique);
    expect(t).not.toMatch(/manipulation|dry needling|cupping|acupuncture is available/i);
  });

  it("keeps hands-on treatment to home visits and offers no needles", () => {
    const t = text();
    expect(t).toContain("Video sessions cannot include hands-on treatment");
    expect(t).toContain("We do not offer acupuncture or needles");
    expect(t).toMatch(/always alongside exercise/i);
  });

  it("states the derived all-in home prices with no extra charge", () => {
    const t = text();
    expect(t).toMatch(new RegExp(`assessment is ${home}, and follow-ups are ${homeFollowUp}, with no extra charge`));
    expect(t).not.toMatch(/travel fee/i);
  });

  it("books a home visit and keeps the safety screening", () => {
    const { container } = render(<Page />);
    expect([...container.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toContain("/book?pay=online&visit=home");
    expect(container.textContent).toContain("suspected fracture");
    expect(container.textContent).toContain("GP or specialist team must confirm");
  });

  it("publishes a priced Service, breadcrumbs and FAQ for search engines", () => {
    const blocks = jsonLd(render(<Page />).container);
    const service = blocks.find((b) => b["@type"] === "Service");
    expect(service.serviceType).toBe("Manual therapy");
    expect(service.offers).toBeUndefined();
    expect(blocks.some((b) => b["@type"] === "FAQPage")).toBe(true);
    expect(blocks.some((b) => b["@type"] === "BreadcrumbList")).toBe(true);
  });
});

describe("manual therapy across the site", () => {
  it("is in the sitemap", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls.some((u) => u.endsWith("/manual-therapy-glasgow"))).toBe(true);
  });

  it("is linked from the home, home-visit, Glasgow and pricing pages and the footer", () => {
    for (const file of [
      "app/page.tsx",
      "app/physiotherapy-home-visits-glasgow/page.tsx",
      "app/glasgow-physiotherapist/page.tsx",
      "app/pricing/page.tsx",
      "components/site-footer.tsx",
    ]) {
      expect(readFileSync(file, "utf8")).toContain('href="/manual-therapy-glasgow"');
    }
  });

  it("lets the chat name the confirmed techniques and nothing else", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("joint mobilisation, soft tissue work and assisted stretching");
    expect(prompt).toMatch(/Never claim any other hands-on technique/);
    expect(prompt).toMatch(/never offer acupuncture or needles/);
  });
});
