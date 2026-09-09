import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

// Next.js <Link> renders as a plain <a> in tests - no mock needed.
import ExerciseLibraryIndexPage, {
  generateMetadata as indexMetadata,
} from "@/app/exercises/page";
import AreaPage, {
  generateMetadata as areaMetadata,
  generateStaticParams as areaStaticParams,
} from "@/app/exercises/area/[bodyArea]/page";
import HowWeMakeThisPage from "@/app/exercises/how-we-make-this/page";
import {
  allConditionSlugs,
  BODY_AREAS,
  bodyAreas,
} from "@/lib/exercise-library";

describe("app/exercises index page", () => {
  it("renders 'Exercise library' as the h1", () => {
    const { container } = render(<ExerciseLibraryIndexPage />);
    expect(container.querySelector("h1")?.textContent).toBe("Exercise library");
  });

  it("renders the standing 'get assessed' line with a book link", () => {
    const { container } = render(<ExerciseLibraryIndexPage />);
    expect(container).toHaveTextContent(
      "Always worth getting assessed if you're not sure",
    );
    expect(container.querySelector('a[href="/book"]')).not.toBeNull();
  });

  it("renders the LibrarySearch input (by its aria-label)", () => {
    const { container } = render(<ExerciseLibraryIndexPage />);
    expect(
      container.querySelector(
        'input[aria-label="Search exercises and conditions"]',
      ),
    ).not.toBeNull();
  });

  it("renders one ConditionCard link per condition", () => {
    const { container } = render(<ExerciseLibraryIndexPage />);
    const cards = container.querySelectorAll('a.exlib-cond-card[href^="/exercises/for/"]');
    expect(cards.length).toBe(allConditionSlugs().length);
  });

  it("renders one plain-language chip per curated body area, no sports chip", () => {
    const { container } = render(<ExerciseLibraryIndexPage />);
    const chipHrefs = new Set(
      [...container.querySelectorAll('a[href^="/exercises/area/"]')].map((a) =>
        a.getAttribute("href"),
      ),
    );
    expect(chipHrefs.size).toBe(bodyAreas().length);
    for (const area of BODY_AREAS) {
      const chip = [...container.querySelectorAll("a")].find(
        (a) => a.getAttribute("href") === `/exercises/area/${area.key}`,
      );
      expect(chip, `missing chip for ${area.key}`).toBeTruthy();
      expect(chip?.textContent).toContain(area.label);
    }
    // Sports is condition-led only - no area page, no chip.
    expect([...chipHrefs].some((h) => h?.includes("sport"))).toBe(false);
    for (const href of chipHrefs) {
      expect(href).toMatch(/^\/exercises\/area\/[a-z][a-z-]*[a-z]$/);
    }
  });

  it("renders a prominent [data-body-map] entry point with a link per body area", () => {
    const { container } = render(<ExerciseLibraryIndexPage />);
    const bodyMap = container.querySelector("[data-body-map]");
    expect(bodyMap).not.toBeNull();
    expect(bodyMap?.textContent).toContain("Where does it hurt?");

    const areaLinks = [
      ...bodyMap!.querySelectorAll('a[href^="/exercises/area/"]'),
    ];
    expect(areaLinks.length).toBe(BODY_AREAS.length);

    for (const area of BODY_AREAS) {
      const link = areaLinks.find(
        (a) => a.getAttribute("href") === `/exercises/area/${area.key}`,
      );
      expect(link, `missing body-map link for ${area.key}`).toBeTruthy();
      expect(link?.textContent).toContain(area.label);
    }

    const shoulder = areaLinks.find(
      (a) => a.getAttribute("href") === "/exercises/area/shoulder",
    );
    expect(shoulder?.textContent).toContain("Shoulder");
  });

  it("renders the body map before the LibrarySearch input", () => {
    const { container } = render(<ExerciseLibraryIndexPage />);
    const bodyMap = container.querySelector("[data-body-map]");
    const search = container.querySelector(
      'input[aria-label="Search exercises and conditions"]',
    );
    expect(bodyMap).not.toBeNull();
    expect(search).not.toBeNull();
    expect(
      bodyMap!.compareDocumentPosition(search!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("has no duplicate body-area listing - every area link lives in the body map", () => {
    const { container } = render(<ExerciseLibraryIndexPage />);
    const allAreaLinks = container.querySelectorAll(
      'a[href^="/exercises/area/"]',
    );
    expect(allAreaLinks.length).toBe(BODY_AREAS.length);
    expect(container.querySelectorAll("ul.exlib-chip-row").length).toBeLessThanOrEqual(1);
  });

  it("renders a featured section with at least 4 exercise-card links", () => {
    const { container } = render(<ExerciseLibraryIndexPage />);
    const featured = [...container.querySelectorAll("a.exlib-ex-card")];
    expect(featured.length).toBeGreaterThanOrEqual(4);
    for (const card of featured) {
      expect(card.getAttribute("href")).toMatch(/^\/exercises\/[^/]+$/);
    }
  });

  it("has an id='my-plan' anchor target", () => {
    const { container } = render(<ExerciseLibraryIndexPage />);
    expect(container.querySelector("#my-plan")).not.toBeNull();
  });

  it("has a footer CTA linking to /book", () => {
    const { container } = render(<ExerciseLibraryIndexPage />);
    expect(container.querySelectorAll('a[href="/book"]').length).toBeGreaterThanOrEqual(1);
  });

  it("generateMetadata sets the title and a self canonical", async () => {
    const meta = await indexMetadata();
    expect(meta.title).toBe("Exercise library | PhysioOnClick");
    expect(meta.alternates?.canonical).toBe("/exercises");
  });
});

describe("app/exercises/area/[bodyArea] page", () => {
  it("generateStaticParams emits one kebab-key entry per curated body area", () => {
    expect(areaStaticParams()).toHaveLength(bodyAreas().length);
    expect(areaStaticParams()).toEqual(
      bodyAreas().map((bodyArea) => ({ bodyArea })),
    );
  });

  it("lists exercises and condition hubs for the shoulder area", async () => {
    const ui = await AreaPage({
      params: Promise.resolve({ bodyArea: "shoulder" }),
    });
    const { container } = render(ui);
    expect(container.querySelector("h1")?.textContent).toContain("Shoulder");
    expect(
      container.querySelectorAll("a.exlib-ex-card").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      container.querySelectorAll("a.exlib-cond-card").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders an area with no condition hubs (upper-back) without crashing", async () => {
    const ui = await AreaPage({
      params: Promise.resolve({ bodyArea: "upper-back" }),
    });
    const { container } = render(ui);
    expect(container.querySelector("h1")?.textContent).toContain(
      "Upper back & shoulder blades",
    );
    expect(
      container.querySelectorAll("a.exlib-ex-card").length,
    ).toBeGreaterThanOrEqual(1);
    expect(container.querySelector("a.exlib-cond-card")).toBeNull();
  });

  it("does not emit a sports area page (sports stays condition-led)", async () => {
    await expect(
      AreaPage({ params: Promise.resolve({ bodyArea: "sports" }) }),
    ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
  });

  it("generateMetadata canonical points to /exercises, not the area URL", async () => {
    const meta = await areaMetadata({
      params: Promise.resolve({ bodyArea: "shoulder" }),
    });
    expect(meta.title).toBe("Shoulder exercises | PhysioOnClick");
    expect(meta.alternates?.canonical).toBe("/exercises");
  });

  it("calls notFound() for an unknown body area", async () => {
    await expect(
      AreaPage({ params: Promise.resolve({ bodyArea: "Nonsense Area" }) }),
    ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
  });
});

describe("app/exercises/how-we-make-this page", () => {
  it("renders an h1, the methodology prose and a medical-disclaimer link", () => {
    const { container } = render(<HowWeMakeThisPage />);
    expect(container.querySelector("h1")).not.toBeNull();
    expect(container).toHaveTextContent("clinically reviews every exercise");
    expect(
      container.querySelector('a[href="/medical-disclaimer"]'),
    ).not.toBeNull();
  });
});
