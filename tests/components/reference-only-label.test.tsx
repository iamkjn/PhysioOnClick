// Round-2 clinical sign-off Q2 (Shivaliba Zala, 2026-10-04): "keep this label
// to all exercises". Every exercise in the library - detail pages, cards in
// hubs, lists and area pages, the browser preview and the embed - carries the
// same "For reference only" label from lib/exercise-disclaimer.ts.
import { describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";

import ExercisePage from "@/app/exercises/[slug]/page";
import ConditionHubPage from "@/app/exercises/for/[condition]/page";
import AreaPage from "@/app/exercises/area/[bodyArea]/page";
import ExerciseLibraryIndexPage from "@/app/exercises/page";
import { ExerciseCard } from "@/components/exercise-library/exercise-card";
import { ExerciseBrowser } from "@/components/exercise-library/exercise-browser";
import { ReferenceOnlyBadge, ReferenceOnlyNote } from "@/components/exercise-library/reference-only-label";
import { REFERENCE_ONLY_LABEL, REFERENCE_ONLY_NOTE } from "@/lib/exercise-disclaimer";
import { renderEmbedHtml } from "@/lib/exercise-embed";
import { allConditionSlugs, allExerciseSlugs, bodyAreas, getExerciseBySlug } from "@/lib/exercise-library";
import { exercises } from "@/lib/exercises";

const badges = (root: ParentNode) => root.querySelectorAll("[data-reference-only]");

describe("reference-only label: single source", () => {
  it("states the label and the one-line note", () => {
    expect(REFERENCE_ONLY_LABEL).toBe("For reference only");
    expect(REFERENCE_ONLY_NOTE).toBe(
      "For reference only. Follow the advice of a physiotherapist who has assessed you.",
    );
    expect([...REFERENCE_ONLY_NOTE].every((ch) => ch.codePointAt(0)! <= 0x7f)).toBe(true);
  });
  it("the badge and note render the shared text", () => {
    const badge = render(<ReferenceOnlyBadge />).container;
    expect(badge.querySelector("[data-reference-only]")?.textContent).toBe(REFERENCE_ONLY_LABEL);
    cleanup();
    const note = render(<ReferenceOnlyNote />).container;
    expect(note.querySelector("[data-reference-only]")?.textContent).toBe(REFERENCE_ONLY_LABEL);
    expect(note.textContent).toContain("Follow the advice of a physiotherapist who has assessed you.");
  });
});

describe("reference-only label: every exercise card", () => {
  it("every catalogue exercise card carries the badge", () => {
    for (const exercise of exercises) {
      const { container } = render(<ExerciseCard exercise={exercise} />);
      expect(badges(container).length, exercise.slug).toBe(1);
      cleanup();
    }
  });
  it("every card on every condition hub carries the badge", async () => {
    for (const condition of allConditionSlugs()) {
      const { container } = render(await ConditionHubPage({ params: Promise.resolve({ condition }) }));
      const cards = container.querySelectorAll(".exlib-ex-card");
      expect(cards.length, condition).toBeGreaterThan(0);
      for (const card of cards) expect(badges(card).length, condition).toBe(1);
      cleanup();
    }
  });
  it("every card on every body-area page and the library index carries the badge", async () => {
    for (const area of bodyAreas()) {
      const { container } = render(await AreaPage({ params: Promise.resolve({ bodyArea: area }) }));
      for (const card of container.querySelectorAll(".exlib-ex-card")) expect(badges(card).length, area).toBe(1);
      cleanup();
    }
    const { container } = render(<ExerciseLibraryIndexPage />);
    for (const card of container.querySelectorAll(".exlib-ex-card")) expect(badges(card).length).toBe(1);
  });
  it("the browser preview carries the note and every row and suggestion carries the badge", () => {
    const { container } = render(<ExerciseBrowser exercises={exercises} conditionSlugsBySlug={{}} />);
    expect(container.querySelector(".exlib-browser__detail")?.textContent).toContain(REFERENCE_ONLY_NOTE.split(". ")[1]);
    for (const row of container.querySelectorAll(".exlib-browser__row")) expect(badges(row).length).toBe(1);
    for (const card of container.querySelectorAll(".exlib-browser__suggested-card")) expect(badges(card).length).toBe(1);
  });
});

describe("reference-only label: every exercise page and embed", () => {
  it("every exercise detail page shows the label and the note", async () => {
    for (const slug of allExerciseSlugs()) {
      const { container } = render(await ExercisePage({ params: Promise.resolve({ slug }) }));
      const note = container.querySelector("[data-reference-only-note]");
      expect(note, slug).not.toBeNull();
      expect(note!.textContent, slug).toContain(REFERENCE_ONLY_LABEL);
      expect(note!.textContent, slug).toContain("Follow the advice of a physiotherapist who has assessed you.");
      cleanup();
    }
  }, 60_000);
  it("every embed carries the note", () => {
    for (const slug of allExerciseSlugs()) {
      expect(renderEmbedHtml(getExerciseBySlug(slug)!), slug).toContain(REFERENCE_ONLY_NOTE);
    }
  });
});
