import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

// Next.js <Link> renders as a plain <a> in tests - no mock needed.
import ExercisePage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/exercises/[slug]/page";
import {
  allExerciseSlugs,
  conditionsForExercise,
  getExerciseBySlug,
  programmesForExercise,
  relatedExercises,
} from "@/lib/exercise-library";
import { formatDosage, resolveDosage } from "@/lib/exercises";

// clam-shell is a real catalogue slug with setup / steps / cues / mistakes and
// a caution as its final `mistakes` entry, so it exercises the safety callout.
const SLUG = "clam-shell";
const exercise = getExerciseBySlug(SLUG)!;

async function renderPage(slug: string) {
  const ui = await ExercisePage({ params: Promise.resolve({ slug }) });
  return render(ui);
}

describe("app/exercises/[slug] generateStaticParams", () => {
  it("emits one { slug } object per catalogue exercise", () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(allExerciseSlugs().length);
    expect(params).toEqual(allExerciseSlugs().map((slug) => ({ slug })));
  });
});

describe("app/exercises/[slug] page", () => {
  it("renders the exercise title as the h1", async () => {
    await renderPage(SLUG);
    expect(
      screen.getByRole("heading", { level: 1, name: /Clam Shell/i }),
    ).toBeInTheDocument();
  });

  it("renders the setup text, an <ol> of every step, and every cue", async () => {
    const { container } = await renderPage(SLUG);

    expect(container).toHaveTextContent(exercise.setup!);

    const orderedLists = container.querySelectorAll("ol");
    expect(orderedLists).toHaveLength(1);
    for (const step of exercise.steps!) {
      expect(orderedLists[0]).toHaveTextContent(step);
    }

    for (const cue of exercise.cues!) {
      expect(container).toHaveTextContent(cue);
    }
  });

  it("shows the ordinary mistakes but lifts the safety line into a [data-safety] callout", async () => {
    const { container } = await renderPage(SLUG);

    const mistakes = exercise.mistakes!;
    const safetyLine = mistakes[mistakes.length - 1];
    const ordinary = mistakes.slice(0, -1);

    const callout = container.querySelector("[data-safety]");
    expect(callout).not.toBeNull();
    expect(callout).toHaveTextContent(safetyLine);

    const mistakeList = container.querySelector("[data-mistakes]");
    expect(mistakeList).not.toBeNull();
    for (const mistake of ordinary) {
      expect(mistakeList).toHaveTextContent(mistake);
    }
    // the safety caution is pulled out, not repeated in the ordinary list
    expect(mistakeList).not.toHaveTextContent(safetyLine);
  });

  it("links to every condition hub the exercise belongs to", async () => {
    const { container } = await renderPage(SLUG);

    const hubs = conditionsForExercise(SLUG);
    expect(hubs.length).toBeGreaterThan(0);
    for (const hub of hubs) {
      expect(
        container.querySelector(`a[href="/exercises/for/${hub.slug}"]`),
        `missing condition-hub link for ${hub.slug}`,
      ).not.toBeNull();
    }
  });

  it("renders the dose string, a TrackedBookLink and an AddToPlanButton", async () => {
    const { container } = await renderPage(SLUG);

    expect(container).toHaveTextContent(formatDosage(resolveDosage(exercise)));
    expect(container.querySelector('a[href="/book"]')).not.toBeNull();
    expect(
      screen.getByRole("button", { name: /add to my plan/i }),
    ).toBeInTheDocument();
  });

  it("renders a related-exercise card per relatedExercises(slug, 4) result", async () => {
    const { container } = await renderPage(SLUG);

    const related = relatedExercises(SLUG, 4);
    expect(related.length).toBeGreaterThan(0);
    for (const rel of related) {
      expect(
        container.querySelector(`a[href="/exercises/${rel.slug}"]`),
        `missing related-exercise card for ${rel.slug}`,
      ).not.toBeNull();
    }
  });

  it("renders the shared [data-safety-note] block in its compact variant", async () => {
    const { container } = await renderPage(SLUG);
    const note = container.querySelector("[data-safety-note]");
    expect(note).not.toBeNull();
    expect(note?.getAttribute("data-variant")).toBe("compact");
    expect(note?.textContent).toContain("Using these exercises safely");
  });

  it("has no video slot in Phase 1 (exerciseVideoObject is always null)", async () => {
    const { container } = await renderPage(SLUG);
    expect(container.querySelector("[data-exercise-video]")).toBeNull();
  });

  it("emits MedicalWebPage + BreadcrumbList JSON-LD", async () => {
    const { container } = await renderPage(SLUG);

    const blocks = [
      ...container.querySelectorAll('script[type="application/ld+json"]'),
    ].map((node) => JSON.parse(node.textContent || "{}"));

    expect(blocks.some((json) => json["@type"] === "MedicalWebPage")).toBe(true);
    expect(blocks.some((json) => json["@type"] === "BreadcrumbList")).toBe(true);
  });

  it("renders the [data-helps-with] chips for an exercise that has helpsWith goals", async () => {
    // one of the competitive-pass records - it carries plain-language helpsWith
    const withGoals = "hip-hitch";
    const ex = getExerciseBySlug(withGoals)!;
    expect(ex.helpsWith?.length).toBeGreaterThan(0);

    const { container } = await renderPage(withGoals);
    const block = container.querySelector("[data-helps-with]");
    expect(block).not.toBeNull();
    expect(block).toHaveTextContent(ex.helpsWith![0]);
  });

  it("omits the [data-helps-with] block for an exercise with no helpsWith", async () => {
    // clam-shell has no helpsWith - the slot should be empty, not a duplicate
    // of the condition pill links below it.
    expect(exercise.helpsWith?.length ?? 0).toBe(0);
    const { container } = await renderPage(SLUG);
    expect(container.querySelector("[data-helps-with]")).toBeNull();
  });

  it("shows a [data-equipment] line with the exercise's kit", async () => {
    const { container } = await renderPage(SLUG);

    const line = container.querySelector("[data-equipment]");
    expect(line).not.toBeNull();
    // clam-shell carries equipment ["Exercise mat"]
    expect(exercise.equipment?.length).toBeGreaterThan(0);
    expect(line).toHaveTextContent("Exercise mat");
  });

  it("lists every programmesForExercise() hub in a [data-programmes] section", async () => {
    const { container } = await renderPage(SLUG);

    const programmes = programmesForExercise(SLUG);
    expect(programmes.length).toBeGreaterThan(0);

    const section = container.querySelector("[data-programmes]");
    expect(section).not.toBeNull();
    for (const { condition } of programmes) {
      expect(
        section!.querySelector(`a[href="/exercises/for/${condition.slug}"]`),
        `missing programme link for ${condition.slug}`,
      ).not.toBeNull();
    }
  });

  it("omits the [data-programmes] section for an exercise in no programme", async () => {
    // smile-mouth-raise appears in no condition programme.
    expect(programmesForExercise("smile-mouth-raise")).toEqual([]);
    const { container } = await renderPage("smile-mouth-raise");
    expect(container.querySelector("[data-programmes]")).toBeNull();
  });

  it("calls notFound() for an unknown slug", async () => {
    await expect(
      ExercisePage({ params: Promise.resolve({ slug: "nope" }) }),
    ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
  });
});

describe("app/exercises/[slug] generateMetadata", () => {
  it("builds a branded title, a relative canonical and a per-exercise OG image", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: SLUG }),
    });

    expect(typeof meta.title).toBe("string");
    expect((meta.title as string).endsWith("| PhysioOnClick")).toBe(true);
    expect(meta.alternates?.canonical).toBe(`/exercises/${SLUG}`);
    expect(JSON.stringify(meta.openGraph?.images)).toContain(
      `/exercise-og/${SLUG}`,
    );
  });

  it("returns an empty object for an unknown slug", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "nope" }),
    });
    expect(meta).toEqual({});
  });
});
