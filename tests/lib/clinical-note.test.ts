import { describe, expect, it } from "vitest";
import { formatClinicalNote } from "@/lib/clinical-note";

describe("formatClinicalNote", () => {
  it("capitalizes the first letter and adds a trailing full stop", () => {
    expect(formatClinicalNote("initial assessment of foot pain")).toBe(
      "Initial assessment of foot pain."
    );
  });

  it("leaves text that already ends with terminal punctuation alone", () => {
    expect(formatClinicalNote("See the exercises assigned to you in the app.")).toBe(
      "See the exercises assigned to you in the app."
    );
    expect(formatClinicalNote("Is that clear?")).toBe("Is that clear?");
    expect(formatClinicalNote("Great work!")).toBe("Great work!");
  });

  it("trims surrounding whitespace", () => {
    expect(formatClinicalNote("  needs a trim  ")).toBe("Needs a trim.");
  });

  it("returns an empty string unchanged", () => {
    expect(formatClinicalNote("")).toBe("");
    expect(formatClinicalNote("   ")).toBe("");
  });
});
