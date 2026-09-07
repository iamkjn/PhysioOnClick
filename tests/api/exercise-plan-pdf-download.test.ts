import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.fn();
const downloadObject = vi.fn();

let summarySnap: { exists: boolean; data: () => unknown };
let bookingSnap: { exists: boolean; data: () => unknown };

const db = {
  collection: (name: string) => ({
    doc: () => ({
      get: async () => (name === "sessionSummaries" ? summarySnap : bookingSnap),
    }),
  }),
};

vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({ verifyIdToken }),
  getAdminDb: () => db,
  downloadObject: (...a: unknown[]) => downloadObject(...a),
}));

vi.stubEnv("ADMIN_EMAIL", "hello@physioonclick.co.uk");

import { GET } from "@/app/api/exercise-plan/[summaryId]/pdf/route";

const bareReq = () => new Request("http://localhost/api/exercise-plan/s1/pdf");
const authReq = () =>
  new Request("http://localhost/api/exercise-plan/s1/pdf", {
    headers: { Authorization: "Bearer tok" },
  });
const ctx = (summaryId: string) => ({ params: Promise.resolve({ summaryId }) });

beforeEach(() => {
  summarySnap = { exists: true, data: () => ({ bookingId: "b1" }) };
  bookingSnap = { exists: true, data: () => ({ bookedBy: "u1" }) };
  verifyIdToken.mockResolvedValue({ uid: "u1", email: "patient@example.com" });
  downloadObject.mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
});

describe("GET /api/exercise-plan/[summaryId]/pdf", () => {
  it("401 without a bearer token", async () => {
    expect((await GET(bareReq(), ctx("s1"))).status).toBe(401);
  });

  it("401 when the token is invalid", async () => {
    verifyIdToken.mockRejectedValue(new Error("bad token"));
    expect((await GET(authReq(), ctx("s1"))).status).toBe(401);
  });

  it("404 when the session summary is missing", async () => {
    summarySnap = { exists: false, data: () => ({}) };
    expect((await GET(authReq(), ctx("s1"))).status).toBe(404);
  });

  it("403 for a different user who is not admin", async () => {
    verifyIdToken.mockResolvedValue({ uid: "other", email: "other@example.com" });
    expect((await GET(authReq(), ctx("s1"))).status).toBe(403);
  });

  it("streams the stored PDF for the owner", async () => {
    const res = await GET(authReq(), ctx("s1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("exercise-plan.pdf");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(
      new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    );
    expect(downloadObject).toHaveBeenCalledWith("exercise-plans/s1.pdf");
  });

  it("streams the stored PDF for an admin who does not own the booking", async () => {
    verifyIdToken.mockResolvedValue({ uid: "admin-uid", email: "hello@physioonclick.co.uk" });
    const res = await GET(authReq(), ctx("s1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it("404 when the PDF has not been generated", async () => {
    downloadObject.mockResolvedValue(null);
    expect((await GET(authReq(), ctx("s1"))).status).toBe(404);
  });
});
