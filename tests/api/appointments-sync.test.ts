import { beforeEach, describe, expect, it, vi } from "vitest";

// FieldValue now ships from our REST shim rather than firebase-admin, so it is
// mocked from the same module as getAdminAuth/getAdminDb (see enquiry.test.ts).
const verifyIdTokenMock = vi.fn();
let adminAuthMock: unknown = { verifyIdToken: verifyIdTokenMock };
let adminDbMock: unknown;

let addMock: ReturnType<typeof vi.fn>;
let updateMock: ReturnType<typeof vi.fn>;
let getMock: ReturnType<typeof vi.fn>;
let whereMock: ReturnType<typeof vi.fn>;

function makeDb(existingDocs: Array<{ ref: { update: ReturnType<typeof vi.fn> } }> = []) {
  getMock = vi.fn().mockResolvedValue({ empty: existingDocs.length === 0, docs: existingDocs });
  whereMock = vi.fn().mockReturnValue({ limit: () => ({ get: getMock }) });
  addMock = vi.fn().mockResolvedValue({});
  return {
    collection: vi.fn().mockReturnValue({
      where: whereMock,
      add: addMock,
    }),
  };
}

vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => adminAuthMock,
  getAdminDb: () => adminDbMock,
  FieldValue: {
    serverTimestamp: vi.fn().mockReturnValue("__SERVER_TIMESTAMP__"),
  },
}));

import { GET } from "@/app/api/appointments/sync/route";

const futureIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

function makeRequest(opts: { authHeader?: string; queryEmail?: string; queryUserId?: string } = {}) {
  const params = new URLSearchParams();
  if (opts.queryEmail) params.set("email", opts.queryEmail);
  if (opts.queryUserId) params.set("userId", opts.queryUserId);
  const qs = params.toString();
  const url = `http://localhost/api/appointments/sync${qs ? `?${qs}` : ""}`;
  const headers: Record<string, string> = {};
  if (opts.authHeader) headers.Authorization = opts.authHeader;
  return new Request(url, { headers }) as unknown as Parameters<typeof GET>[0];
}

describe("GET /api/appointments/sync", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    verifyIdTokenMock.mockReset();
    adminAuthMock = { verifyIdToken: verifyIdTokenMock };
    adminDbMock = makeDb();
    global.fetch = vi.fn();
  });

  it("returns 401 when no Authorization header is sent", async () => {
    const res = await GET(makeRequest({ queryEmail: "victim@example.com", queryUserId: "victim-uid" }));

    expect(res.status).toBe(401);
    expect(verifyIdTokenMock).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 401 when the ID token fails verification", async () => {
    verifyIdTokenMock.mockRejectedValue(new Error("bad token"));

    const res = await GET(makeRequest({ authHeader: "Bearer forged-token" }));

    expect(res.status).toBe(401);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("Invalid token");
  });

  it("returns 500 when Firestore/auth admin are not configured", async () => {
    adminAuthMock = null;

    const res = await GET(makeRequest({ authHeader: "Bearer valid-token" }));

    expect(res.status).toBe(500);
  });

  it("ignores query-string email/userId and derives identity from the verified token only", async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: "real-uid", email: "real@example.com" });
    vi.stubEnv("CAL_API_KEY", "cal_test_key");
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );

    const res = await GET(
      makeRequest({
        authHeader: "Bearer valid-token",
        // An attacker-supplied email/userId for a different patient — must be ignored.
        queryEmail: "victim@example.com",
        queryUserId: "victim-uid",
      }),
    );

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledOnce();
    const [calledUrl] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(calledUrl).toContain(encodeURIComponent("real@example.com"));
    expect(calledUrl).not.toContain("victim");
  });

  it("links an existing booking to bookedBy = token uid, never the query-string userId", async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: "real-uid", email: "real@example.com" });
    vi.stubEnv("CAL_API_KEY", "cal_test_key");
    updateMock = vi.fn().mockResolvedValue({});
    adminDbMock = makeDb([{ ref: { update: updateMock } }]);
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ data: [{ uid: "cal-uid-1", start: futureIso, status: "accepted", attendees: [] }] }),
        { status: 200 },
      ),
    );

    const res = await GET(
      makeRequest({
        authHeader: "Bearer valid-token",
        queryEmail: "victim@example.com",
        queryUserId: "victim-uid",
      }),
    );

    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({ bookedBy: "real-uid" });
  });

  it("creates a new synced booking with bookedBy/patientId from the token, not the query string", async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: "real-uid", email: "real@example.com" });
    vi.stubEnv("CAL_API_KEY", "cal_test_key");
    adminDbMock = makeDb([]);
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              uid: "cal-uid-2",
              start: futureIso,
              status: "accepted",
              title: "Initial Assessment",
              attendees: [{ name: "Real Patient", email: "real@example.com" }],
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const res = await GET(
      makeRequest({
        authHeader: "Bearer valid-token",
        queryEmail: "victim@example.com",
        queryUserId: "victim-uid",
      }),
    );

    expect(res.status).toBe(200);
    expect(addMock).toHaveBeenCalledOnce();
    const written = addMock.mock.calls[0][0];
    expect(written).toMatchObject({
      bookedBy: "real-uid",
      patientId: "real-uid",
      email: "real@example.com",
      calBookingUid: "cal-uid-2",
    });

    const data = (await res.json()) as { synced: number; total: number };
    expect(data).toMatchObject({ synced: 1, total: 1 });
  });
});
