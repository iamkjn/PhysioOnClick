import { describe, expect, it } from "vitest";
import { calSlugFor } from "@/lib/cal-services";

const HOME = "initial-assessment-home-visit-in-glasgow";

describe("calSlugFor", () => {
  it("keeps video bookings on their existing Cal.com event types", () => {
    expect(calSlugFor("initial-assessment")).toBe("initial-online-assessment");
    expect(calSlugFor("initial-assessment", "video")).toBe("initial-online-assessment");
    expect(calSlugFor("follow-up", "video")).toBe("online-follow-up");
    expect(calSlugFor("bundle-4", "video")).toBe("initial-online-assessment");
  });

  it("books a home-visit initial assessment into the Glasgow home-visit event", () => {
    expect(calSlugFor("initial-assessment", "home")).toBe(HOME);
  });

  it("books a home-visit bundle's first session (an initial assessment) into the home-visit event", () => {
    expect(calSlugFor("bundle-4", "home")).toBe(HOME);
    expect(calSlugFor("bundle-8", "home")).toBe(HOME);
  });

  it("books a home-visit follow-up (and a home bundle's later sessions) into the follow-up home-visit event", () => {
    expect(calSlugFor("follow-up", "home")).toBe("follow-up-home-visit-in-glasgow");
  });

  it("ignores anything that isn't exactly 'home'", () => {
    expect(calSlugFor("initial-assessment", "HOME")).toBe("initial-online-assessment");
    expect(calSlugFor("initial-assessment", null)).toBe("initial-online-assessment");
  });
});
