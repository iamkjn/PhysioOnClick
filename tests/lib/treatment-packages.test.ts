import { describe, expect, it } from "vitest";
import {
  isPhysioManagedAccount,
  daysInclusive,
  formatDateRange,
  isDateKey,
  londonWallTimeToDate,
  packageDatesLabel,
  packageServiceLabel,
  readTreatmentPackage,
  suggestedPackagePricePence,
} from "@/lib/treatment-packages";

describe("suggestedPackagePricePence", () => {
  it("home: assessment £80 then £70 per follow-up", () => {
    expect(suggestedPackagePricePence({ sessions: 7, visitType: "home", includesAssessment: true })).toBe(50000);
    expect(suggestedPackagePricePence({ sessions: 1, visitType: "home", includesAssessment: true })).toBe(8000);
    expect(suggestedPackagePricePence({ sessions: 5, visitType: "home", includesAssessment: false })).toBe(35000);
  });
  it("video: assessment £50 then £40 per follow-up", () => {
    expect(suggestedPackagePricePence({ sessions: 3, visitType: "video", includesAssessment: true })).toBe(13000);
  });
  it("zero sessions is free", () => {
    expect(suggestedPackagePricePence({ sessions: 0, visitType: "home", includesAssessment: true })).toBe(0);
  });
});

describe("dates", () => {
  it("validates real calendar dates only", () => {
    expect(isDateKey("2026-11-15")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("15/11/2026")).toBe(false);
  });
  it("counts days inclusive", () => {
    expect(daysInclusive("2026-11-15", "2026-11-21")).toBe(7);
    expect(daysInclusive("2026-11-21", "2026-11-15")).toBe(0);
  });
  it("formats a range", () => {
    expect(formatDateRange("2026-11-15", "2026-11-21")).toBe("Sun 15 Nov – Sat 21 Nov 2026");
    expect(formatDateRange("", "")).toBe("");
  });
  it("shows a one-day plan as a single date", () => {
    expect(formatDateRange("2026-11-22", "2026-11-22")).toBe("Sun 22 Nov 2026");
  });
  it("converts London wall time in GMT and BST", () => {
    expect(londonWallTimeToDate("2026-11-16", "12:00").toISOString()).toBe("2026-11-16T12:00:00.000Z");
    expect(londonWallTimeToDate("2026-07-01", "12:00").toISOString()).toBe("2026-07-01T11:00:00.000Z");
  });
});

describe("isPhysioManagedAccount", () => {
  it("accepts true, an admin email (older hand-made records) or managedByPhysio; rejects self sign-ups", () => {
    expect(isPhysioManagedAccount({ createdByAdmin: true })).toBe(true);
    expect(isPhysioManagedAccount({ createdByAdmin: "hello@physioonclick.co.uk" })).toBe(true);
    expect(isPhysioManagedAccount({ managedByPhysio: true })).toBe(true);
    expect(isPhysioManagedAccount({ authProvider: "password" })).toBe(false);
    expect(isPhysioManagedAccount({ createdByAdmin: "" })).toBe(false);
    expect(isPhysioManagedAccount(undefined)).toBe(false);
  });
});

describe("readTreatmentPackage", () => {
  it("fills safe defaults for an older manual package", () => {
    const p = readTreatmentPackage("p1", { title: "Home visit treatment plan (7 visits)", totalSessions: 7, usedSessions: 2, remainingSessions: 5, visitType: "home", manual: true });
    expect(p).toMatchObject({ totalSessions: 7, usedSessions: 2, remainingSessions: 5, visitType: "home", paymentStatus: "unpaid", pricePence: 0, startDate: "" });
  });
});

describe("packageServiceLabel (invoice/receipt line)", () => {
  it("keeps a title that already states the count, never doubling it", () => {
    expect(packageServiceLabel("Home visit treatment plan (7 visits)", 7, "home")).toBe(
      "Home visit treatment plan (7 visits)",
    );
    expect(packageServiceLabel("Video plan - 4 sessions", 4)).toBe("Video plan - 4 sessions");
    expect(packageServiceLabel("6 home visits", 6, "home")).toBe("6 home visits");
  });

  it("adds the count when the title does not say it", () => {
    expect(packageServiceLabel("Treatment plan", 7, "home")).toBe("Treatment plan (7 home visits)");
    expect(packageServiceLabel("Treatment plan", 1, "home")).toBe("Treatment plan (1 home visit)");
    expect(packageServiceLabel("Treatment plan", 3)).toBe("Treatment plan (3 sessions)");
    expect(packageServiceLabel("Treatment plan", 0, "home")).toBe("Treatment plan");
  });

  it("falls back to a plain name when the title is blank", () => {
    expect(packageServiceLabel("", 7, "home")).toBe("Treatment plan (7 home visits)");
  });
});

describe("packageDatesLabel (invoice/receipt date column)", () => {
  it("prints a same-month range compactly", () => {
    expect(packageDatesLabel("2026-11-15", "2026-11-21")).toBe("15\u201321 November 2026");
  });
  it("prints both months when the range crosses a month", () => {
    expect(packageDatesLabel("2026-11-28", "2026-12-03")).toBe("28 November \u2013 3 December 2026");
  });
  it("prints both years when the range crosses a year", () => {
    expect(packageDatesLabel("2026-12-28", "2027-01-03")).toBe("28 December 2026 \u2013 3 January 2027");
  });
  it("handles a single day, a start only, and no dates", () => {
    expect(packageDatesLabel("2026-11-15", "2026-11-15")).toBe("15 November 2026");
    expect(packageDatesLabel("2026-11-15", "")).toBe("From 15 November 2026");
    expect(packageDatesLabel("", "")).toBe("");
  });
});
