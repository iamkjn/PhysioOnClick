import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ db: null }));

import { pageLabel } from "@/components/admin-growth-dashboard";

describe("pageLabel", () => {
  it("names the home page instead of showing '/'", () => {
    expect(pageLabel("/")).toBe("Home");
  });

  it("names the booking pages", () => {
    expect(pageLabel("/book")).toBe("Booking");
    expect(pageLabel("/book/success")).toBe("Booking Success");
    expect(pageLabel("/book/receipt/cs_test_123")).toBe("Booking Receipt");
  });

  it("names services, blog posts and exercises by their slug", () => {
    expect(pageLabel("/services")).toBe("Services");
    expect(pageLabel("/services/musculoskeletal-physiotherapy")).toBe("Service: Musculoskeletal Physiotherapy");
    expect(pageLabel("/blog")).toBe("Blog");
    expect(pageLabel("/blog/knee-pain-stairs")).toBe("Blog: Knee Pain Stairs");
    expect(pageLabel("/exercises")).toBe("Exercise Library");
    expect(pageLabel("/exercises/tyler-twist-flexbar")).toBe("Exercise: Tyler Twist Flexbar");
  });

  it("names the exercise library's area, condition and self-test pages", () => {
    expect(pageLabel("/exercises/area/knee")).toBe("Exercise Area: Knee");
    expect(pageLabel("/exercises/for/frozen-shoulder")).toBe("Condition Exercises: Frozen Shoulder");
    expect(pageLabel("/exercises/tests")).toBe("Self-test Library");
    expect(pageLabel("/exercises/tests/single-leg-balance")).toBe("Self-test: Single Leg Balance");
  });

  it("groups the patient portal and falls back to the last path segment", () => {
    expect(pageLabel("/patient/appointments")).toBe("Patient Portal");
    expect(pageLabel("/contact")).toBe("Contact");
    expect(pageLabel("/glasgow-physiotherapist")).toBe("Glasgow Physiotherapist");
  });
});
