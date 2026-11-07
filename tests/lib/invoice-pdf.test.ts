import zlib from "node:zlib";
import { describe, expect, it } from "vitest";
import { generateInvoicePdf, invoiceDeliveryLine, invoiceLineItems, type InvoicePdfInput } from "@/lib/invoice-pdf";
import { formatGbp } from "@/lib/invoice";
import { sessionPricePence } from "@/lib/home-visit-pricing";

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

// A home visit is one whole price (lib/home-visit-pricing): the invoice prints
// a single service row at the whole amount paid, never a separate travel row.
describe("invoice line items", () => {
  const HOME_PENCE = sessionPricePence("initial-assessment", "home");
  const HOME_BUNDLE_PENCE = sessionPricePence("bundle-4", "home");

  it("is one row at the whole amount for a home visit, a home bundle and a video booking", () => {
    expect(invoiceLineItems({ amountPence: HOME_PENCE, serviceLabel: "Initial Assessment (home visit)" })).toEqual([
      { label: "Initial Assessment (home visit)", amountPence: HOME_PENCE },
    ]);
    expect(invoiceLineItems({ amountPence: HOME_BUNDLE_PENCE, serviceLabel: "4 Session Bundle (home visits)" })).toEqual([
      { label: "4 Session Bundle (home visits)", amountPence: HOME_BUNDLE_PENCE },
    ]);
    expect(invoiceLineItems({ amountPence: 4000, serviceLabel: "Initial Online Assessment" })).toEqual([
      { label: "Initial Online Assessment", amountPence: 4000 },
    ]);
  });

  it("prints a home visit at its whole price with no travel row", async () => {
    const content = pdfContent(
      await generateInvoicePdf({
        ...BASE_INPUT,
        amountPence: HOME_PENCE,
        serviceLabel: "Initial Assessment (home visit)",
        visitType: "home",
      })
    );
    expect(content).toContain(hex(formatGbp(HOME_PENCE)));
    // The video part of the price is never printed as its own row.
    expect(content).not.toContain(hex(formatGbp(sessionPricePence("initial-assessment"))));
    expect(content).not.toContain(hex("Travel"));
    expect(content).not.toContain(hex("travel"));
  });

  it("prints a home bundle at its whole price with no travel row", async () => {
    const content = pdfContent(
      await generateInvoicePdf({
        ...BASE_INPUT,
        amountPence: HOME_BUNDLE_PENCE,
        serviceLabel: "4 Session Bundle (home visits)",
        visitType: "home",
      })
    );
    expect(content).toContain(hex(formatGbp(HOME_BUNDLE_PENCE)));
    expect(content).not.toContain(hex(formatGbp(sessionPricePence("bundle-4"))));
    expect(content).not.toContain(hex("Travel"));
  });

  it("prints no travel row on a video invoice", async () => {
    const content = pdfContent(await generateInvoicePdf(BASE_INPUT));
    expect(content).not.toContain(hex("Travel"));
  });
});
