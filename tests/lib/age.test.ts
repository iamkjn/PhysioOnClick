import { describe, it, expect } from "vitest";
import { calcAge, formatAge, DEFAULT_DOB } from "@/lib/age";

describe("calcAge", () => {
  const now = new Date("2026-09-09T12:00:00Z");

  it("returns whole years, not yet counting an upcoming birthday", () => {
    expect(calcAge("2000-09-10", now)).toBe(25);
    expect(calcAge("2000-09-09", now)).toBe(26);
    expect(calcAge("2000-01-01", now)).toBe(26);
  });

  it("treats missing / invalid / out-of-range input as unknown", () => {
    expect(calcAge(undefined, now)).toBeNull();
    expect(calcAge("", now)).toBeNull();
    expect(calcAge("not-a-date", now)).toBeNull();
    expect(calcAge("2100-01-01", now)).toBeNull();
  });

  it("formatAge is terse and blank when unknown", () => {
    expect(formatAge("2000-01-01")).toMatch(/^\d+ yrs?$/);
    expect(formatAge(undefined)).toBe("");
  });

  it("DEFAULT_DOB is the documented placeholder", () => {
    expect(DEFAULT_DOB).toBe("2000-01-01");
  });
});
