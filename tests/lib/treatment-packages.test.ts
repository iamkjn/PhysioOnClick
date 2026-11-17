import { describe, expect, it } from "vitest";
import {
  daysInclusive,
  formatDateRange,
  isDateKey,
  londonWallTimeToDate,
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
  it("converts London wall time in GMT and BST", () => {
    expect(londonWallTimeToDate("2026-11-16", "12:00").toISOString()).toBe("2026-11-16T12:00:00.000Z");
    expect(londonWallTimeToDate("2026-07-01", "12:00").toISOString()).toBe("2026-07-01T11:00:00.000Z");
  });
});

describe("readTreatmentPackage", () => {
  it("fills safe defaults for an older manual package", () => {
    const p = readTreatmentPackage("p1", { title: "Home visit treatment plan (7 visits)", totalSessions: 7, usedSessions: 2, remainingSessions: 5, visitType: "home", manual: true });
    expect(p).toMatchObject({ totalSessions: 7, usedSessions: 2, remainingSessions: 5, visitType: "home", paymentStatus: "unpaid", pricePence: 0, startDate: "" });
  });
});
