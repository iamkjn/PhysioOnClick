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
import { sessionPricePence } from "@/lib/home-visit-pricing";
import { serviceLabelFor } from "@/lib/cal-services";

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

  it("returns the whole amount paid for a home visit, with no travel fields", async () => {
    bookingsGet.mockResolvedValue({ empty: true, docs: [] });
    const homePence = sessionPricePence("initial-assessment", "home");
    paymentsGet.mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({
        status: "paid", invoiceNumber: "INV-2026-AB12CD", paidAt: "2026-07-31T10:00:00.000Z",
        amountPence: homePence, service: "initial-assessment", email: "ada@example.com", visitType: "home",
      }) }],
    });
    const r = (await getReceiptBySession("cs_h"))!;
    expect(r.amountPence).toBe(homePence);
    expect(r).not.toHaveProperty("travelFeePence");
    expect(r).not.toHaveProperty("travelFeeLabel");
  });
});

describe("getReceiptBySession under the old split travel fee", () => {
  // Payments taken before 2026-11-07 stored travelFeePence beside the total.
  // amountPence already includes it, so the receipt shows that whole amount.
  const pay = (extra: Record<string, unknown>) => ({
    empty: false,
    docs: [{ data: () => ({
      status: "paid", invoiceNumber: "INV-2026-AB12CD", paidAt: "2026-07-31T10:00:00.000Z",
      amountPence: 18000, service: "bundle-4", email: "ada@example.com", ...extra,
    }) }],
  });

  it("shows the whole amount paid and drops the stored travel fee", async () => {
    bookingsGet.mockResolvedValue({ empty: true, docs: [] });
    paymentsGet.mockResolvedValue(pay({ visitType: "home", travelFeePence: 6000 }));
    const r = (await getReceiptBySession("cs_b4"))!;
    expect(r.amountPence).toBe(18000);
    expect(r.serviceLabel).toBe(serviceLabelFor("bundle-4", "home"));
    expect(r).not.toHaveProperty("travelFeePence");
    expect(r).not.toHaveProperty("travelFeeLabel");
    expect(JSON.stringify(r)).not.toMatch(/travel/i);
  });

  it("has no travel fields on a video receipt", async () => {
    bookingsGet.mockResolvedValue({ empty: true, docs: [] });
    paymentsGet.mockResolvedValue(pay({ amountPence: 12000 }));
    const r = (await getReceiptBySession("cs_v"))!;
    expect(r.amountPence).toBe(12000);
    expect(r).not.toHaveProperty("travelFeePence");
    expect(r).not.toHaveProperty("travelFeeLabel");
  });
});
