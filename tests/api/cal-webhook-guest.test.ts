// tests/api/cal-webhook-guest.test.ts
// Guest checkout (lib/guest-booking.ts): when no account matches the attendee
// email, cal-webhook attaches the new booking to the uid that submitted its
// pre-payment assessment — but only once that assessment has actually been
// linked, and never in place of a real email-matched account.
import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const bookingRef = { update: vi.fn().mockResolvedValue(undefined) };
const assessmentDoc = { update: vi.fn().mockResolvedValue(undefined) };
const state: { usersMatch: string | null; payment: Record<string, unknown> } = {
  usersMatch: null,
  payment: {},
};

const emptyQuery = { where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }) };

const db = {
  collection: vi.fn((name: string) => {
    if (name === "bookings") {
      return { ...emptyQuery, add: vi.fn(async () => bookingRef) };
    }
    if (name === "payments") {
      return {
        where: () => ({
          limit: () => ({ get: async () => ({ empty: false, docs: [{ data: () => state.payment }] }) }),
        }),
      };
    }
    if (name === "users") {
      return {
        where: () => ({
          limit: () => ({
            get: async () =>
              state.usersMatch ? { empty: false, docs: [{ id: state.usersMatch }] } : { empty: true, docs: [] },
          }),
        }),
      };
    }
    // "patients": both the assessment-form path and the email lookup (no match).
    return {
      ...emptyQuery,
      doc: () => ({ collection: () => ({ doc: () => ({ collection: () => ({ doc: () => assessmentDoc }) }) }) }),
    };
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

const PAID_WITH_ASSESSMENT = {
  amountPence: 5000,
  status: "paid",
  assessmentUid: "anon_1",
  assessmentPersonId: "anon_1",
  assessmentFormId: "form_1",
};

const bookedByUpdates = () =>
  bookingRef.update.mock.calls.map((c) => c[0]).filter((u) => "bookedBy" in u);

beforeEach(() => {
  vi.stubEnv("CAL_WEBHOOK_SECRET", SECRET);
  bookingRef.update.mockClear();
  assessmentDoc.update.mockReset().mockResolvedValue(undefined);
  state.usersMatch = null;
  state.payment = { ...PAID_WITH_ASSESSMENT };
});
afterEach(() => vi.restoreAllMocks());

describe("cal-webhook guest checkout bookedBy fallback", () => {
  it("attaches a booking with no matching account to the assessment owner", async () => {
    const res = await POST(signed(BODY));
    expect(res.status).toBe(200);
    expect(assessmentDoc.update).toHaveBeenCalledWith({ bookingId: "cal_xyz" });
    expect(bookedByUpdates()).toEqual([
      { bookedBy: "anon_1", patientType: "self", patientId: "anon_1", patientName: "Ada", patientAvatarUrl: "" },
    ]);
  });

  it("keeps the email-matched account as bookedBy (existing behaviour wins)", async () => {
    state.usersMatch = "real_uid";
    await POST(signed(BODY));
    expect(bookedByUpdates()).toEqual([expect.objectContaining({ bookedBy: "real_uid", patientId: "real_uid" })]);
  });

  it("does not attach the booking if the assessment form could not be linked", async () => {
    assessmentDoc.update.mockRejectedValue(new Error("NOT_FOUND"));
    await POST(signed(BODY));
    expect(bookedByUpdates()).toEqual([]);
  });

  it("leaves bookedBy unset when there is no assessment and no account (as before)", async () => {
    state.payment = { amountPence: 5000, status: "paid" };
    await POST(signed(BODY));
    expect(bookedByUpdates()).toEqual([]);
  });
});
