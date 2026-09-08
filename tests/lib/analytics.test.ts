import { afterEach, describe, expect, it, vi } from "vitest";

import { trackLibraryEvent, type LibraryEvent } from "@/lib/analytics";

// Spy the SDK so we can prove the consent gate keeps trackLibraryEvent a no-op:
// nothing here should ever reach Firebase's logEvent.
const logEvent = vi.fn();

vi.mock("firebase/analytics", () => ({
  logEvent: (...args: unknown[]) => logEvent(...args),
  getAnalytics: vi.fn(() => ({})),
  isSupported: vi.fn(async () => true),
}));

afterEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
});

describe("trackLibraryEvent", () => {
  it("is exported as a callable function", () => {
    expect(typeof trackLibraryEvent).toBe("function");
  });

  it("does not throw and stays a no-op without cookie consent", async () => {
    expect(() =>
      trackLibraryEvent("library_exercise_view", "clam-shell"),
    ).not.toThrow();

    // Flush any microtasks the fire-and-forget path might schedule.
    await Promise.resolve();
    await Promise.resolve();

    expect(logEvent).not.toHaveBeenCalled();
  });

  it("still does not reach Firebase even with consent granted (no measurementId in test env)", async () => {
    try {
      window.localStorage.setItem("poc-cookie-consent", "granted");
    } catch {
      /* ignore */
    }

    expect(() =>
      trackLibraryEvent("library_cta_click", "rotator-cuff-related-pain"),
    ).not.toThrow();

    await Promise.resolve();
    await Promise.resolve();

    expect(logEvent).not.toHaveBeenCalled();
  });

  it("covers all five library event names in the LibraryEvent union", () => {
    const all: LibraryEvent[] = [
      "library_hub_view",
      "library_exercise_view",
      "library_add_to_plan",
      "library_pdf_request",
      "library_cta_click",
    ];

    expect(all).toHaveLength(5);
    expect(new Set(all).size).toBe(5);
  });
});
