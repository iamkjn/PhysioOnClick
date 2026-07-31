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
});
