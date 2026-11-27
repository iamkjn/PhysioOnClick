import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import TownPage, { generateMetadata, generateStaticParams } from "@/app/physiotherapy-home-visits/[town]/page";
import HubPage from "@/app/physiotherapy-home-visits-glasgow/page";
import GlasgowPage from "@/app/glasgow-physiotherapist/page";
import { HOME_VISIT_DISTRICTS } from "@/lib/home-visit-area";
import { homeVisitPriceRange } from "@/lib/home-visit-pricing";
import { NEURO_CLEARANCE, POSTOP_READINESS, townSeoDescription, townSeoTitle } from "@/lib/home-visit-town-copy";
import { homeVisitTownPath, homeVisitTowns } from "@/lib/home-visit-towns";

const renderTown = async (slug: string) => render(await TownPage({ params: Promise.resolve({ town: slug }) }));
const plain = (s: string | null | undefined) => (s ?? "").replace(/’/g, "'");

describe("lib/home-visit-towns", () => {
  it("only lists towns whose postcode districts we actually visit", () => {
    for (const t of homeVisitTowns) {
      expect(t.districts.length, t.slug).toBeGreaterThan(0);
      for (const d of t.districts) expect(HOME_VISIT_DISTRICTS.has(d), `${t.slug} ${d}`).toBe(true);
    }
  });

  it("has unique slugs and town-specific copy (no swap-the-name paragraphs)", () => {
    const slugs = homeVisitTowns.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const field of ["intro", "localNote"] as const) {
      const values = homeVisitTowns.map((t) => t[field]);
      expect(new Set(values).size, field).toBe(values.length);
    }
    for (const t of homeVisitTowns) {
      expect(t.faqs.length, t.slug).toBeGreaterThan(0);
      expect(t.nearby.length, t.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it("makes no health-board claim for Rutherglen and Cambuslang (sources disagree)", () => {
    const rc = homeVisitTowns.find((t) => t.slug === "rutherglen-cambuslang")!;
    expect(rc.hospital).toBeUndefined();
    expect(rc.nhsggcSelfReferralNote).toBeFalsy();
    expect(JSON.stringify(rc)).not.toMatch(/NHS/);
  });
});

describe("app/physiotherapy-home-visits/[town]", () => {
  it("emits one param per town", () => {
    expect(generateStaticParams()).toEqual(homeVisitTowns.map((t) => ({ town: t.slug })));
  });

  for (const t of homeVisitTowns) {
    it(`builds ${t.slug} metadata within search-result limits`, async () => {
      const meta = await generateMetadata({ params: Promise.resolve({ town: t.slug }) });
      const title = String(meta.title);
      const desc = String(meta.description);
      expect(title).toBe(townSeoTitle(t));
      expect(title.length).toBeLessThanOrEqual(65);
      expect(title).toContain(t.shortName ?? t.name);
      expect(title).not.toContain("£");
      expect(desc).toBe(townSeoDescription(t));
      expect(desc.length).toBeGreaterThanOrEqual(120);
      expect(desc.length).toBeLessThanOrEqual(160);
      expect(desc).not.toContain("£");
      expect(meta.alternates?.canonical).toBe(homeVisitTownPath(t.slug));
    });

    it(`renders ${t.slug} with derived prices, signed-off wording and links`, async () => {
      const { container, unmount } = await renderTown(t.slug);
      const text = plain(container.textContent);
      expect(container.querySelector("h1")?.textContent).toBe(`Physiotherapy home visits in ${t.name}`);
      expect(text).toContain(
        `The initial home assessment is ${homeVisitPriceRange(t.districts).initial} and follow-ups are ${homeVisitPriceRange(t.districts).followUp}. Cash accepted.`,
      );
      expect(text).not.toMatch(/travel fee|assessment price plus/i);
      for (const d of t.districts) expect(text).toContain(d);
      expect(text).toContain(plain(t.intro));
      // Signed-off clearance wording appears verbatim in the FAQ answer.
      expect(text).toContain(`No, you can book directly. ${NEURO_CLEARANCE} ${POSTOP_READINESS}`);
      // Every other town page and the hub are one click away.
      for (const other of homeVisitTowns.filter((o) => o.slug !== t.slug)) {
        expect(container.querySelector(`a[href="${homeVisitTownPath(other.slug)}"]`), other.slug).not.toBeNull();
      }
      expect(container.querySelector('a[href="/physiotherapy-home-visits-glasgow"]')).not.toBeNull();
      expect([...container.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toContain("/book?pay=online&visit=home");
      // Genuine patient reviews are shown (no review schema: self-serving).
      expect(text).toContain("What patients say");
      expect(container.innerHTML).not.toMatch(/aggregateRating/i);
      unmount();
    });

    it(`emits FAQ structured data for ${t.slug} that matches the visible questions`, async () => {
      const { container, unmount } = await renderTown(t.slug);
      const blocks = [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) =>
        JSON.parse(s.textContent ?? "{}"),
      );
      const faq = blocks.find((b) => b["@type"] === "FAQPage");
      const visible = [...container.querySelectorAll(".service-faqs summary")].map((s) => s.textContent);
      // Answers that quote a price are left out of structured data (2026-11-25).
      expect(JSON.stringify(faq)).not.toContain("£");
      for (const q of faq.mainEntity) expect(visible).toContain(q.name);
      const page = blocks.find((b) => b["@type"] === "WebPage");
      expect(page.mainEntity.areaServed).toEqual({ "@type": "City", name: t.name });
      unmount();
    });
  }

  it("links the NHSGGC self-referral page only for towns in that board", async () => {
    for (const t of homeVisitTowns) {
      const { container, unmount } = await renderTown(t.slug);
      const link = container.querySelector('a[href*="nhsggc.scot"]');
      expect(Boolean(link), t.slug).toBe(Boolean(t.nhsggcSelfReferralNote));
      unmount();
    }
  });

  it("404s an unknown town", async () => {
    await expect(TownPage({ params: Promise.resolve({ town: "atlantis" }) })).rejects.toThrow();
    expect(await generateMetadata({ params: Promise.resolve({ town: "atlantis" }) })).toEqual({});
  });
});

describe("town pages are linked from the Glasgow pages", () => {
  it.each([
    ["/physiotherapy-home-visits-glasgow", () => <HubPage />],
    ["/glasgow-physiotherapist", () => <GlasgowPage />],
  ])("%s links every town page", (_, el) => {
    const { container, unmount } = render(el());
    for (const t of homeVisitTowns) {
      expect(container.querySelector(`a[href="${homeVisitTownPath(t.slug)}"]`), t.slug).not.toBeNull();
    }
    unmount();
  });

  it("shows patient reviews on the home-visit hub", () => {
    const { container } = render(<HubPage />);
    expect(container.textContent).toContain("What patients say");
  });
});

describe("sitemap", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("lists every town page", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://physioonclick.co.uk");
    vi.resetModules();
    const sitemap = (await import("@/app/sitemap")).default;
    const urls = (await sitemap()).map((e) => e.url);
    for (const t of homeVisitTowns) expect(urls).toContain(`https://physioonclick.co.uk${homeVisitTownPath(t.slug)}`);
  });
});
