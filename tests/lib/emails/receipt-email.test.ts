import { afterEach, describe, expect, it, vi } from "vitest";
import { sendReceiptEmail } from "@/lib/emails/receipt-email";
import { sessionPricePence } from "@/lib/home-visit-pricing";
import { formatGbp } from "@/lib/invoice";

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

  it("includes the PDF attachment when provided", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendReceiptEmail({
      to: "ada@example.com", patientName: "Ada", invoiceNumber: "INV-2026-AB12CD34",
      serviceLabel: "Initial Online Assessment", amountPence: 5000,
      receiptUrl: "https://site.test/book/receipt/cs_1",
      pdf: { filename: "invoice-INV-2026-AB12CD34.pdf", base64: "JVBERi0x" },
    });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.attachments[0].filename).toBe("invoice-INV-2026-AB12CD34.pdf");
    expect(body.attachments[0].content).toBe("JVBERi0x");
  });

  it("names the home visit address for a home visit", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendReceiptEmail({ ...INPUT, visitType: "home", homeVisitAddress: "7 Example <Street>, G31 4HS" });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.html).toContain("Home visit at 7 Example &lt;Street&gt;, G31 4HS");
    expect(body.text).toContain("Home visit at 7 Example <Street>, G31 4HS");
    expect(body.html).not.toContain("Join your appointment");
  });

  it("adds no visit line for a video booking", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendReceiptEmail({ ...INPUT, visitType: "video" });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.html).not.toContain("Home visit");
  });

  it("shows a home visit's whole price as the amount paid, with no travel line", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const homePence = sessionPricePence("initial-assessment", "home");
    await sendReceiptEmail({
      to: "ada@example.com", patientName: "Ada", invoiceNumber: "INV-1",
      serviceLabel: "Initial Assessment (home visit)", amountPence: homePence,
      receiptUrl: "https://x/receipt", visitType: "home", homeVisitAddress: "7 Example Street, G31 4HS",
    });
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.html).toContain(`Amount paid:</strong> ${formatGbp(homePence)}`);
    expect(sent.text).toContain(`Amount paid: ${formatGbp(homePence)}`);
    expect(sent.html).not.toMatch(/travel/i);
    expect(sent.text).not.toMatch(/travel/i);
    // The video part of the price is never shown as its own amount.
    expect(sent.text).not.toContain(formatGbp(sessionPricePence("initial-assessment")));
  });

  it("shows no travel fee for a video booking", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendReceiptEmail({ ...INPUT, visitType: "video" });
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.html).not.toContain("Travel fee");
    expect(sent.text).not.toContain("Travel fee");
  });

  it("shows a home bundle's whole price once, with no per-visit travel line", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const bundlePence = sessionPricePence("bundle-4", "home");
    await sendReceiptEmail({
      ...INPUT, serviceLabel: "4 Session Bundle (home visits)", amountPence: bundlePence,
      visitType: "home", homeVisitAddress: "7 Example Street, G31 4HS",
    });
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.html).toContain(`Amount paid:</strong> ${formatGbp(bundlePence)}`);
    expect(sent.text).toContain(`Amount paid: ${formatGbp(bundlePence)}`);
    expect(sent.html).not.toMatch(/travel/i);
    expect(sent.text).not.toMatch(/travel/i);
  });
});
