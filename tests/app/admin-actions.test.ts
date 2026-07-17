import { beforeEach, describe, expect, it, vi } from "vitest";

const addMock = vi.fn().mockResolvedValue({ id: "summary-1" });
const updateMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({ admin: true, email: "admin@test" }),
  }),
  getAdminDb: () => ({
    collection: () => ({ add: addMock }),
    doc: () => ({ update: updateMock }),
  }),
  FieldValue: {
    serverTimestamp: vi.fn().mockReturnValue("__SERVER_TIMESTAMP__"),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { publishSummary, type PublishSummaryInput } from "@/app/admin/actions";

const validInput: PublishSummaryInput = {
  bookingId: "booking-1",
  patientId: "patient-1",
  patientType: "self",
  patientName: "Jane Smith",
  workedOn: "Shoulder mobility drills",
  exercises: "Wall slides, band pull-aparts",
  nextSteps: "Increase resistance next session",
  followUpWeeks: 2,
  service: "Follow-up session",
  painScore: 3,
  recoveryPercent: 60,
  sessionOutcome: "improving",
};

describe("publishSummary input validation", () => {
  beforeEach(() => {
    addMock.mockClear();
    updateMock.mockClear();
  });

  it("publishes a valid summary", async () => {
    const result = await publishSummary(validInput, "token");

    expect(result).toEqual({ summaryId: "summary-1" });
    expect(addMock).toHaveBeenCalledOnce();
  });

  it.each([
    ["workedOn over 2000 chars", { workedOn: "x".repeat(2001) }],
    ["exercises over 2000 chars", { exercises: "x".repeat(2001) }],
    ["nextSteps over 2000 chars", { nextSteps: "x".repeat(2001) }],
    ["whitespace-only workedOn", { workedOn: "   " }],
    ["empty exercises", { exercises: "" }],
    ["whitespace-only nextSteps", { nextSteps: " \n " }],
    ["non-integer recoveryPercent", { recoveryPercent: 55.5 }],
    ["recoveryPercent above 100", { recoveryPercent: 101 }],
    ["recoveryPercent below 0", { recoveryPercent: -1 }],
    ["unknown sessionOutcome", { sessionOutcome: "cured" }],
  ])("rejects %s", async (_label, override) => {
    const input = { ...validInput, ...override } as PublishSummaryInput;

    await expect(publishSummary(input, "token")).rejects.toThrow("Invalid summary input");
    expect(addMock).not.toHaveBeenCalled();
  });
});
