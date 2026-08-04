import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.fn();
const update = vi.fn(async () => {});
const get = vi.fn();
const assessmentGet = vi.fn(async () => ({ exists: true }));

const db = {
  collection: vi.fn((name: string) => {
    if (name === "bookings") {
      return { doc: vi.fn(() => ({ get, update })) };
    }
    if (name === "patients") {
      return {
        doc: vi.fn(() => ({
          collection: vi.fn(() => ({
            doc: vi.fn(() => ({
              collection: vi.fn(() => ({
                doc: vi.fn(() => ({ get: assessmentGet })),
              })),
            })),
          })),
        })),
      };
    }
    return { doc: vi.fn(() => ({ get, update })) };
  }),
};

vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({ verifyIdToken }),
  getAdminDb: () => db,
  FieldValue: { serverTimestamp: () => "TS" },
}));

import { POST } from "@/app/api/patient/assessment/link/route";

function req(token: string | null, body: unknown) {
  return new Request("http://localhost/api/patient/assessment/link", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  verifyIdToken.mockReset();
  update.mockReset();
  get.mockReset();
  assessmentGet.mockReset();
  assessmentGet.mockResolvedValue({ exists: true });
});

describe("POST /api/patient/assessment/link", () => {
  it("returns 401 without a token", async () => {
    const res = await POST(req(null, {}));
    expect(res.status).toBe(401);
  });

  it("returns 401 for an invalid token", async () => {
    verifyIdToken.mockRejectedValue(new Error("bad token"));
    const res = await POST(req("bad", { bookingId: "b1", assessmentFormId: "f1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when fields are missing", async () => {
    verifyIdToken.mockResolvedValue({ uid: "u1" });
    const res = await POST(req("t", { bookingId: "b1" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the booking does not exist", async () => {
    verifyIdToken.mockResolvedValue({ uid: "u1" });
    get.mockResolvedValue({ exists: false, data: () => undefined });
    const res = await POST(req("t", { bookingId: "b1", assessmentFormId: "f1" }));
    expect(res.status).toBe(404);
  });

  it("returns 403 for a non-owner", async () => {
    verifyIdToken.mockResolvedValue({ uid: "u2" });
    get.mockResolvedValue({ exists: true, data: () => ({ bookedBy: "u1" }) });
    const res = await POST(req("t", { bookingId: "b1", assessmentFormId: "f1" }));
    expect(res.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("returns 200 and stamps the booking for the owner", async () => {
    verifyIdToken.mockResolvedValue({ uid: "u1" });
    get.mockResolvedValue({ exists: true, data: () => ({ bookedBy: "u1", patientId: "self" }) });
    assessmentGet.mockResolvedValue({ exists: true });
    const res = await POST(req("t", { bookingId: "b1", assessmentFormId: "f1" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ assessmentFormId: "f1", assessmentCompletedAt: "TS" });
  });

  it("does not stamp when the assessment doc does not exist under the booking's person", async () => {
    verifyIdToken.mockResolvedValue({ uid: "u1" });
    get.mockResolvedValue({ exists: true, data: () => ({ bookedBy: "u1", patientId: "self" }) });
    assessmentGet.mockResolvedValue({ exists: false });
    const res = await POST(req("t", { bookingId: "b1", assessmentFormId: "f1" }));
    expect([400, 404]).toContain(res.status);
    expect(update).not.toHaveBeenCalled();
  });
});
