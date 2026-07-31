import { afterEach, describe, expect, it, vi } from "vitest";
import { sendReceiptEmail } from "@/lib/emails/receipt-email";

const INPUT = {
  to: "ada@example.com", patientName: "Ada", invoiceNumber: "INV-2026-AB12CD",
  serviceLabel: "Initial Assessment", amountPence: 5000,
  receiptUrl: "https://site.test/book/receipt/cs_1",
};

afterEach(() => vi.restoreAllMocks());

describe("sendReceiptEmail", () => {
  it("skips (no throw) when RESEND_API_KEY is unset", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const r = await sendReceiptEmail(INPUT);
    expect(r).toEqual({ sent: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to Resend with the invoice details when configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const r = await sendReceiptEmail(INPUT);
    expect(r).toEqual({ sent: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.to).toContain("ada@example.com");
    expect(JSON.stringify(body)).toContain("INV-2026-AB12CD");
    expect(JSON.stringify(body)).toContain("https://site.test/book/receipt/cs_1");
  });
});
