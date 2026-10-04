import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReceiptData } from "@/lib/patient-receipt";

const receipt = vi.hoisted(() => ({ current: null as ReceiptData | null }));
vi.mock("@/lib/patient-receipt", () => ({ getReceiptBySession: async () => receipt.current }));

import ReceiptPage from "@/app/book/receipt/[session]/page";

const BASE: ReceiptData = {
  invoiceNumber: "INV-2026-AB12CD",
  paidAt: "2026-07-31T10:00:00.000Z",
  amountPence: 18000,
  travelFeePence: 6000,
  travelFeeLabel: "Travel fee (4 home visits × £15)",
  service: "bundle-4",
  serviceLabel: "4 Session Bundle (home visits)",
  patientName: "Ada Lovelace",
  patientEmail: "ada@example.com",
  sessionDate: null,
  status: "paid",
};

async function renderReceipt(r: ReceiptData) {
  receipt.current = r;
  return render(await ReceiptPage({ params: Promise.resolve({ session: "cs_1" }) }));
}

describe("receipt page travel row", () => {
  it("labels the travel row with the visit count and no hardcoded per-visit line", async () => {
    const { container } = await renderReceipt(BASE);
    const titles = [...container.querySelectorAll(".rcpt-item-title")].map((n) => n.textContent);
    expect(titles).toEqual(["4 Session Bundle (home visits)", "Travel fee (4 home visits × £15)"]);
    expect(container.textContent).not.toContain("£15 per home visit");
    expect(container.textContent).toContain("£60.00");
    expect(container.textContent).toContain("£120.00");
  });

  it("shows no travel row for a video receipt", async () => {
    const { container } = await renderReceipt({
      ...BASE, amountPence: 12000, travelFeePence: 0, travelFeeLabel: "", serviceLabel: "4 Session Bundle",
    });
    expect([...container.querySelectorAll(".rcpt-item-title")].map((n) => n.textContent)).toEqual(["4 Session Bundle"]);
    expect(container.textContent).not.toMatch(/Travel fee/);
  });
});
