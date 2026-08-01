import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { invoiceIssuer } from "@/lib/site-data";
import { formatGbp, issuerField } from "@/lib/invoice";

export type InvoicePdfInput = {
  invoiceNumber: string;
  paidAtISO: string;
  amountPence: number;
  serviceLabel: string;
  patientName: string;
  patientEmail: string;
  sessionDateISO: string | null;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export async function generateInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 portrait (pt)
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.09, 0.12, 0.18);
  const muted = rgb(0.4, 0.44, 0.5);
  const { height, width } = page.getSize();
  const left = 56;
  let y = height - 64;

  const line = (text: string, opts: { size?: number; f?: typeof font; color?: typeof ink; x?: number } = {}) => {
    page.drawText(text, { x: opts.x ?? left, y, size: opts.size ?? 10, font: opts.f ?? font, color: opts.color ?? ink });
  };
  const right = (text: string, size = 10, f = font, color = ink) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: width - 56 - w, y, size, font: f, color });
  };

  // Issuer header
  line(invoiceIssuer.tradingName, { size: 18, f: bold });
  right("RECEIPT", 16, bold, muted);
  y -= 20;
  line(invoiceIssuer.legalName, { color: muted });
  y -= 14;
  for (const l of invoiceIssuer.addressLines.filter(Boolean)) { line(l, { color: muted }); y -= 13; }
  line(invoiceIssuer.contactEmail, { color: muted });
  y -= 22;
  line(`Registration: HCPC ${issuerField(invoiceIssuer.hcpcNumber)}  ·  CSP ${issuerField(invoiceIssuer.cspNumber)}`, { size: 9, color: muted });
  y -= 26;

  // Invoice meta
  line(`Invoice: ${input.invoiceNumber}`, { f: bold });
  y -= 14;
  line(`Date paid: ${fmtDate(input.paidAtISO)}`);
  y -= 14;
  line(`Patient: ${input.patientName || input.patientEmail}`);
  y -= 28;

  // Table header
  line("Service", { f: bold });
  page.drawText("Session date", { x: 300, y, size: 10, font: bold, color: ink });
  right("Amount", 10, bold);
  y -= 6;
  page.drawLine({ start: { x: left, y }, end: { x: width - 56, y }, thickness: 0.75, color: muted });
  y -= 16;

  // Row
  line(input.serviceLabel);
  page.drawText(fmtDate(input.sessionDateISO), { x: 300, y, size: 10, font, color: ink });
  right(formatGbp(input.amountPence));
  y -= 22;
  page.drawLine({ start: { x: left, y }, end: { x: width - 56, y }, thickness: 0.75, color: muted });
  y -= 18;

  // Total
  line("Total paid", { f: bold });
  right(formatGbp(input.amountPence), 11, bold);
  y -= 30;

  line("Paid by card via Stripe.", { color: muted });
  y -= 16;
  line(invoiceIssuer.vatStatus, { size: 9, color: muted });

  return pdf.save();
}
