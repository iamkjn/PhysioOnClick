import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyIdTokenMock = vi.fn();
const getMock = vi.fn();
const updateMock = vi.fn();
const docMock = vi.fn();
const collectionMock = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({ verifyIdToken: (...a: unknown[]) => verifyIdTokenMock(...a) }),
  getAdminDb: () => ({
    collection: (...a: unknown[]) => {
      collectionMock(...a);
      return {
        doc: (...b: unknown[]) => {
          docMock(...b);
          return { get: () => getMock(), update: (data: unknown) => updateMock(data) };
        },
      };
    },
  }),
  FieldValue: {
    serverTimestamp: () => "__SERVER_TIMESTAMP__",
  },
}));

import { setPatientCarerEmails } from "@/app/admin/carer-actions";

function patientDoc(data: Record<string, unknown> | null) {
  return { exists: data !== null, data: () => data ?? undefined };
}

beforeEach(() => {
  verifyIdTokenMock.mockReset().mockResolvedValue({ uid: "admin-uid", admin: true, email: "admin@test" });
  getMock.mockReset().mockResolvedValue(patientDoc({ email: "Pat@Example.com", displayName: "Pat" }));
  updateMock.mockReset().mockResolvedValue(undefined);
  docMock.mockReset();
  collectionMock.mockReset();
});

describe("setPatientCarerEmails", () => {
  it("rejects a missing token without touching Firestore", async () => {
    await expect(setPatientCarerEmails("p1", ["carer@example.com"], "")).rejects.toThrow("Unauthorized");
    expect(verifyIdTokenMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects a token that fails verification", async () => {
    verifyIdTokenMock.mockRejectedValue(new Error("bad signature"));
    await expect(setPatientCarerEmails("p1", ["carer@example.com"], "forged")).rejects.toThrow("Unauthorized");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects a signed-in user who is not the admin", async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: "p1", email: "pat@example.com" });
    await expect(setPatientCarerEmails("p1", ["carer@example.com"], "token")).rejects.toThrow("Unauthorized");
    expect(getMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it.each([
    ["an empty uid", ""],
    ["a uid with a slash", "p1/people/p1"],
    ["a uid over 128 chars", "x".repeat(129)],
  ])("rejects %s", async (_label, uid) => {
    await expect(setPatientCarerEmails(uid, ["carer@example.com"], "token")).rejects.toThrow("Invalid patient id");
    expect(getMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects a patient that doesn't exist", async () => {
    getMock.mockResolvedValue(patientDoc(null));
    await expect(setPatientCarerEmails("missing", ["carer@example.com"], "token")).rejects.toThrow("Patient not found");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("lower-cases, trims and de-duplicates before saving", async () => {
    const saved = await setPatientCarerEmails(
      "p1",
      ["  Carer@Example.com ", "carer@example.com", "", "OTHER@example.com"],
      "token"
    );

    expect(saved).toEqual(["carer@example.com", "other@example.com"]);
    expect(collectionMock).toHaveBeenCalledWith("patients");
    expect(docMock).toHaveBeenCalledWith("p1");
    expect(updateMock).toHaveBeenCalledOnce();
    expect(updateMock).toHaveBeenCalledWith({
      carerEmails: ["carer@example.com", "other@example.com"],
      carerEmailsUpdatedAt: "__SERVER_TIMESTAMP__",
      carerEmailsUpdatedBy: "admin@test",
    });
  });

  it("rejects the patient's own email, whatever its case", async () => {
    await expect(setPatientCarerEmails("p1", ["PAT@example.com"], "token")).rejects.toThrow(/patient's own email/);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid email address", async () => {
    await expect(setPatientCarerEmails("p1", ["not-an-email"], "token")).rejects.toThrow(/not a valid email/);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects more than 5 carers", async () => {
    const six = Array.from({ length: 6 }, (_, i) => `carer${i}@example.com`);
    await expect(setPatientCarerEmails("p1", six, "token")).rejects.toThrow(/at most 5/);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("saves an empty list to remove every carer", async () => {
    const saved = await setPatientCarerEmails("p1", [], "token");
    expect(saved).toEqual([]);
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ carerEmails: [] }));
  });

  it("records the admin's uid when the token carries no email", async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: "admin-uid", admin: true });
    await setPatientCarerEmails("p1", ["carer@example.com"], "token");
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ carerEmailsUpdatedBy: "admin-uid" }));
  });
});
