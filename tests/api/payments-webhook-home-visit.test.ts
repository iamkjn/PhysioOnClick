import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Home visits (Glasgow area) ride the same pay-first path as video bookings:
// visitType + address travel in Stripe metadata, and the payments webhook must
// pass them on to Cal.com, the Firestore records and the receipt email.

const bookingDoc = { update: vi.fn().mockResolvedValue(undefined) };
const paymentDocRef = {
  get: vi.fn(),
  set: vi.fn().mockResolvedValue(undefined),
};
const packageDocRef = { set: vi.fn().mockResolvedValue(undefined) };
const db = {
  collection: vi.fn((name: string) => {
    if (name === "payments") return { doc: vi.fn(() => paymentDocRef) };
    if (name === "sessionPackages") return { doc: vi.fn(() => packageDocRef) };
    return {
      where: () => ({
        limit: () => ({ get: async () => ({ empty: false, docs: [{ ref: bookingDoc, data: () => ({}) }] }) }),
      }),
    };
  }),
};

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => db,
  FieldValue: { serverTimestamp: () => "TS" },
  uploadObject: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock("@/lib/cal-booking", () => ({
  createCalBooking: vi.fn().mockResolvedValue({ ok: true, uid: "cal_xyz" }),
}));
vi.mock("@/lib/invoice-pdf", () => ({
  generateInvoicePdf: vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])),
}));
vi.mock("@/lib/emails/receipt-email", () => ({
  sendReceiptEmail: vi.fn().mockResolvedValue({ sent: true }),
}));

import { createCalBooking } from "@/lib/cal-booking";
import { sendReceiptEmail } from "@/lib/emails/receipt-email";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
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

function eventWith(extra: Record<string, string>) {
  return {
    id: "evt_1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_1",
        amount_total: 4000,
        currency: "gbp",
        metadata: {
          service: "initial-assessment",
          startISO: "2999-01-01T10:00:00.000Z",
          name: "Ada Lovelace",
          email: "ada@example.com",
          timeZone: "Europe/London",
          focusAreas: "",
          ...extra,
        },
      },
    },
  };
}

const ADDRESS = "7 Example Street, G31 4HS";

beforeEach(() => {
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", SECRET);
  vi.stubEnv("NEXT_PUBLIC_CAL_USERNAME", "physio");
  paymentDocRef.get.mockResolvedValue({ exists: false });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { "2999-01-01": [{ start: "2999-01-01T10:00:00.000Z" }] } }), {
        status: 200,
      }),
    ),
  );
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("POST /api/payments/webhook — home visits", () => {
  it("passes visitType and address to createCalBooking", async () => {
    const res = await POST(signedRequest(eventWith({ visitType: "home", homeVisitAddress: ADDRESS })));
    expect(res.status).toBe(200);
    expect(createCalBooking).toHaveBeenCalledWith(
      expect.objectContaining({ visitType: "home", homeVisitAddress: ADDRESS }),
    );
  });

  it("records the visit on the payment doc and the booking doc", async () => {
    await POST(signedRequest(eventWith({ visitType: "home", homeVisitAddress: ADDRESS })));
    const paid = paymentDocRef.set.mock.calls.map((c) => c[0]).find((w) => w.status === "paid");
    expect(paid).toMatchObject({ visitType: "home", homeVisitAddress: ADDRESS });
    expect(bookingDoc.update).toHaveBeenCalledWith(
      expect.objectContaining({ paid: true, visitType: "home", homeVisitAddress: ADDRESS }),
    );
  });

  it("tells the receipt email it is a home visit", async () => {
    await POST(signedRequest(eventWith({ visitType: "home", homeVisitAddress: ADDRESS })));
    expect(sendReceiptEmail).toHaveBeenCalledWith(
      expect.objectContaining({ visitType: "home", homeVisitAddress: ADDRESS }),
    );
  });

  it("tells the invoice it is a home visit but never gives it the address", async () => {
    await POST(signedRequest(eventWith({ visitType: "home", homeVisitAddress: ADDRESS })));
    const invoiceArgs = vi.mocked(generateInvoicePdf).mock.calls[0][0];
    expect(invoiceArgs.visitType).toBe("home");
    expect(JSON.stringify(invoiceArgs)).not.toContain("Example Street");
  });

  it("generates a video invoice with no visit type, as before", async () => {
    await POST(signedRequest(eventWith({ visitType: "video" })));
    expect(vi.mocked(generateInvoicePdf).mock.calls[0][0]).not.toHaveProperty("visitType");
  });

  it("leaves a video booking exactly as before", async () => {
    await POST(signedRequest(eventWith({ visitType: "video" })));
    const calArgs = vi.mocked(createCalBooking).mock.calls[0][0];
    expect(calArgs).not.toHaveProperty("visitType");
    expect(calArgs).not.toHaveProperty("homeVisitAddress");
    const paid = paymentDocRef.set.mock.calls.map((c) => c[0]).find((w) => w.status === "paid");
    expect(paid).not.toHaveProperty("visitType");
    expect(paid).not.toHaveProperty("homeVisitAddress");
    expect(bookingDoc.update).not.toHaveBeenCalledWith(expect.objectContaining({ visitType: expect.anything() }));
    expect(vi.mocked(sendReceiptEmail).mock.calls[0][0]).not.toHaveProperty("homeVisitAddress");
  });

  it("never logs the home address", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(createCalBooking).mockResolvedValueOnce({ ok: false, status: 502, error: "x" } as never);
    await POST(signedRequest(eventWith({ visitType: "home", homeVisitAddress: ADDRESS })));
    const logged = JSON.stringify([...errorSpy.mock.calls, ...logSpy.mock.calls]);
    expect(logged).not.toContain("Example Street");
    expect(logged).not.toContain("G31 4HS");
  });

  it("keeps the home visit on a bundle's sessionPackages doc for later sessions", async () => {
    await POST(
      signedRequest(eventWith({ service: "bundle-4", visitType: "home", homeVisitAddress: ADDRESS })),
    );
    expect(packageDocRef.set).toHaveBeenCalledWith(
      expect.objectContaining({ visitType: "home", homeVisitAddress: ADDRESS, totalSessions: 4 }),
    );
  });

  it("stores no visit fields on a video bundle", async () => {
    await POST(signedRequest(eventWith({ service: "bundle-4", visitType: "video" })));
    const pack = packageDocRef.set.mock.calls[0][0];
    expect(pack).not.toHaveProperty("visitType");
    expect(pack).not.toHaveProperty("homeVisitAddress");
  });

  it("labels the invoice and receipt email as a home visit", async () => {
    await POST(signedRequest(eventWith({ visitType: "home", homeVisitAddress: ADDRESS })));
    expect(vi.mocked(generateInvoicePdf).mock.calls[0][0].serviceLabel).toBe("Initial Assessment (home visit)");
    expect(vi.mocked(sendReceiptEmail).mock.calls[0][0].serviceLabel).toBe("Initial Assessment (home visit)");
  });

  it("keeps the video invoice and receipt label as before", async () => {
    await POST(signedRequest(eventWith({ visitType: "video" })));
    expect(vi.mocked(generateInvoicePdf).mock.calls[0][0].serviceLabel).toBe("Initial Online Assessment");
    expect(vi.mocked(sendReceiptEmail).mock.calls[0][0].serviceLabel).toBe("Initial Online Assessment");
  });
});


describe("POST /api/payments/webhook — home-visit Cal.com event", () => {
  it("checks the slot against the Glasgow home-visit event for a home visit", async () => {
    await POST(signedRequest(eventWith({ visitType: "home", homeVisitAddress: ADDRESS })));
    const slotUrl = new URL((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string);
    expect(slotUrl.searchParams.get("eventTypeSlug")).toBe("initial-assessment-home-visit-in-glasgow");
  });

  it("checks the slot against the video event for a video booking", async () => {
    await POST(signedRequest(eventWith({})));
    const slotUrl = new URL((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string);
    expect(slotUrl.searchParams.get("eventTypeSlug")).toBe("initial-online-assessment");
  });
});

describe("POST /api/payments/webhook — travel fee", () => {
  it("stores the travel fee on the payment doc and the booking doc", async () => {
    await POST(signedRequest(eventWith({ visitType: "home", homeVisitAddress: ADDRESS, travelFeePence: "1500" })));
    const paid = paymentDocRef.set.mock.calls.map((c) => c[0]).find((d) => d.status === "paid");
    expect(paid.travelFeePence).toBe(1500);
    expect(bookingDoc.update.mock.calls[0][0].travelFeePence).toBe(1500);
  });

  it("passes the travel fee to the invoice and the receipt email", async () => {
    await POST(signedRequest(eventWith({ visitType: "home", homeVisitAddress: ADDRESS, travelFeePence: "1500" })));
    expect((generateInvoicePdf as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].travelFeePence).toBe(1500);
    expect((sendReceiptEmail as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].travelFeePence).toBe(1500);
  });

  it("labels the travel fee with the visit count on the invoice and the receipt email, but does not store the label", async () => {
    await POST(signedRequest(eventWith({ visitType: "home", homeVisitAddress: ADDRESS, travelFeePence: "1500" })));
    expect((generateInvoicePdf as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].travelFeeLabel).toBe("Travel fee (1 home visit × £15)");
    expect((sendReceiptEmail as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].travelFeeLabel).toBe("Travel fee (1 home visit × £15)");
    const paid = paymentDocRef.set.mock.calls.map((c) => c[0]).find((d) => d.status === "paid");
    expect(paid).not.toHaveProperty("travelFeeLabel");
  });

  it("adds no travel fee anywhere for a video booking", async () => {
    await POST(signedRequest(eventWith({})));
    const paid = paymentDocRef.set.mock.calls.map((c) => c[0]).find((d) => d.status === "paid");
    expect(paid).not.toHaveProperty("travelFeePence");
    expect((generateInvoicePdf as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).not.toHaveProperty("travelFeePence");
    expect((sendReceiptEmail as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).not.toHaveProperty("travelFeePence");
    expect((generateInvoicePdf as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).not.toHaveProperty("travelFeeLabel");
    expect((sendReceiptEmail as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).not.toHaveProperty("travelFeeLabel");
  });
});
