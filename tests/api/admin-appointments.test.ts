// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { memoryFirestore } from "../helpers/memory-firestore";

let mem = memoryFirestore();
const verifyIdToken = vi.fn();
vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => mem.db,
  getAdminAuth: () => ({ verifyIdToken }),
  FieldValue: { serverTimestamp: () => "TS" },
}));
vi.stubEnv("ADMIN_EMAIL", "owner@physioonclick.co.uk");
vi.stubEnv("OWNER_EMAIL", "");
vi.stubEnv("RESEND_API_KEY", "re_test");
vi.stubEnv("CALENDAR_INVITE_EMAIL", "calendar@example.com");

import { DELETE, GET, POST } from "@/app/api/admin/appointments/route";
import { buildIcs } from "@/lib/calendar-invite";

const UID = "patientUid123";
const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));

const req = (method: string, body?: unknown, query = "") =>
  new Request(`http://localhost/api/admin/appointments${query}`, {
    method,
    headers: { Authorization: "Bearer good", "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

const NEW = {
  uid: UID,
  service: "initial-assessment",
  visitType: "home",
  date: "2099-06-10",
  time: "15:00",
  addressLine: "1 High Street",
  postcode: "g31 4hs",
  pricePence: 8000,
};

beforeEach(() => {
  mem = memoryFirestore({
    [`patients/${UID}`]: { displayName: "Jane Doe", email: "jane@example.com", phoneNumber: "07000000000" },
  });
  verifyIdToken.mockResolvedValue({ uid: "owner", email: "owner@physioonclick.co.uk" });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

async function create(extra: Record<string, unknown> = {}) {
  const res = await POST(req("POST", { ...NEW, ...extra }));
  return { res, json: (await res.json()) as { bookingId: string; packageId: string; calendarSent: boolean } };
}

describe("owner appointments", () => {
  it("refuses another doctor even with the admin claim", async () => {
    verifyIdToken.mockResolvedValue({ uid: "dr2", email: "dr2@example.com", admin: true });
    expect((await create()).res.status).toBe(403);
    expect((await GET(req("GET"))).status).toBe(403);
    expect((await DELETE(req("DELETE", undefined, "?id=abcdef123"))).status).toBe(403);
    expect(mem.all("bookings")).toHaveLength(0);
  });

  it("saves a timed booking with its address and package, and emails only the calendar", async () => {
    const { res, json } = await create();
    expect(res.status).toBe(201);
    expect(json.calendarSent).toBe(true);
    expect(mem.get(`bookings/${json.bookingId}`)).toMatchObject({
      appointmentDate: "2099-06-10",
      appointmentTime: "15:00",
      homeVisitAddress: "1 High Street, G31 4HS",
      source: "admin-appointment",
      packageId: json.packageId,
      paid: false,
    });
    expect(mem.get(`sessionPackages/${json.packageId}`)).toMatchObject({
      manual: true, totalSessions: 1, pricePence: 8000, paymentStatus: "unpaid",
    });
    expect(mem.all("patientAddresses")).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(sent.to).toEqual(["calendar@example.com"]);
  });

  it("rejects past dates and warns about a clash unless told to book anyway", async () => {
    expect((await create({ date: "2020-01-01" })).res.status).toBe(400);
    await create();
    expect((await create({ time: "15:30" })).res.status).toBe(409);
    expect((await create({ time: "17:00" })).res.status).toBe(201);
    expect((await create({ time: "15:30", allowOverlap: true })).res.status).toBe(201);
  });

  it("cancels and removes an unpaid package, keeping a paid one", async () => {
    const first = (await create()).json;
    await DELETE(req("DELETE", undefined, `?id=${first.bookingId}`));
    expect(mem.get(`bookings/${first.bookingId}`)).toMatchObject({ status: "cancelled" });
    expect(mem.get(`sessionPackages/${first.packageId}`)).toBeUndefined();

    const second = (await create()).json;
    await mem.db.collection("sessionPackages").doc(second.packageId).update({ paymentStatus: "paid", paidMethod: "cash" });
    const res = await DELETE(req("DELETE", undefined, `?id=${second.bookingId}`));
    expect(await res.json()).toMatchObject({ paidKept: true });
    expect(mem.get(`sessionPackages/${second.packageId}`)).toBeDefined();
  });
});

describe("calendar invite", () => {
  it("builds timed, all-day and cancelled events", () => {
    const timed = buildIcs({ id: "a", start: new Date("2099-06-10T14:00:00Z"), minutes: 60, title: "A, B" }, "c@example.com")!;
    expect(timed).toContain("DTSTART:20990610T140000Z");
    expect(timed).toContain("DTEND:20990610T150000Z");
    expect(timed).toContain("SUMMARY:A\\, B");
    expect(buildIcs({ id: "a", date: "2099-06-10", title: "x" }, "c@example.com")).toContain("DTEND;VALUE=DATE:20990611");
    expect(buildIcs({ id: "a", date: "2099-06-10", title: "x", cancelled: true }, "c@example.com")).toContain("METHOD:CANCEL");
  });
});
