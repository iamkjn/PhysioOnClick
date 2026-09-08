import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import ServiceDetailPage from "@/app/services/[slug]/page";
import { blogArticles } from "@/lib/blog";
import { services } from "@/lib/site-data";
import {
  allConditionSlugs,
  allExerciseSlugs,
  bodyAreas,
  getCondition,
} from "@/lib/exercise-library";

const BASE = "https://physioonclick.co.uk";

// Keep in sync with the `routes` array in app/sitemap.ts. A new static route
// should be a deliberate change that also updates this count.
const STATIC_ROUTE_COUNT = 14;

async function loadSitemap() {
  vi.resetModules();
  const mod = await import("@/app/sitemap");
  return mod.default;
}

async function entries() {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", BASE);
  const sitemap = await loadSitemap();
  return sitemap();
}

describe("app/sitemap.ts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("lists the exercise-library hub and the how-we-make-this page", async () => {
    const urls = (await entries()).map((entry) => entry.url);
    expect(urls).toContain(`${BASE}/exercises`);
    expect(urls).toContain(`${BASE}/exercises/how-we-make-this`);
  });

  it("lists one condition-hub URL per condition, stamped with its review date", async () => {
    const all = await entries();
    for (const slug of allConditionSlugs()) {
      const entry = all.find((item) => item.url === `${BASE}/exercises/for/${slug}`);
      expect(entry, `missing condition hub for ${slug}`).toBeDefined();
      expect(entry?.lastModified).toEqual(new Date(getCondition(slug)!.reviewedOn));
    }
  });

  it("lists one URL per exercise, with no fabricated lastModified", async () => {
    const all = await entries();
    for (const slug of allExerciseSlugs()) {
      const entry = all.find((item) => item.url === `${BASE}/exercises/${slug}`);
      expect(entry, `missing exercise ${slug}`).toBeDefined();
      expect(entry?.lastModified).toBeUndefined();
    }
  });

  it("lists one encoded URL per body area, with no lastModified", async () => {
    const all = await entries();
    for (const area of bodyAreas()) {
      const entry = all.find(
        (item) => item.url === `${BASE}/exercises/area/${encodeURIComponent(area)}`,
      );
      expect(entry, `missing body area ${area}`).toBeDefined();
      expect(entry?.lastModified).toBeUndefined();
    }
  });

  it("adds exactly the exercise-library entries and nothing else", async () => {
    const all = await entries();

    const exerciseLibCount =
      2 + allConditionSlugs().length + allExerciseSlugs().length + bodyAreas().length;

    const exerciseLibEntries = all.filter((item) =>
      item.url.slice(BASE.length).startsWith("/exercises"),
    );
    expect(exerciseLibEntries.length).toBe(exerciseLibCount);

    expect(all.length).toBe(
      STATIC_ROUTE_COUNT + services.length + blogArticles.length + exerciseLibCount,
    );
  });
});

describe("app/services/[slug] exercise-library cross-links", () => {
  it("every service.relatedConditionSlugs entry resolves to a real condition hub", () => {
    for (const service of services) {
      for (const slug of service.relatedConditionSlugs ?? []) {
        expect(getCondition(slug), `${service.slug} -> ${slug}`).not.toBeNull();
      }
    }
  });

  it("renders an /exercises/for/<slug> link per related condition", async () => {
    const service = services.find((item) => item.relatedConditionSlugs?.length);
    expect(service, "expected at least one service with relatedConditionSlugs").toBeDefined();
    const firstSlug = service!.relatedConditionSlugs![0];

    const ui = await ServiceDetailPage({
      params: Promise.resolve({ slug: service!.slug }),
    });
    render(ui);

    const link = screen.getByRole("link", {
      name: new RegExp(`${getCondition(firstSlug)!.name} exercises`, "i"),
    });
    expect(link).toHaveAttribute("href", `/exercises/for/${firstSlug}`);
  });
});
