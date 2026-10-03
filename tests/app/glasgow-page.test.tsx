import { describe, it, expect } from "vitest";
import { metadata } from "@/app/glasgow-physiotherapist/page";

describe("glasgow-physiotherapist metadata", () => {
  it("targets Glasgow home visits within length limits", () => {
    const title = String(metadata.title);
    const desc = String(metadata.description);
    expect(title.length).toBeLessThanOrEqual(65);
    expect(title.endsWith("| PhysioOnClick")).toBe(true);
    expect(title.toLowerCase()).toContain("glasgow");
    expect(title.toLowerCase()).toContain("home visits");
    expect(desc.length).toBeGreaterThanOrEqual(120);
    expect(desc.length).toBeLessThanOrEqual(160);
  });
});
