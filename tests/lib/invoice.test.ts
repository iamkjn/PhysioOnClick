import { describe, expect, it } from "vitest";
import { formatGbp, issuerField, makeInvoiceNumber } from "@/lib/invoice";

describe("invoice helpers", () => {
  it("formats pence as GBP", () => {
    expect(formatGbp(5000)).toBe("£50.00");
    expect(formatGbp(4000)).toBe("£40.00");
    expect(formatGbp(0)).toBe("£0.00");
  });

  it("derives a stable invoice number from the same seed", () => {
    const a = makeInvoiceNumber("cs_test_123", new Date("2026-07-31T10:00:00Z"));
    const b = makeInvoiceNumber("cs_test_123", new Date("2026-07-31T10:00:00Z"));
    expect(a).toBe(b);
    expect(a).toMatch(/^INV-2026-[A-Z0-9]{6}$/);
  });

  it("produces different numbers for different seeds", () => {
    const a = makeInvoiceNumber("cs_a", new Date("2026-01-01T00:00:00Z"));
    const b = makeInvoiceNumber("cs_b", new Date("2026-01-01T00:00:00Z"));
    expect(a).not.toBe(b);
  });

  it("falls back to a pending marker for empty issuer fields", () => {
    expect(issuerField("")).toBe("[registration pending]");
    expect(issuerField("PH123456")).toBe("PH123456");
    expect(issuerField("", "n/a")).toBe("n/a");
  });
});
