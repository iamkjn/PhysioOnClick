import { describe, expect, it } from "vitest";

import { dayLabel, daysBetween, isDayKey, londonDayKey, londonDayRange, shiftDayKey } from "@/lib/growth-day";

describe("growth days (UK midnight to midnight)", () => {
  it("covers a winter (GMT) day exactly midnight to midnight UTC", () => {
    expect(londonDayRange("2026-11-23")).toEqual({
      startIso: "2026-11-23T00:00:00.000Z",
      endIso: "2026-11-24T00:00:00.000Z",
    });
  });

  it("starts a summer (BST) day at 23:00 UTC the evening before", () => {
    expect(londonDayRange("2026-07-15")).toEqual({
      startIso: "2026-07-14T23:00:00.000Z",
      endIso: "2026-07-15T23:00:00.000Z",
    });
  });

  it("makes the clocks-forward day 23 hours and the clocks-back day 25 hours", () => {
    expect(londonDayRange("2026-03-29")).toEqual({
      startIso: "2026-03-29T00:00:00.000Z",
      endIso: "2026-03-29T23:00:00.000Z",
    });
    expect(londonDayRange("2026-10-25")).toEqual({
      startIso: "2026-10-24T23:00:00.000Z",
      endIso: "2026-10-26T00:00:00.000Z",
    });
  });

  it("puts a late-evening summer visit on the next UK day", () => {
    expect(londonDayKey(new Date("2026-07-14T23:30:00.000Z"))).toBe("2026-07-15");
    expect(londonDayKey(new Date("2026-11-23T23:59:00.000Z"))).toBe("2026-11-23");
    expect(londonDayKey(new Date("2026-11-24T00:00:00.000Z"))).toBe("2026-11-24");
  });

  it("steps days across month and year ends", () => {
    expect(shiftDayKey("2026-11-30", 1)).toBe("2026-12-01");
    expect(shiftDayKey("2027-01-01", -1)).toBe("2026-12-31");
    expect(daysBetween("2026-11-20", "2026-11-23")).toBe(3);
    expect(daysBetween("2026-11-23", "2026-11-20")).toBe(-3);
  });

  it("only accepts real dates as day keys", () => {
    expect(isDayKey("2026-11-23")).toBe(true);
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("23/11/2026")).toBe(false);
    expect(isDayKey(undefined)).toBe(false);
  });

  it("names today and yesterday, and dates further back", () => {
    expect(dayLabel("2026-11-23", "2026-11-23")).toBe("Today");
    expect(dayLabel("2026-11-22", "2026-11-23")).toBe("Yesterday");
    expect(dayLabel("2026-11-20", "2026-11-23")).toBe("Fri 20 Nov 2026");
  });
});
