import { afterEach, describe, expect, it, vi } from "vitest";

const paymentsGet = vi.fn();
const bookingsGet = vi.fn();
const db = {
  collection: (name: string) => ({
    where: () => ({ limit: () => ({ get: name === "payments" ? paymentsGet : bookingsGet }) }),
  }),
};
vi.mock("@/lib/firebase-admin", () => ({ getAdminDb: () => db }));
import { getReceiptBySession } from "@/lib/patient-receipt";

afterEach(() => vi.restoreAllMocks());

describe("getReceiptBySession", () => {
  it("returns null when no paid payment exists", async () => {
    paymentsGet.mockResolvedValue({ empty: true, docs: [] });
    expect(await getReceiptBySession("cs_none")).toBeNull();
  });

  it("assembles receipt data from payment + booking", async () => {
    paymentsGet.mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({
        status: "paid", invoiceNumber: "INV-2026-AB12CD", paidAt: "2026-07-31T10:00:00.000Z",
        amountPence: 5000, service: "initial-assessment", email: "ada@example.com",
        calBookingUid: "cal_xyz",
      }) }],
    });
    bookingsGet.mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({ fullName: "Ada Lovelace", sessionDate: "2026-08-01T09:00:00.000Z" }) }],
    });
    const r = await getReceiptBySession("cs_1");
    expect(r).not.toBeNull();
    expect(r!.invoiceNumber).toBe("INV-2026-AB12CD");
    expect(r!.amountPence).toBe(5000);
    expect(r!.patientName).toBe("Ada Lovelace");
    expect(r!.serviceLabel.length).toBeGreaterThan(0);
  });

  it("labels a home-visit receipt as a home visit and a video receipt as before", async () => {
    bookingsGet.mockResolvedValue({ empty: true, docs: [] });
    const pay = (extra: Record<string, unknown>) => ({
      empty: false,
      docs: [{ data: () => ({
        status: "paid", invoiceNumber: "INV-2026-AB12CD", paidAt: "2026-07-31T10:00:00.000Z",
        amountPence: 4000, service: "initial-assessment", email: "ada@example.com", ...extra,
      }) }],
    });
    paymentsGet.mockResolvedValue(pay({ visitType: "home", homeVisitAddress: "7 Example Street, G31 4HS" }));
    expect((await getReceiptBySession("cs_h"))!.serviceLabel).toBe("Initial Assessment (home visit)");
    paymentsGet.mockResolvedValue(pay({}));
    expect((await getReceiptBySession("cs_v"))!.serviceLabel).toBe("Initial Online Assessment");
  });

  it("returns the stored travel fee for a home visit and 0 for video", async () => {
    bookingsGet.mockResolvedValue({ empty: true, docs: [] });
    const pay = (extra: Record<string, unknown>) => ({
      empty: false,
      docs: [{ data: () => ({
        status: "paid", invoiceNumber: "INV-2026-AB12CD", paidAt: "2026-07-31T10:00:00.000Z",
        amountPence: 5500, service: "initial-assessment", email: "ada@example.com", ...extra,
      }) }],
    });
    paymentsGet.mockResolvedValue(pay({ visitType: "home", travelFeePence: 1500 }));
    expect((await getReceiptBySession("cs_h"))!.travelFeePence).toBe(1500);
    paymentsGet.mockResolvedValue(pay({}));
    expect((await getReceiptBySession("cs_v"))!.travelFeePence).toBe(0);
  });
});

describe("getReceiptBySession travel fee label", () => {
  const pay = (extra: Record<string, unknown>) => ({
    empty: false,
    docs: [{ data: () => ({
      status: "paid", invoiceNumber: "INV-2026-AB12CD", paidAt: "2026-07-31T10:00:00.000Z",
      amountPence: 18000, service: "bundle-4", email: "ada@example.com", ...extra,
    }) }],
  });

  it("labels the travel row with the visit count, like the Stripe line item", async () => {
    bookingsGet.mockResolvedValue({ empty: true, docs: [] });
    paymentsGet.mockResolvedValue(pay({ visitType: "home", travelFeePence: 6000 }));
    expect((await getReceiptBySession("cs_b4"))!.travelFeeLabel).toBe("Travel fee (4 home visits × £15)");
  });

  it("falls back to a plain label for a service it does not recognise", async () => {
    bookingsGet.mockResolvedValue({ empty: true, docs: [] });
    paymentsGet.mockResolvedValue(pay({ service: "legacy", visitType: "home", travelFeePence: 1500 }));
    expect((await getReceiptBySession("cs_x"))!.travelFeeLabel).toBe("Travel fee (home visit)");
  });

  it("has no travel label for a video receipt", async () => {
    bookingsGet.mockResolvedValue({ empty: true, docs: [] });
    paymentsGet.mockResolvedValue(pay({ amountPence: 12000 }));
    expect((await getReceiptBySession("cs_v"))!.travelFeeLabel).toBe("");
  });
});
