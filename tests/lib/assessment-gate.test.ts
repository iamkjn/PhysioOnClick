import { describe, it, expect } from "vitest";
import { selectTargetBooking, type GateBooking } from "@/lib/assessment-gate";

const soon = new Date(Date.now() + 3_600_000);
const later = new Date(Date.now() + 7_200_000);
const mk = (o: Partial<GateBooking>): GateBooking => ({
  id: "x", sessionDate: soon, assessmentCompletedAt: null, paid: true, status: "upcoming", ...o,
});

describe("selectTargetBooking", () => {
  it("returns null when no paid upcoming bookings", () => {
    expect(selectTargetBooking([mk({ paid: false })])).toBeNull();
  });
  it("prefers the requested booking id when eligible", () => {
    const a = mk({ id: "a", sessionDate: soon });
    const b = mk({ id: "b", sessionDate: later });
    expect(selectTargetBooking([a, b], "b")?.id).toBe("b");
  });
  it("falls back to soonest unassessed", () => {
    const done = mk({ id: "a", sessionDate: soon, assessmentCompletedAt: new Date() });
    const open = mk({ id: "b", sessionDate: later });
    expect(selectTargetBooking([done, open])?.id).toBe("b");
  });
});
