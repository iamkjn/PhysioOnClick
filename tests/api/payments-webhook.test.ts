import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const bookingDoc = { update: vi.fn().mockResolvedValue(undefined) };
const paymentDocRef = {
  get: vi.fn(),
  set: vi.fn().mockResolvedValue(undefined),
};
const db = {
  collection: vi.fn((name: string) => {
    if (name === "payments") {
      return { doc: vi.fn(() => paymentDocRef) };
    }
    // bookings lookup by calBookingUid
    return {
      where: () => ({ limit: () => ({ get: async () => ({ empty: false, docs: [{ ref: bookingDoc }] }) }) }),
    };
  }),
};

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => db,
  FieldValue: { serverTimestamp: () => "TS" },
}));
vi.mock("@/lib/cal-booking", () => ({
  createCalBooking: vi.fn().mockResolvedValue({ ok: true, uid: "cal_xyz" }),
}));
// slot re-check helper lives in the route module's dependency; stub global fetch for /v2/slots
import { createCalBooking } from "@/lib/cal-booking";
import { POST } from "@/app/api/payments/webhook/route";

const SECRET = "whsec_test";

function signedRequest(event: unknown) {
  const body = JSON.stringify(event);
  const ts = Math.floor(Date.now() / 1000);
  const v1 = crypto.createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");
  return new Request("http://localhost/api/payments/webhook", {
    method: "POST",
    headers: { "stripe-signature": `t=${ts},v1=${v1}` },
    body,
  });
}

const EVENT = {
  id: "evt_1",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_1",
      amount_total: 5000,
      currency: "gbp",
      metadata: {
        service: "initial-assessment",
        startISO: "2999-01-01T10:00:00.000Z",
        name: "Ada Lovelace",
        email: "ada@example.com",
        timeZone: "Europe/London",
        focusAreas: "",
      },
    },
  },
};

beforeEach(() => {
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", SECRET);
  vi.stubEnv("NEXT_PUBLIC_CAL_USERNAME", "physio");
  paymentDocRef.get.mockResolvedValue({ exists: false });
  // slot re-check: return the requested start as available
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { "2999-01-01": [{ start: "2999-01-01T10:00:00.000Z" }] } }), {
        status: 200,
      }),
    ),
  );
});
afterEach(() => vi.restoreAllMocks());

describe("POST /api/payments/webhook", () => {
  it("creates the Cal booking and records the payment on a valid event", async () => {
    const res = await POST(signedRequest(EVENT));
    expect(res.status).toBe(200);
    expect(createCalBooking).toHaveBeenCalledOnce();
    // reservation write ("processing") + final write ("paid")
    expect(paymentDocRef.set).toHaveBeenCalledTimes(2);
    const written = paymentDocRef.set.mock.calls.at(-1)[0];
    expect(written.calBookingUid).toBe("cal_xyz");
    expect(written.amountPence).toBe(5000);
    expect(written.status).toBe("paid");
    expect(typeof written.invoiceNumber).toBe("string");
    expect(written.invoiceNumber).toMatch(/^INV-\d{4}-[A-Z0-9]{6}$/);
    expect(typeof written.paidAt).toBe("string");
  });

  it("re-checks the slot against Cal.com's slots API using version 2024-09-04", async () => {
    // Regression: the slots endpoint requires cal-api-version 2024-09-04. Using
    // the bookings version (2024-08-13) makes Cal.com return an error, so the
    // re-check returned false and every paid booking was wrongly recorded
    // slot_unavailable.
    await POST(signedRequest(EVENT));
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const slotsCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("api.cal.com/v2/slots"),
    );
    expect(slotsCall, "expected a call to the Cal.com slots endpoint").toBeTruthy();
    expect((slotsCall![1] as RequestInit).headers).toMatchObject({
      "cal-api-version": "2024-09-04",
    });
  });

  it("rejects an invalid signature", async () => {
    const bad = new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=deadbeef" },
      body: JSON.stringify(EVENT),
    });
    const res = await POST(bad);
    expect(res.status).toBe(400);
    expect(createCalBooking).not.toHaveBeenCalled();
    expect(paymentDocRef.set).not.toHaveBeenCalled();
  });

  it("is idempotent when the event was already processed", async () => {
    paymentDocRef.get.mockResolvedValue({ exists: true });
    const res = await POST(signedRequest(EVENT));
    expect(res.status).toBe(200);
    expect(createCalBooking).not.toHaveBeenCalled();
    expect(paymentDocRef.set).not.toHaveBeenCalled();
  });

  it("marks slot_unavailable when the slot was lost before the webhook arrived", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { "2999-01-01": [{ start: "2999-01-01T11:00:00.000Z" }] } }), {
          status: 200,
        }),
      ),
    );
    const res = await POST(signedRequest(EVENT));
    expect(res.status).toBe(200);
    expect(createCalBooking).not.toHaveBeenCalled();
    const written = paymentDocRef.set.mock.calls.at(-1)[0];
    expect(written.status).toBe("slot_unavailable");
  });

  it("still attempts the booking when the slot check can't be verified (transient Cal error)", async () => {
    // Cal.com unreachable during the webhook: we must NOT charge-then-record
    // slot_unavailable — we let Cal.com be the authority and try to book.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const res = await POST(signedRequest(EVENT));
    expect(res.status).toBe(200);
    expect(createCalBooking).toHaveBeenCalledOnce();
    const written = paymentDocRef.set.mock.calls.at(-1)[0];
    expect(written.status).toBe("paid");
  });

  it("marks booking_failed when Cal booking creation fails", async () => {
    vi.mocked(createCalBooking).mockResolvedValueOnce({ ok: false, status: 502, error: "x" } as never);
    const res = await POST(signedRequest(EVENT));
    expect(res.status).toBe(200);
    const written = paymentDocRef.set.mock.calls.at(-1)[0];
    expect(written.status).toBe("booking_failed");
  });
});
