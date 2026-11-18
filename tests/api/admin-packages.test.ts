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
vi.stubEnv("ADMIN_EMAIL", "admin@physioonclick.co.uk");
vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://physioonclick.co.uk");
vi.stubEnv("RESEND_API_KEY", "re_test");

import { GET, POST } from "@/app/api/admin/packages/route";
import { PATCH } from "@/app/api/admin/packages/[id]/route";
import { POST as VISIT } from "@/app/api/admin/packages/[id]/visit/route";
import { POST as PAYMENT } from "@/app/api/admin/packages/[id]/payment/route";

const UID = "patientUid123";
const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));

function req(url: string, body?: unknown, method = "POST", token = "good") {
  return new Request(`http://localhost${url}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {},
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

const NEW_PKG = {
  uid: UID,
  title: "Home visit treatment plan",
  visitType: "home",
  totalSessions: 3,
  includesAssessment: true,
  startDate: "2026-11-15",
  endDate: "2026-11-17",
  pricePence: 22000,
  notes: "",
};

async function create() {
  const res = await POST(req("/api/admin/packages", NEW_PKG));
  expect(res.status).toBe(201);
  return ((await res.json()) as { id: string }).id;
}

beforeEach(() => {
  mem = memoryFirestore({
    [`patients/${UID}`]: {
      displayName: "Edwin Argo",
      email: "pat@example.com",
      carerEmails: ["carer@example.com"],
      carerContact: { name: "Thomas C", email: "carer@example.com", relationship: "Partner" },
      createdByAdmin: true,
    },
  });
  verifyIdToken.mockResolvedValue({ uid: "admin", email: "admin@physioonclick.co.uk" });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("admin packages", () => {
  it("rejects non-admins", async () => {
    verifyIdToken.mockResolvedValue({ uid: "x", email: "someone@example.com" });
    expect((await POST(req("/api/admin/packages", NEW_PKG))).status).toBe(403);
    expect(mem.all("sessionPackages")).toHaveLength(0);
  });

  it("creates a manual package and lists it", async () => {
    const id = await create();
    expect(mem.get(`sessionPackages/${id}`)).toMatchObject({
      ownerUid: UID, patientId: UID, manual: true, totalSessions: 3, usedSessions: 0, remainingSessions: 3,
      pricePence: 22000, paymentStatus: "unpaid", startDate: "2026-11-15", endDate: "2026-11-17",
    });
    const res = await GET(req(`/api/admin/packages?uid=${UID}`, undefined, "GET"));
    const json = (await res.json()) as { packages: Array<{ id: string }> };
    expect(json.packages.map((p) => p.id)).toEqual([id]);
  });

  it("validates input", async () => {
    const res = await POST(req("/api/admin/packages", { ...NEW_PKG, endDate: "2026-11-01" }));
    expect(res.status).toBe(400);
  });

  it("records visits: assessment first, then follow-ups, no review email, completes at the end", async () => {
    const id = await create();
    for (const [i, date] of ["2026-11-15", "2026-11-16", "2026-11-17"].entries()) {
      const res = await VISIT(req(`/api/admin/packages/${id}/visit`, { date, note: i === 0 ? "Went well" : "" }), ctx(id));
      expect(res.status).toBe(201);
    }
    const bookings = mem.all("bookings").map(([, d]) => d);
    expect(bookings.map((b) => b.service)).toEqual([
      "Initial Assessment (home visit)",
      "Follow-Up (home visit)",
      "Follow-Up (home visit)",
    ]);
    expect(bookings.every((b) => (b.reminders as { reviewRequestSent: boolean }).reviewRequestSent === true)).toBe(true);
    expect(bookings[0]).toMatchObject({
      bookedBy: UID, source: "admin-manual", dateOnly: true, packageId: id, packageSessionNumber: 1, visitType: "home",
      appointmentDate: "2026-11-15", appointmentTime: "18:00", appointmentLabel: "Sunday, 15 November 2026",
    });
    expect(mem.get(`sessionPackages/${id}`)).toMatchObject({ usedSessions: 3, remainingSessions: 0, status: "complete" });
    const notes = mem.all("admin/clinicalHistory/entries").map(([, d]) => d);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ type: "session-note", summary: "Went well", personId: UID });

    const extra = await VISIT(req(`/api/admin/packages/${id}/visit`, { date: "2026-11-18" }), ctx(id));
    expect(extra.status).toBe(400);
  });

  it("creates a payment link without sending anything", async () => {
    const id = await create();
    const res = await PAYMENT(req(`/api/admin/packages/${id}/payment`, { action: "create-link" }), ctx(id));
    expect(res.status).toBe(200);
    const { url } = (await res.json()) as { url: string };
    expect(url).toMatch(/^https:\/\/physioonclick\.co\.uk\/pay\/[a-f0-9]{32}$/);
    const token = url.split("/").pop()!;
    expect(mem.get(`paymentRequests/${token}`)).toMatchObject({ packageId: id, status: "open" });
    expect(mem.get(`sessionPackages/${id}`)).toMatchObject({ paymentStatus: "link-ready", paymentUrl: url });
    expect(fetchMock).not.toHaveBeenCalled();

    // Same link on a second call.
    const again = (await (await PAYMENT(req(`/api/admin/packages/${id}/payment`, { action: "create-link" }), ctx(id))).json()) as { url: string };
    expect(again.url).toBe(url);
  });

  it("emails the link to patient and carer only on send-link", async () => {
    const id = await create();
    await PAYMENT(req(`/api/admin/packages/${id}/payment`, { action: "create-link" }), ctx(id));
    const res = await PAYMENT(req(`/api/admin/packages/${id}/payment`, { action: "send-link" }), ctx(id));
    expect(await res.json()).toEqual({ sent: ["pat@example.com", "carer@example.com"], failed: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.html).toContain("£220");
    expect(mem.get(`sessionPackages/${id}`)).toMatchObject({ paymentStatus: "link-sent" });
  });

  it("marks paid another way and locks the price", async () => {
    const id = await create();
    const res = await PAYMENT(req(`/api/admin/packages/${id}/payment`, { action: "mark-paid", method: "cash" }), ctx(id));
    expect(res.status).toBe(200);
    expect(mem.get(`sessionPackages/${id}`)).toMatchObject({ paymentStatus: "paid", paidMethod: "cash", amountPaidPence: 22000 });
    const patch = await PATCH(req(`/api/admin/packages/${id}`, { pricePence: 1000 }, "PATCH"), ctx(id));
    expect(patch.status).toBe(400);
  });

  it("edits sessions but never below what's recorded", async () => {
    const id = await create();
    await VISIT(req(`/api/admin/packages/${id}/visit`, { date: "2026-11-15" }), ctx(id));
    expect((await PATCH(req(`/api/admin/packages/${id}`, { totalSessions: 0 }, "PATCH"), ctx(id))).status).toBe(400);
    expect((await PATCH(req(`/api/admin/packages/${id}`, { totalSessions: 5 }, "PATCH"), ctx(id))).status).toBe(200);
    expect(mem.get(`sessionPackages/${id}`)).toMatchObject({ totalSessions: 5, remainingSessions: 4, status: "active" });
  });

  it("refuses to manage a paid self-booked bundle", async () => {
    mem.store.set("sessionPackages/bundle1", { ownerUid: UID, totalSessions: 4, usedSessions: 1, manual: false });
    const res = await VISIT(req("/api/admin/packages/bundle1/visit", { date: "2026-11-15" }), ctx("bundle1"));
    expect(res.status).toBe(400);
  });
});

import { POST as PLAN } from "@/app/api/admin/packages/[id]/plan/route";

describe("planned visit dates", () => {
  it("adds date-only planned visits, caps them at what's left, and recording on that date reuses the booking", async () => {
    const id = await create(); // 3 sessions
    await VISIT(req(`/api/admin/packages/${id}/visit`, { date: "2026-11-15" }), ctx(id));
    const res = await PLAN(req(`/api/admin/packages/${id}/plan`, { dates: ["2026-11-16", "2026-11-17"] }), ctx(id));
    expect(res.status).toBe(201);
    const planned = mem.all("bookings").map(([, d]) => d).filter((b) => b.plannedVisit === true);
    expect(planned).toHaveLength(2);
    expect(planned[0]).toMatchObject({ paid: false, dateOnly: true, status: "upcoming", source: "admin-manual", reminders: { reviewRequestSent: true }, adminNotifiedAt: "TS" });
    expect(planned[0].packageSessionNumber).toBeUndefined();
    expect(mem.get(`sessionPackages/${id}`)).toMatchObject({ usedSessions: 1 });

    // No room for a 4th visit.
    expect((await PLAN(req(`/api/admin/packages/${id}/plan`, { dates: ["2026-11-18"] }), ctx(id))).status).toBe(400);
    // Same date again is skipped, not duplicated.
    const again = await PLAN(req(`/api/admin/packages/${id}/plan`, { dates: ["2026-11-16"] }), ctx(id));
    expect(await again.json()).toMatchObject({ created: 0, skipped: 1 });

    await VISIT(req(`/api/admin/packages/${id}/visit`, { date: "2026-11-16", note: "ok" }), ctx(id));
    const all = mem.all("bookings").map(([, d]) => d);
    expect(all).toHaveLength(3);
    const on16 = all.filter((b) => b.appointmentDate === "2026-11-16");
    expect(on16).toHaveLength(1);
    expect(on16[0]).toMatchObject({ plannedVisit: false, packageSessionNumber: 2 });
    expect(mem.get(`sessionPackages/${id}`)).toMatchObject({ usedSessions: 2, remainingSessions: 1 });
  });
});
