import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReceiptData } from "@/lib/patient-receipt";

const receipt = vi.hoisted(() => ({ current: null as ReceiptData | null }));
vi.mock("@/lib/patient-receipt", () => ({ getReceiptBySession: async () => receipt.current }));

import ReceiptPage from "@/app/book/receipt/[session]/page";
import { serviceLabelFor } from "@/lib/cal-services";
import { sessionPricePence } from "@/lib/home-visit-pricing";
import { formatGbp } from "@/lib/invoice";

// A home-visit bundle at its whole price (lib/home-visit-pricing): one row.
const HOME_BUNDLE_PENCE = sessionPricePence("bundle-4", "home");

const BASE: ReceiptData = {
  invoiceNumber: "INV-2026-AB12CD",
  paidAt: "2026-07-31T10:00:00.000Z",
  amountPence: HOME_BUNDLE_PENCE,
  service: "bundle-4",
  serviceLabel: serviceLabelFor("bundle-4", "home"),
  patientName: "Ada Lovelace",
  patientEmail: "ada@example.com",
  sessionDate: null,
  status: "paid",
};

async function renderReceipt(r: ReceiptData) {
  receipt.current = r;
  return render(await ReceiptPage({ params: Promise.resolve({ session: "cs_1" }) }));
}

describe("receipt page line items", () => {
  it("shows a home visit as one row at the whole price, with no travel row", async () => {
    const { container } = await renderReceipt(BASE);
    const titles = [...container.querySelectorAll(".rcpt-item-title")].map((n) => n.textContent);
    expect(titles).toEqual([serviceLabelFor("bundle-4", "home")]);
    const rows = container.querySelectorAll(".rcpt-table tbody tr");
    expect(rows).toHaveLength(1);
    expect(rows[0].querySelector("td.r")?.textContent).toBe(formatGbp(HOME_BUNDLE_PENCE));
    expect(container.querySelector(".rcpt-grand")?.textContent).toContain(formatGbp(HOME_BUNDLE_PENCE));
    // The video part of the price is never shown as its own amount.
    expect(container.textContent).not.toContain(formatGbp(sessionPricePence("bundle-4")));
    expect(container.textContent).not.toMatch(/travel/i);
  });

  it("shows one row for a video receipt", async () => {
    const videoPence = sessionPricePence("bundle-4");
    const { container } = await renderReceipt({
      ...BASE, amountPence: videoPence, serviceLabel: serviceLabelFor("bundle-4", "video"),
    });
    expect([...container.querySelectorAll(".rcpt-item-title")].map((n) => n.textContent)).toEqual([
      serviceLabelFor("bundle-4", "video"),
    ]);
    expect(container.querySelectorAll(".rcpt-table tbody tr")).toHaveLength(1);
    expect(container.querySelector(".rcpt-table td.r")?.textContent).toBe(formatGbp(videoPence));
    expect(container.textContent).not.toMatch(/travel/i);
  });
});
