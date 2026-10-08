import { describe, expect, it } from "vitest";
import { EXERCISE_SEARCH_TITLES, exerciseSearchTitle } from "@/lib/exercise-search-titles";
import { getExerciseBySlug } from "@/lib/exercise-library";
import { exerciseWebPage } from "@/lib/structured-data";
import { hasUploadedImage } from "@/lib/exercise-image-prompts";

describe("exercise search titles", () => {
  it("only maps real catalogue slugs", () => {
    for (const slug of Object.keys(EXERCISE_SEARCH_TITLES)) {
      expect(getExerciseBySlug(slug), slug).toBeTruthy();
    }
  });

  it("leads with the searched phrasing and stays under 70 chars", () => {
    expect(exerciseSearchTitle("ankle-pumps-post-surgery", "Ankle Pumps (Post-Surgery)")).toBe(
      "Ankle Pumps After Surgery: How to Do It Properly | PhysioOnClick",
    );
    for (const [slug, name] of Object.entries(EXERCISE_SEARCH_TITLES)) {
      const t = exerciseSearchTitle(slug, name);
      expect(t.startsWith(name)).toBe(true);
      expect(t.length, t).toBeLessThanOrEqual(70);
    }
  });

  it("falls back to the catalogue title for unmapped exercises", () => {
    expect(exerciseSearchTitle("not-mapped", "Calf Raise")).toBe("Calf Raise Exercise: How to Do It Properly | PhysioOnClick");
  });
});

describe("exercise schema image", () => {
  it("declares the real WebP illustration when uploaded", () => {
    const ex = getExerciseBySlug("wall-slide")!;
    expect(hasUploadedImage(ex.id)).toBe(true);
    const page = exerciseWebPage(ex, "/exercises/wall-slide") as Record<string, any>;
    expect(page.name).toBe("Wall Slides Exercise");
    expect(page.image["@type"]).toBe("ImageObject");
    expect(page.image.contentUrl).toMatch(/^https?:\/\/.+\/exercise-images\/.+size=full/);
    expect(page.primaryImageOfPage).toEqual(page.image);
  });
});
