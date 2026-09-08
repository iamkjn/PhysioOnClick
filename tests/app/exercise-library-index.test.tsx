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
import { allConditionSlugs, bodyAreas } from "@/lib/exercise-library";

const SPORTS_AREA = "Sports & return to activity";

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

  it("renders a body-area chip row including the sports area", () => {
    const { container } = render(<ExerciseLibraryIndexPage />);
    const href = `/exercises/area/${encodeURIComponent(SPORTS_AREA)}`;
    const chip = [...container.querySelectorAll("a")].find(
      (a) => a.getAttribute("href") === href,
    );
    expect(chip, "missing chip for the sports area").toBeTruthy();
    expect(chip?.textContent).toContain(SPORTS_AREA);
    // Every body area gets a chip.
    const chipHrefs = new Set(
      [...container.querySelectorAll('a[href^="/exercises/area/"]')].map((a) =>
        a.getAttribute("href"),
      ),
    );
    expect(chipHrefs.size).toBe(bodyAreas().length);
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
  it("generateStaticParams emits one entry per body area", () => {
    expect(areaStaticParams()).toHaveLength(bodyAreas().length);
    expect(areaStaticParams()).toEqual(
      bodyAreas().map((bodyArea) => ({ bodyArea })),
    );
  });

  it("lists exercises and condition hubs for 'Shoulder'", async () => {
    const ui = await AreaPage({
      params: Promise.resolve({ bodyArea: "Shoulder" }),
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

  it("renders the sports area (condition hubs, no direct exercises) without crashing", async () => {
    const ui = await AreaPage({
      params: Promise.resolve({ bodyArea: SPORTS_AREA }),
    });
    const { container } = render(ui);
    expect(
      container.querySelectorAll("a.exlib-cond-card").length,
    ).toBeGreaterThanOrEqual(1);
    expect(container.querySelector("a.exlib-ex-card")).toBeNull();
  });

  it("generateMetadata canonical points to /exercises, not the area URL", async () => {
    const meta = await areaMetadata({
      params: Promise.resolve({ bodyArea: "Shoulder" }),
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
