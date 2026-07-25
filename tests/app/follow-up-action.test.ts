import { beforeEach, describe, expect, it, vi } from "vitest";

const followUpAddMock = vi.fn().mockResolvedValue({ id: "followup-1" });
const notificationAddMock = vi.fn().mockResolvedValue({ id: "notif-1" });
const userGetMock = vi.fn().mockResolvedValue({ data: () => ({ email: "patient@example.com" }) });
const verifyIdTokenMock = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({
    verifyIdToken: (...args: unknown[]) => verifyIdTokenMock(...args),
  }),
  getAdminDb: () => ({
    collection: (path: string) => {
      if (path.endsWith("/followUps")) return { add: followUpAddMock };
      if (path.endsWith("/notifications")) return { add: notificationAddMock };
      throw new Error(`Unexpected collection path: ${path}`);
    },
    doc: (path: string) => {
      if (path.startsWith("users/")) return { get: userGetMock };
      throw new Error(`Unexpected doc path: ${path}`);
    },
  }),
  FieldValue: {
    serverTimestamp: vi.fn().mockReturnValue("__SERVER_TIMESTAMP__"),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Guards against any real network call, in case RESEND_API_KEY is ever set
// in the environment this test runs in — sendFollowUpEmail is best-effort and
// must never be allowed to actually hit the network from a test.
const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
vi.stubGlobal("fetch", fetchMock);

import { scheduleFollowUp, type ScheduleFollowUpInput } from "@/app/admin/actions";

// Far enough in the future to stay valid regardless of when this test runs.
const validInput: ScheduleFollowUpInput = {
  patientUid: "patient-1",
  patientName: "Jane Smith",
  dueDate: "2030-06-15",
  note: "Check knee progress",
  service: "Physiotherapy",
  personId: "person-1",
};

describe("scheduleFollowUp", () => {
  beforeEach(() => {
    followUpAddMock.mockClear();
    notificationAddMock.mockClear();
    userGetMock.mockClear();
    fetchMock.mockClear();
    verifyIdTokenMock.mockReset();
    verifyIdTokenMock.mockResolvedValue({ admin: true, uid: "admin-uid", email: "admin@test" });
    delete process.env.RESEND_API_KEY;
  });

  it("rejects a non-admin idToken and writes nothing", async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ admin: false, email: "notadmin@test" });

    await expect(scheduleFollowUp(validInput, "token")).rejects.toThrow("Unauthorized");
    expect(followUpAddMock).not.toHaveBeenCalled();
    expect(notificationAddMock).not.toHaveBeenCalled();
  });

  it("rejects a non-real calendar date (2026-02-30) and writes nothing", async () => {
    const input = { ...validInput, dueDate: "2026-02-30" };

    await expect(scheduleFollowUp(input, "token")).rejects.toThrow("Invalid follow-up input");
    expect(followUpAddMock).not.toHaveBeenCalled();
  });

  it("rejects a past date and writes nothing", async () => {
    const input = { ...validInput, dueDate: "2000-01-01" };

    await expect(scheduleFollowUp(input, "token")).rejects.toThrow("Invalid follow-up input");
    expect(followUpAddMock).not.toHaveBeenCalled();
  });

  it("writes the followUp and notification docs for valid input", async () => {
    await scheduleFollowUp(validInput, "token");

    expect(followUpAddMock).toHaveBeenCalledOnce();
    expect(notificationAddMock).toHaveBeenCalledOnce();
  });

  it("resolves without throwing when RESEND_API_KEY is unset (email soft-fail)", async () => {
    expect(process.env.RESEND_API_KEY).toBeUndefined();

    await expect(scheduleFollowUp(validInput, "token")).resolves.toBeUndefined();
    // No RESEND_API_KEY means sendFollowUpEmail logs instead of calling fetch.
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
