import { beforeEach, describe, expect, it, vi } from "vitest";

const getDocsMock = vi.fn();
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "sessionSummaries"),
  query: vi.fn(() => "q"),
  where: vi.fn(),
  limit: vi.fn(),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
}));
vi.mock("@/lib/firebase", () => ({ db: {}, auth: null, storage: null }));
vi.mock("@/lib/patient-bookings", () => ({ getPatientBookings: vi.fn() }));

import { getSessionSummary } from "@/lib/session-summaries";

function snapWith(data: Record<string, unknown>) {
  return { empty: false, docs: [{ id: "sum-1", data: () => data }] };
}

const base = { bookingId: "b-1", patientName: "Jane Doe", workedOn: "", exercises: "", nextSteps: "" };

describe("getSessionSummary", () => {
  beforeEach(() => getDocsMock.mockReset());

  it("marks a summary whose plan PDF has been stored", async () => {
    getDocsMock.mockResolvedValueOnce(snapWith({ ...base, planPdfPath: "exercise-plans/sum-1.pdf" }));
    const summary = await getSessionSummary("b-1");
    expect(summary?.id).toBe("sum-1");
    expect(summary?.hasPlanPdf).toBe(true);
  });

  it("marks a summary without a stored plan PDF", async () => {
    getDocsMock.mockResolvedValueOnce(snapWith(base));
    const summary = await getSessionSummary("b-1");
    expect(summary?.hasPlanPdf).toBe(false);
  });
});
