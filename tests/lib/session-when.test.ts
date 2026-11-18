import { describe, expect, it } from "vitest";
import { isDateOnlyBooking } from "@/lib/patient-bookings";
import { formatSessionWhen } from "@/lib/session-when";

describe("formatSessionWhen", () => {
  const sessionDate = new Date("2026-11-17T18:00:00Z");
  it("shows date and time for normal bookings", () => {
    expect(formatSessionWhen({ sessionDate })).toMatch(/17 Nov 2026.*18:00/);
  });
  it("never shows a time for physio-added (date-only) sessions", () => {
    const out = formatSessionWhen({ sessionDate, dateOnly: true });
    expect(out).toBe("17 Nov 2026");
    expect(out).not.toMatch(/\d{2}:\d{2}/);
  });
  it("treats admin-manual bookings as date-only", () => {
    expect(isDateOnlyBooking({ source: "admin-manual" })).toBe(true);
    expect(isDateOnlyBooking({ dateOnly: true })).toBe(true);
    expect(isDateOnlyBooking({ source: "cal" })).toBe(false);
  });
});

import { selectTargetBooking } from "@/lib/assessment-gate";
describe("assessment gate", () => {
  it("never asks for an assessment for a physio-added (date-only) session", () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(selectTargetBooking([{ id: "a", sessionDate: future, assessmentCompletedAt: null, paid: true, status: "upcoming", dateOnly: true }])).toBeNull();
    expect(selectTargetBooking([{ id: "b", sessionDate: future, assessmentCompletedAt: null, paid: true, status: "upcoming" }])?.id).toBe("b");
  });
});
