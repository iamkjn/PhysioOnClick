import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { invoiceIssuer, founder } from "@/lib/site-data";
import { PRACTICE_PHONE } from "@/lib/structured-data";
import { formatGbp, issuerField } from "@/lib/invoice";
import { INVOICE_AVATAR_PNG_BASE64 } from "@/lib/invoice-avatar";

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

// Ported 1:1 from scripts/pdf/build-professional-invoice.py (reportlab), which
// the practice picked as the canonical receipt design — this is the pdf-lib
// equivalent so it can run at request time (Workers-safe, no filesystem).
const INK = rgb(4 / 255, 50 / 255, 70 / 255);
const MUTED = rgb(0x64 / 255, 0x73 / 255, 0x7d / 255);
const BLUE = rgb(0x0a / 255, 0x77 / 255, 0xa8 / 255);
const SKY = rgb(0x0e / 255, 0xa5 / 255, 0xe9 / 255);
const WASH = rgb(0xea / 255, 0xf6 / 255, 0xfb / 255);
const BORDER = rgb(0xd8 / 255, 0xe8 / 255, 0xef / 255);
const TAGLINE = rgb(0xd7 / 255, 0xea / 255, 0xf2 / 255);
const META_FILL = rgb(0xf8 / 255, 0xfa / 255, 0xfb / 255);
const META_BORDER = rgb(0xed / 255, 0xf3 / 255, 0xf6 / 255);
const TOTAL_BORDER = rgb(0xcf / 255, 0xe7 / 255, 0xf1 / 255);
const NOTE_FILL = rgb(0xf3 / 255, 0xfb / 255, 0xfe / 255);
const NOTE_BORDER = rgb(0xd7 / 255, 0xed / 255, 0xf6 / 255);
const FOOTER_RULE = rgb(0xe6 / 255, 0xee / 255, 0xf2 / 255);
const WHITE = rgb(1, 1, 1);

const MARGIN = 40;

function tracked(text: string): string {
  return text.toUpperCase();
}

/** `Buffer` is a Node-only global whose `instanceof Uint8Array` check can
 * fail across realms (e.g. Vitest's jsdom environment) even though it holds
 * the right bytes — decoding through `atob`, global in Node, Workers and
 * jsdom alike, avoids that entirely and keeps this Workers-safe besides. */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** A rounded-rectangle path, anchored at the shape's own top-left corner with
 * y increasing downward (SVG convention) — pdf-lib has no native rounded
 * rect, so card/panel backgrounds go through drawSvgPath instead. */
function roundedRectPath(w: number, h: number, r: number): string {
  return `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
}

export async function generateInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 portrait (pt)
  const { width, height: pageHeight } = page.getSize();
  const right = width - MARGIN;

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const textAt = (
    text: string,
    x: number,
    y: number,
    opts: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb> } = {}
  ) => {
    page.drawText(text, { x, y, size: opts.size ?? 10, font: opts.f ?? font, color: opts.color ?? INK });
  };
  const textRight = (
    text: string,
    xEnd: number,
    y: number,
    opts: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb> } = {}
  ) => {
    const size = opts.size ?? 10;
    const f = opts.f ?? font;
    textAt(text, xEnd - f.widthOfTextAtSize(text, size), y, { ...opts, size, f });
  };
  const label = (text: string, x: number, y: number) => {
    textAt(tracked(text), x, y, { f: bold, size: 8, color: BLUE });
  };
  const rule = (y: number, color: ReturnType<typeof rgb> = BORDER, lineWidth = 1) => {
    page.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness: lineWidth, color });
  };
  /** `y` is the rectangle's bottom edge, matching drawRectangle's convention. */
  const roundedRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill: ReturnType<typeof rgb>,
    stroke: ReturnType<typeof rgb>
  ) => {
    page.drawSvgPath(roundedRectPath(w, h, r), { x, y: y + h, color: fill, borderColor: stroke, borderWidth: 1 });
  };

  // ── Header ───────────────────────────────────────────────────────────
  const headerH = 118;
  page.drawRectangle({ x: 0, y: pageHeight - headerH, width, height: headerH, color: INK });
  page.drawRectangle({ x: 0, y: pageHeight - headerH, width, height: 4, color: SKY });

  const avatarImage = await pdf.embedPng(base64ToUint8Array(INVOICE_AVATAR_PNG_BASE64));
  page.drawImage(avatarImage, { x: MARGIN, y: pageHeight - 74, width: 34, height: 34 });

  textAt("PhysioOnClick", MARGIN + 46, pageHeight - 54, { f: bold, size: 22, color: WHITE });
  textAt("Online Physiotherapy Across the UK", MARGIN + 46, pageHeight - 74, { size: 11, color: TAGLINE });
  textRight("RECEIPT", right, pageHeight - 50, { f: bold, size: 20, color: SKY });
  textRight(input.invoiceNumber, right, pageHeight - 72, { size: 11, color: TAGLINE });

  // ── Billed to / Issued by ────────────────────────────────────────────
  // Two separate cards (not one merged panel) — fixed height, since the
  // address block is static site content and never actually varies in line
  // count, which keeps every section below at a deterministic offset.
  const cardTop = pageHeight - 154;
  const cardH = 154;
  const cardGap = 16;
  const cardW = (right - MARGIN - cardGap) / 2;
  const cardBottom = cardTop - cardH;

  roundedRect(MARGIN, cardBottom, cardW, cardH, 10, WHITE, BORDER);
  roundedRect(MARGIN + cardW + cardGap, cardBottom, cardW, cardH, 10, WHITE, BORDER);

  const bx = MARGIN + 18;
  const by = cardTop - 28;
  label("Billed to", bx, by);
  textAt(input.patientName || input.patientEmail, bx, by - 24, { f: bold, size: 14 });
  if (input.patientName) {
    textAt(input.patientEmail, bx, by - 44, { size: 10, color: MUTED });
  }

  const ix = MARGIN + cardW + cardGap + 18;
  label("Issued by", ix, by);
  textAt(invoiceIssuer.legalName, ix, by - 24, { f: bold, size: 14 });
  // Static 4-line site address collapsed to 3 display lines (street / city +
  // postcode / country), matching how a real letterhead groups them.
  const [street, city, postcode, country] = invoiceIssuer.addressLines;
  textAt(street, ix, by - 44, { size: 10, color: MUTED });
  textAt(`${city}, ${postcode}`, ix, by - 60, { size: 10, color: MUTED });
  textAt(country, ix, by - 76, { size: 10, color: MUTED });
  textAt(`HCPC ${issuerField(invoiceIssuer.hcpcNumber)}  |  CSP ${issuerField(invoiceIssuer.cspNumber)}`, ix, by - 100, {
    size: 9.2,
  });
  textAt(`${PRACTICE_PHONE}  |  ${invoiceIssuer.contactEmail}`, ix, by - 116, { size: 8.5, color: MUTED });

  // ── Payment summary strip ────────────────────────────────────────────
  let y = cardBottom - 26;
  const metaH = 68;
  roundedRect(MARGIN, y - metaH, right - MARGIN, metaH, 10, META_FILL, META_BORDER);
  const colW = (right - MARGIN) / 3;
  const metaItems: [string, string][] = [
    ["Date paid", fmtDate(input.paidAtISO)],
    ["Payment method", "Card via Stripe"],
    ["Status", "Paid in full"],
  ];
  metaItems.forEach(([head, value], i) => {
    const x = MARGIN + 18 + colW * i;
    label(head, x, y - 24);
    textAt(value, x, y - 50, { f: bold, size: 13 });
  });
  y -= metaH;

  // ── Service details ──────────────────────────────────────────────────
  y -= 34;
  textAt("Service details", MARGIN, y, { f: bold, size: 14 });
  y -= 26;

  label("Service", MARGIN, y);
  label("Session date", MARGIN + 270, y);
  label("Amount", right - 68, y);
  rule(y - 14, INK, 1.2);

  const rowY = y - 46;
  textAt(input.serviceLabel, MARGIN, rowY, { f: bold, size: 12.5 });
  textAt("Delivered online via secure video consultation.", MARGIN, rowY - 17, { size: 9.3, color: MUTED });
  textAt(fmtDate(input.sessionDateISO), MARGIN + 270, rowY, { size: 11.5, color: MUTED });
  textRight(formatGbp(input.amountPence), right, rowY, { f: bold, size: 12.5 });
  rule(rowY - 34);

  const totalW = 218;
  const totalH = 82;
  const totalX = right - totalW;
  const totalY = rowY - 126;
  roundedRect(totalX, totalY, totalW, totalH, 10, WASH, TOTAL_BORDER);
  label("Total paid", totalX + 18, totalY + totalH - 28);
  textRight(formatGbp(input.amountPence), totalX + totalW - 18, totalY + 24, { f: bold, size: 22 });

  textAt(invoiceIssuer.vatStatus, MARGIN, totalY + 45, { size: 9.8, color: MUTED });
  y = totalY;

  // ── Thank-you note ───────────────────────────────────────────────────
  y -= 18;
  const noteH = 74;
  roundedRect(MARGIN, y - noteH, right - MARGIN, noteH, 10, NOTE_FILL, NOTE_BORDER);
  textAt("Thank you for choosing PhysioOnClick.", MARGIN + 18, y - 28, { f: bold, size: 13 });
  textAt(
    "Keep this receipt for insurance or workplace expense claims — it's also always available at",
    MARGIN + 18,
    y - 44,
    { size: 9.5, color: MUTED }
  );
  textAt("physioonclick.co.uk/book/receipt using your original booking confirmation.", MARGIN + 18, y - 58, {
    size: 9.5,
    color: MUTED,
  });

  // ── Footer ───────────────────────────────────────────────────────────
  // Fixed near the page bottom, like the header — every section above it has
  // a fixed height, so there's no risk of the two colliding.
  const footerY = 40;
  rule(footerY + 28, FOOTER_RULE);
  textAt(founder.name, MARGIN, footerY + 2, { f: bold, size: 13 });
  textAt(`${founder.credentials[0]}  |  ${founder.credentials[1]}`, MARGIN, footerY - 15, { size: 8.8, color: MUTED });
  textRight(`${PRACTICE_PHONE}  |  ${invoiceIssuer.contactEmail}  |  physioonclick.co.uk`, right, footerY + 1, {
    size: 8.7,
    color: MUTED,
  });
  page.drawRectangle({ x: 0, y: 0, width, height: 4, color: SKY });

  return pdf.save();
}
