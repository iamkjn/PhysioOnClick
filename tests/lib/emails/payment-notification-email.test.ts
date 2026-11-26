import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendPaymentNotification } from "@/lib/emails/payment-notification-email";

const BASE = {
  amountPence: 8000,
  patientName: "Ada <b>Lovelace</b>",
  patientEmail: "ada@example.com",
  serviceLabel: "Home visit assessment",
  paidAtISO: "2026-11-26T12:00:00.000Z",
  stripeSessionId: "cs_1",
};

const fetchMock = vi.fn();
const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body);

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("PAYMENT_NOTIFY_EMAIL", "owner@example.com");
  fetchMock.mockReset().mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sendPaymentNotification", () => {
  it("emails the owner the payment details with the invoice attached", async () => {
    const result = await sendPaymentNotification({
      ...BASE,
      invoiceNumber: "INV-2026-ABC",
      appointmentISO: "2026-12-01T15:00:00.000Z",
      visitType: "home",
      homeVisitAddress: "1 High Street, Glasgow",
      pdf: { filename: "invoice-INV-2026-ABC.pdf", base64: "JVBERg==" },
    });
    expect(result).toEqual({ sent: true });
    const body = sentBody();
    expect(body.to).toEqual(["owner@example.com"]);
    expect(body.subject).toBe("Payment received: £80.00 from Ada <b>Lovelace</b> (INV-2026-ABC)");
    expect(body.text).toContain("ada@example.com");
    expect(body.text).toContain("Home visit assessment");
    expect(body.text).toContain("1 High Street, Glasgow");
    expect(body.text).toContain("1 December 2026");
    expect(body.text).toContain("15:00");
    expect(body.html).not.toContain("<b>Lovelace</b>");
    expect(body.attachments).toEqual([{ filename: "invoice-INV-2026-ABC.pdf", content: "JVBERg==" }]);
  });

  it("flags money taken without a booking as action needed", async () => {
    await sendPaymentNotification({ ...BASE, problem: "slot_unavailable" });
    const body = sentBody();
    expect(body.subject).toContain("Action needed");
    expect(body.text).toContain("refund");
    expect(body.text).toContain("cs_1");
    expect(body.attachments).toBeUndefined();
  });

  it("sends nothing when no owner address is configured", async () => {
    vi.stubEnv("PAYMENT_NOTIFY_EMAIL", "");
    expect(await sendPaymentNotification(BASE)).toEqual({ sent: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never throws when the email service is down", async () => {
    fetchMock.mockRejectedValue(new Error("down"));
    expect(await sendPaymentNotification(BASE)).toEqual({ sent: false });
  });
});
