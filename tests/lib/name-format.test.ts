import { describe, expect, it } from "vitest";

import { formatPersonName } from "@/lib/name-format";

describe("formatPersonName", () => {
  it("capitalizes ordinary first and last names", () => {
    expect(formatPersonName("krunal nayak")).toBe("Krunal Nayak");
    expect(formatPersonName("  jANE   DOE  ")).toBe("Jane Doe");
  });

  it("handles hyphenated and apostrophe names", () => {
    expect(formatPersonName("mary-jane o'neill")).toBe("Mary-Jane O'Neill");
  });

  it("does not try to title-case email fallbacks", () => {
    expect(formatPersonName("krunal@example.com")).toBe("krunal@example.com");
  });
});
