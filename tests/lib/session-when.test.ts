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
