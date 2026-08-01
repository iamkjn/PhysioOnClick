import { describe, expect, it } from "vitest";
import { generateInvoicePdf } from "@/lib/invoice-pdf";

describe("generateInvoicePdf", () => {
  it("produces a valid PDF byte stream", async () => {
    const bytes = await generateInvoicePdf({
      invoiceNumber: "INV-2026-AB12CD34",
      paidAtISO: "2026-08-02T10:00:00.000Z",
      amountPence: 5000,
      serviceLabel: "Initial Online Assessment",
      patientName: "Ada Lovelace",
      patientEmail: "ada@example.com",
      sessionDateISO: "2026-08-18T13:00:00.000Z",
    });
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(500);
    // PDF magic header "%PDF"
    expect(Buffer.from(bytes.slice(0, 4)).toString("utf8")).toBe("%PDF");
  });

  it("does not throw when patientName is empty (falls back to email)", async () => {
    const bytes = await generateInvoicePdf({
      invoiceNumber: "INV-2026-ZZ99YY88", paidAtISO: "2026-08-02T10:00:00.000Z",
      amountPence: 4000, serviceLabel: "Online Follow-Up", patientName: "",
      patientEmail: "pat@example.com", sessionDateISO: null,
    });
    expect(Buffer.from(bytes.slice(0, 4)).toString("utf8")).toBe("%PDF");
  });
});
