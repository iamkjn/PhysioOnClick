import { describe, expect, it } from "vitest";
import { bookServiceFor, includedFor, serviceLabelFor } from "@/lib/cal-services";

describe("visit-aware service labels", () => {
  it("keeps the video wording", () => {
    expect(serviceLabelFor("initial-assessment", "video")).toBe("Initial Online Assessment");
    expect(serviceLabelFor("follow-up", undefined)).toBe("Online Follow-Up");
    expect(includedFor("initial-assessment", "video")).toEqual(bookServiceFor("initial-assessment").included);
  });

  it("says home visit, not online or video, for a home visit", () => {
    expect(serviceLabelFor("initial-assessment", "home")).toBe("Initial Assessment (home visit)");
    expect(serviceLabelFor("follow-up", "home")).toBe("Follow-Up (home visit)");
    expect(serviceLabelFor("bundle-4", "home")).toBe("4 Session Bundle (home visit)");
    for (const id of ["initial-assessment", "follow-up", "bundle-4", "bundle-8"] as const) {
      expect(serviceLabelFor(id, "home")).not.toMatch(/online|video/i);
      expect(includedFor(id, "home").join(" ")).not.toMatch(/video/i);
    }
    expect(includedFor("initial-assessment", "home")[0]).toBe("60-minute home visit");
  });

  it("does not change Cal.com event-type slugs", () => {
    expect(bookServiceFor("initial-assessment").calSlug).toBe("initial-online-assessment");
    expect(bookServiceFor("follow-up").calSlug).toBe("online-follow-up");
  });
});
