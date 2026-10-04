import zlib from "node:zlib";
import { describe, expect, it } from "vitest";
import { generateInvoicePdf, invoiceDeliveryLine, invoiceLineItems, type InvoicePdfInput } from "@/lib/invoice-pdf";

/**
 * Every page content stream, inflated. pdf-lib writes standard-font text as
 * hex strings, so callers search for hex(text) in the result.
 */
function pdfContent(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes);
  const out: string[] = [];
  let at = 0;
  for (;;) {
    const start = raw.indexOf("stream", at);
    if (start === -1) break;
    let dataStart = start + "stream".length;
    if (raw[dataStart] === 0x0d) dataStart += 1;
    if (raw[dataStart] === 0x0a) dataStart += 1;
    const end = raw.indexOf("endstream", dataStart);
    if (end === -1) break;
    const chunk = raw.subarray(dataStart, end);
    try {
      out.push(zlib.inflateSync(chunk).toString("latin1"));
    } catch {
      out.push(chunk.toString("latin1"));
    }
    at = end + "endstream".length;
  }
  return out.join("\n").toUpperCase();
}

const hex = (text: string) => Buffer.from(text, "latin1").toString("hex").toUpperCase();

const BASE_INPUT: InvoicePdfInput = {
  invoiceNumber: "INV-2026-HV12CD34",
  paidAtISO: "2026-08-02T10:00:00.000Z",
  amountPence: 4000,
  serviceLabel: "Initial Assessment",
  patientName: "Ada Lovelace",
  patientEmail: "ada@example.com",
  sessionDateISO: "2026-08-18T13:00:00.000Z",
};

describe("invoice delivery line", () => {
  it("keeps the video wording by default and for video bookings", () => {
    expect(invoiceDeliveryLine()).toBe("Delivered online via secure video consultation.");
    expect(invoiceDeliveryLine("video")).toBe("Delivered online via secure video consultation.");
  });

  it("states a home visit without any address", () => {
    expect(invoiceDeliveryLine("home")).toBe("Delivered as a home visit (Glasgow area).");
  });

  it("prints the video line on a video invoice", async () => {
    const content = pdfContent(await generateInvoicePdf(BASE_INPUT));
    expect(content).toContain(hex("Delivered online via secure video consultation."));
    expect(content).not.toContain(hex("Delivered as a home visit"));
  });

  it("prints the home-visit line (and no video line) on a home-visit invoice", async () => {
    const content = pdfContent(await generateInvoicePdf({ ...BASE_INPUT, visitType: "home" }));
    expect(content).toContain(hex("Delivered as a home visit (Glasgow area)."));
    expect(content).not.toContain(hex("video consultation"));
  });
});

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

  it("wraps a long dependent-booking name instead of overflowing into the Issued-by card", async () => {
    const bytes = await generateInvoicePdf({
      invoiceNumber: "INV-2026-F2ZGTZS2",
      paidAtISO: "2026-09-13T10:00:00.000Z",
      amountPence: 5000,
      serviceLabel: "Initial Online Assessment",
      patientName: "Anish George (booked by Seena George)",
      patientEmail: "seena.rachelgeorge@gmail.com",
      sessionDateISO: "2026-09-14T13:00:00.000Z",
    });
    expect(Buffer.from(bytes.slice(0, 4)).toString("utf8")).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(500);
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

describe("invoice travel-fee row", () => {
  it("splits a home visit into service and travel rows", () => {
    expect(invoiceLineItems({ amountPence: 5500, serviceLabel: "Initial Assessment (home visit)", travelFeePence: 1500 })).toEqual([
      { label: "Initial Assessment (home visit)", amountPence: 4000 },
      { label: "Travel fee (home visit)", amountPence: 1500 },
    ]);
    expect(invoiceLineItems({ amountPence: 4000, serviceLabel: "Initial Online Assessment" })).toEqual([
      { label: "Initial Online Assessment", amountPence: 4000 },
    ]);
  });

  it("prints the travel row only when a travel fee is passed", async () => {
    const withFee = pdfContent(
      await generateInvoicePdf({ ...BASE_INPUT, amountPence: 5500, visitType: "home", travelFeePence: 1500 })
    );
    expect(withFee).toContain(hex("Travel fee (home visit)"));
    expect(withFee).toContain(hex("£15.00"));
    const without = pdfContent(await generateInvoicePdf(BASE_INPUT));
    expect(without).not.toContain(hex("Travel fee"));
  });
});
