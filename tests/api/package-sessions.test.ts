import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Bundle sessions 2..N are booked from a sessionPackages credit. A bundle bought
// as a home visit must book every later session as a home visit too, with the
// address carried server-side only (never echoed, logged or put in a URL).

const ADDRESS = "7 Example Street, G31 4HS";

const state = vi.hoisted(() => ({ pack: {} as Record<string, unknown> }));
const packageRef = {
  get: vi.fn(async () => ({ exists: true, data: () => state.pack })),
  update: vi.fn().mockResolvedValue(undefined),
};
const bookingsAdd = vi.fn().mockResolvedValue({ id: "bk_2" });
const checkInsAdd = vi.fn().mockResolvedValue({ id: "ci_1" });
const db = {
  collection: vi.fn((name: string) => {
    if (name === "sessionPackages") return { doc: vi.fn(() => packageRef) };
    if (name === "bookings") return { add: bookingsAdd };
    return { add: checkInsAdd };
  }),
};

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => db,
  getAdminAuth: () => ({ verifyIdToken: vi.fn().mockResolvedValue({ uid: "u1", email: "ada@example.com" }) }),
  FieldValue: { serverTimestamp: () => "TS" },
}));
vi.mock("@/lib/cal-booking", () => ({
  createCalBooking: vi.fn().mockResolvedValue({ ok: true, uid: "cal_2" }),
}));

import { createCalBooking } from "@/lib/cal-booking";
import { GET, POST } from "@/app/api/package-sessions/route";

function basePack(extra: Record<string, unknown> = {}) {
  return {
    ownerUid: "u1",
    patientId: "u1",
    patientName: "Ada Lovelace",
    email: "ada@example.com",
    title: "4-session bundle",
    totalSessions: 4,
    usedSessions: 1,
    remainingSessions: 3,
    status: "active",
    bookingUids: ["cal_1"],
    ...extra,
  };
}

function postRequest() {
  return new NextRequest("http://localhost/api/package-sessions", {
    method: "POST",
    headers: { Authorization: "Bearer token" },
    body: JSON.stringify({
      packageId: "cs_1",
      start: "2999-01-01T10:00:00.000Z",
      timeZone: "Europe/London",
      checkIn: { painScore: 3, progress: "better", exercises: "yes", newSymptoms: false, changeNote: "", focus: "" },
    }),
  });
}

beforeEach(() => {
  state.pack = basePack();
});
afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/package-sessions", () => {
  it("books a home-visit bundle's later session as a home visit", async () => {
    state.pack = basePack({ visitType: "home", homeVisitAddress: ADDRESS });
    const res = await POST(postRequest());
    expect(res.status).toBe(200);
    expect(createCalBooking).toHaveBeenCalledWith(
      expect.objectContaining({ visitType: "home", homeVisitAddress: ADDRESS }),
    );
    expect(bookingsAdd).toHaveBeenCalledWith(
      expect.objectContaining({ visitType: "home", homeVisitAddress: ADDRESS }),
    );
    expect(JSON.stringify(await res.json())).not.toContain("Example Street");
  });

  it("books a video bundle's later session exactly as before", async () => {
    const res = await POST(postRequest());
    expect(res.status).toBe(200);
    const calArgs = vi.mocked(createCalBooking).mock.calls[0][0];
    expect(calArgs).not.toHaveProperty("visitType");
    expect(calArgs).not.toHaveProperty("homeVisitAddress");
    const booking = bookingsAdd.mock.calls[0][0];
    expect(booking).not.toHaveProperty("visitType");
    expect(booking).not.toHaveProperty("homeVisitAddress");
  });

  it("never logs the home address when Cal.com fails", async () => {
    state.pack = basePack({ visitType: "home", homeVisitAddress: ADDRESS });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(createCalBooking).mockResolvedValueOnce({ ok: false, status: 502, error: "x" } as never);
    const res = await POST(postRequest());
    const logged = JSON.stringify([...errorSpy.mock.calls, ...logSpy.mock.calls, await res.json()]);
    expect(logged).not.toContain("Example Street");
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });
});

describe("GET /api/package-sessions", () => {
  it("does not return the home address", async () => {
    state.pack = basePack({ visitType: "home", homeVisitAddress: ADDRESS });
    const snap = { docs: [{ id: "cs_1", data: () => state.pack }] };
    db.collection.mockImplementationOnce(
      () => ({ where: () => ({ limit: () => ({ get: async () => snap }) }) }) as never,
    );
    const res = await GET(new NextRequest("http://localhost/api/package-sessions", { headers: { Authorization: "Bearer t" } }));
    expect(JSON.stringify(await res.json())).not.toContain("Example Street");
  });

  it("tells the portal a bundle is a home visit, so it shows home-visit times", async () => {
    state.pack = basePack({ visitType: "home", homeVisitAddress: ADDRESS });
    const snap = { docs: [{ id: "cs_1", data: () => state.pack }] };
    db.collection.mockImplementationOnce(
      () => ({ where: () => ({ limit: () => ({ get: async () => snap }) }) }) as never,
    );
    const res = await GET(new NextRequest("http://localhost/api/package-sessions", { headers: { Authorization: "Bearer t" } }));
    const { packages } = await res.json();
    expect(packages[0].visitType).toBe("home");
  });

  it("adds no visit type to a video bundle", async () => {
    const snap = { docs: [{ id: "cs_1", data: () => state.pack }] };
    db.collection.mockImplementationOnce(
      () => ({ where: () => ({ limit: () => ({ get: async () => snap }) }) }) as never,
    );
    const res = await GET(new NextRequest("http://localhost/api/package-sessions", { headers: { Authorization: "Bearer t" } }));
    const { packages } = await res.json();
    expect(packages[0]).not.toHaveProperty("visitType");
  });
});
