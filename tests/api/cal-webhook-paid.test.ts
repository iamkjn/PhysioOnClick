// tests/api/cal-webhook-paid.test.ts
// Focused test: after creating a booking doc, cal-webhook stamps paid=true
// when a matching payments doc exists. Mock getAdminDb so `bookings` add()
// returns a ref whose update() we assert, and `payments` where() returns a paid doc.
// (Model this on the existing tests/api/cal-webhook.test.ts setup — reuse its
//  signature-signing helper and body shape.)
import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const bookingRef = { update: vi.fn().mockResolvedValue(undefined) };
const payData: { current: Record<string, unknown> } = { current: { amountPence: 5000, status: "paid" } };
const db = {
  collection: vi.fn((name: string) => {
    if (name === "bookings") {
      return {
        where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }),
        add: vi.fn(async () => bookingRef),
      };
    }
    if (name === "payments") {
      return {
        where: () => ({
          limit: () => ({
            get: async () => ({ empty: false, docs: [{ data: () => payData.current }] }),
          }),
        }),
      };
    }
    // users / patients lookups -> empty
    return { where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }) };
  }),
  doc: () => ({ get: async () => ({ exists: false }), delete: vi.fn(), update: vi.fn() }),
};

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => db,
  FieldValue: { serverTimestamp: () => "TS" },
}));
import { POST } from "@/app/api/cal-webhook/route";

const SECRET = "cal_secret";
function signed(body: string) {
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
  return new NextRequest("http://localhost/api/cal-webhook", {
    method: "POST",
    headers: { "X-Cal-Signature-256": sig },
    body,
  });
}

const BODY = JSON.stringify({
  triggerEvent: "BOOKING_CREATED",
  payload: {
    uid: "cal_xyz",
    startTime: "2999-01-01T10:00:00.000Z",
    attendees: [{ name: "Ada", email: "ada@example.com" }],
    title: "Initial Assessment",
  },
});

beforeEach(() => {
  vi.stubEnv("CAL_WEBHOOK_SECRET", SECRET);
  bookingRef.update.mockClear();
  payData.current = { amountPence: 5000, status: "paid" };
});
afterEach(() => vi.restoreAllMocks());

describe("cal-webhook paid reconciliation", () => {
  it("stamps paid=true when a matching payments doc exists", async () => {
    const res = await POST(signed(BODY));
    expect(res.status).toBe(200);
    const updates = bookingRef.update.mock.calls.map((c) => c[0]);
    expect(updates.some((u) => u.paid === true && u.amountPaidPence === 5000)).toBe(true);
  });

  it("copies a home visit and its address from the payment onto the booking", async () => {
    payData.current = { amountPence: 4000, status: "paid", visitType: "home", homeVisitAddress: "7 Example Street, G31 4HS" };
    await POST(signed(BODY));
    expect(bookingRef.update).toHaveBeenCalledWith(
      expect.objectContaining({ paid: true, visitType: "home", homeVisitAddress: "7 Example Street, G31 4HS" }),
    );
  });

  it("adds no visit fields for a video booking", async () => {
    await POST(signed(BODY));
    const updates = bookingRef.update.mock.calls.map((c) => c[0]);
    expect(updates.some((u) => "visitType" in u || "homeVisitAddress" in u)).toBe(false);
  });
});
