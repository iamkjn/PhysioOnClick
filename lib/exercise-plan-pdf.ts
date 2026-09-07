import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { invoiceIssuer, founder } from "@/lib/site-data";
import { PRACTICE_PHONE } from "@/lib/structured-data";

export type ExercisePlanCard = {
  index: number;
  title: string;
  imageBytes: Uint8Array | null;
  setup: string | null;
  steps: string[];
  cues: string[];
  safetyLine: string | null;
  doseText: string;
  physioNote: string | null;
};

export type ExercisePlanPdfInput = {
  patientName: string;
  physioName: string;
  sessionDateISO: string | null;
  cards: ExercisePlanCard[];
};

const DOT = "·"; // middle dot — WinAnsi-safe separator

// ── Palette (mirrors lib/invoice-pdf.ts — "The Clarity System") ───────────
const INK = rgb(4 / 255, 50 / 255, 70 / 255);
const MUTED = rgb(0x64 / 255, 0x73 / 255, 0x7d / 255);
const SKY = rgb(0x0e / 255, 0xa5 / 255, 0xe9 / 255);
const TAGLINE = rgb(0xd7 / 255, 0xea / 255, 0xf2 / 255);
const COVER_META = rgb(0x9d / 255, 0xbe / 255, 0xd0 / 255); // dimmed-white for the cover credential line
const CARD_FILL = rgb(0xf8 / 255, 0xfa / 255, 0xfb / 255);
const CARD_BORDER = rgb(0xd8 / 255, 0xe8 / 255, 0xef / 255);
const SAFETY_FILL = rgb(0xff / 255, 0xf4 / 255, 0xf2 / 255);
const SAFETY_BORDER = rgb(0xf3 / 255, 0xd6 / 255, 0xd0 / 255);
const SAFETY_INK = rgb(0xa8 / 255, 0x3a / 255, 0x2c / 255);
const FOOTER_RULE = rgb(0xe6 / 255, 0xee / 255, 0xf2 / 255);
const WHITE = rgb(1, 1, 1);

const PAGE: [number, number] = [595.28, 841.89]; // A4 portrait (pt)
const MARGIN = 40;
const PAD = 18; // card inner padding
const BADGE = 24; // number-badge diameter
const IMG = 120; // embedded illustration box (square)
const IMG_GAP = 16;
const CARD_GAP = 16;
const COVER_H = 176;
const BOTTOM_MARGIN = 78; // clearance above the footer band
const TOP_MARGIN = 46; // top of content on continuation pages

// Text sizes
const T_TITLE = 13.5;
const T_SETUP = 9.5;
const T_STEP = 10;
const T_CUE = 10;
const T_SAFETY = 9.5;
const T_DOSE = 11.5;
const T_NOTE = 9;
const T_FOOTER = 7.5;

const leading = (size: number): number => size * 1.34;

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Helvetica's StandardFont uses WinAnsi, which cannot encode characters
 * outside Latin-1 (a stray emoji, or a "checkmark" pasted into a physio's
 * free-text note, would otherwise throw and kill the whole build). Normalise
 * smart punctuation, then drop anything WinAnsi can't represent. Cue
 * checkmarks are drawn as vector strokes, so no glyph is needed for them. */
function pdfSafe(text: string): string {
  return text
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** A rounded-rectangle SVG path anchored at the shape's top-left corner with y
 * increasing downward — pdf-lib has no native rounded rect (copied from
 * lib/invoice-pdf.ts). */
function roundedRectPath(w: number, h: number, r: number): string {
  return `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
}

/** Word-wrap `text` to `maxWidth` using the font's own metrics. A single word
 * wider than `maxWidth` is left to overflow rather than hard-broken. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let line = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${line} ${words[i]}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}

type CardLayout = {
  height: number;
  hasImage: boolean;
  titleLines: string[];
  setupLines: string[];
  stepLines: string[][];
  cueLines: string[][];
  safetyLines: string[];
  doseLines: string[];
  noteLines: string[];
};

function layoutCard(
  card: ExercisePlanCard,
  font: PDFFont,
  bold: PDFFont,
  pageWidth: number,
  withImage: boolean
): CardLayout {
  const innerLeft = MARGIN + PAD;
  const innerRight = pageWidth - MARGIN - PAD;
  const titleX = innerLeft + BADGE + 10;
  const titleWidth = innerRight - titleX;

  const bodyX = withImage ? innerLeft + IMG + IMG_GAP : innerLeft;
  const bodyWidth = innerRight - bodyX;

  const titleLines = wrapText(pdfSafe(card.title) || "Exercise", bold, T_TITLE, titleWidth);
  const setupLines = card.setup ? wrapText(pdfSafe(card.setup), font, T_SETUP, bodyWidth) : [];
  const stepLines = card.steps
    .map((s) => pdfSafe(s))
    .filter(Boolean)
    .map((s, i) => wrapText(`${i + 1}. ${s}`, font, T_STEP, bodyWidth));
  const cueLines = card.cues
    .map((c) => pdfSafe(c))
    .filter(Boolean)
    .map((c) => wrapText(c, font, T_CUE, bodyWidth - (T_CUE + 4)));
  const safetyLines = card.safetyLine
    ? wrapText(pdfSafe(card.safetyLine), font, T_SAFETY, bodyWidth - 16)
    : [];
  const doseLines = wrapText(
    pdfSafe(card.doseText) || "As advised by your physio",
    bold,
    T_DOSE,
    bodyWidth,
  );
  const noteLines = card.physioNote
    ? wrapText(`Physio note: ${pdfSafe(card.physioNote)}`, font, T_NOTE, bodyWidth)
    : [];

  let body = 0;
  if (setupLines.length) body += setupLines.length * leading(T_SETUP) + 8;
  if (stepLines.length) {
    for (const s of stepLines) body += s.length * leading(T_STEP) + 3;
    body += 5;
  }
  if (cueLines.length) {
    for (const c of cueLines) body += c.length * leading(T_CUE) + 3;
    body += 5;
  }
  if (safetyLines.length) body += safetyLines.length * leading(T_SAFETY) + 14 + 10;
  body += doseLines.length * leading(T_DOSE) + 6;
  if (noteLines.length) body += noteLines.length * leading(T_NOTE) + 4;

  const titleRowH = Math.max(BADGE, titleLines.length * leading(T_TITLE));
  const contentH = withImage ? Math.max(body, IMG) : body;
  const height = PAD + titleRowH + 12 + contentH + PAD;

  return {
    height,
    hasImage: withImage,
    titleLines,
    setupLines,
    stepLines,
    cueLines,
    safetyLines,
    doseLines,
    noteLines,
  };
}

/** A checkmark drawn as two strokes — WinAnsi has no glyph for one. `(x, y)` is
 * the baseline-left of the accompanying text; `s` is roughly the cap height. */
function drawCheck(page: PDFPage, x: number, y: number, s: number, color: ReturnType<typeof rgb>): void {
  page.drawLine({ start: { x, y: y + s * 0.34 }, end: { x: x + s * 0.38, y }, thickness: 1.3, color });
  page.drawLine({ start: { x: x + s * 0.38, y }, end: { x: x + s, y: y + s * 0.92 }, thickness: 1.3, color });
}

function drawCard(
  page: PDFPage,
  topY: number,
  card: ExercisePlanCard,
  layout: CardLayout,
  font: PDFFont,
  bold: PDFFont,
  image: PDFImage | null,
  pageWidth: number
): void {
  const cardLeft = MARGIN;
  const cardWidth = pageWidth - MARGIN * 2;
  const innerLeft = cardLeft + PAD;
  const innerRight = pageWidth - MARGIN - PAD;
  const bodyX = layout.hasImage ? innerLeft + IMG + IMG_GAP : innerLeft;
  const bodyWidth = innerRight - bodyX;

  // Card background
  page.drawSvgPath(roundedRectPath(cardWidth, layout.height, 12), {
    x: cardLeft,
    y: topY,
    color: CARD_FILL,
    borderColor: CARD_BORDER,
    borderWidth: 1,
  });

  // Number badge
  const badgeCX = innerLeft + BADGE / 2;
  const badgeCY = topY - PAD - BADGE / 2;
  page.drawCircle({ x: badgeCX, y: badgeCY, size: BADGE / 2, color: SKY });
  const num = String(card.index);
  page.drawText(num, {
    x: badgeCX - bold.widthOfTextAtSize(num, 11) / 2,
    y: badgeCY - 4,
    size: 11,
    font: bold,
    color: WHITE,
  });

  // Title
  const titleX = innerLeft + BADGE + 10;
  let cursor = topY - PAD;
  for (const line of layout.titleLines) {
    page.drawText(line, { x: titleX, y: cursor - T_TITLE, size: T_TITLE, font: bold, color: INK });
    cursor -= leading(T_TITLE);
  }

  const titleRowH = Math.max(BADGE, layout.titleLines.length * leading(T_TITLE));
  let bodyCursor = topY - PAD - titleRowH - 12;

  // Illustration in the left gutter
  if (image) {
    page.drawImage(image, { x: innerLeft, y: bodyCursor - IMG, width: IMG, height: IMG });
  }

  const drawBlock = (
    lines: string[],
    x: number,
    size: number,
    f: PDFFont,
    color: ReturnType<typeof rgb>
  ): void => {
    for (const line of lines) {
      page.drawText(line, { x, y: bodyCursor - size, size, font: f, color });
      bodyCursor -= leading(size);
    }
  };

  if (layout.setupLines.length) {
    drawBlock(layout.setupLines, bodyX, T_SETUP, font, MUTED);
    bodyCursor -= 8;
  }

  if (layout.stepLines.length) {
    for (const step of layout.stepLines) {
      drawBlock(step, bodyX, T_STEP, font, INK);
      bodyCursor -= 3;
    }
    bodyCursor -= 2;
  }

  if (layout.cueLines.length) {
    for (const cue of layout.cueLines) {
      drawCheck(page, bodyX, bodyCursor - T_CUE + 1, T_CUE - 2, SKY);
      drawBlock(cue, bodyX + T_CUE + 4, T_CUE, font, INK);
      bodyCursor -= 3;
    }
    bodyCursor -= 2;
  }

  if (layout.safetyLines.length) {
    const boxH = layout.safetyLines.length * leading(T_SAFETY) + 14;
    page.drawSvgPath(roundedRectPath(bodyWidth, boxH, 6), {
      x: bodyX,
      y: bodyCursor,
      color: SAFETY_FILL,
      borderColor: SAFETY_BORDER,
      borderWidth: 1,
    });
    let inner = bodyCursor - 7;
    for (const line of layout.safetyLines) {
      page.drawText(line, { x: bodyX + 8, y: inner - T_SAFETY, size: T_SAFETY, font, color: SAFETY_INK });
      inner -= leading(T_SAFETY);
    }
    bodyCursor -= boxH + 10;
  }

  drawBlock(layout.doseLines, bodyX, T_DOSE, bold, INK);
  bodyCursor -= 6;

  if (layout.noteLines.length) {
    drawBlock(layout.noteLines, bodyX, T_NOTE, font, MUTED);
  }
}

function drawCover(page: PDFPage, input: ExercisePlanPdfInput, font: PDFFont, bold: PDFFont): void {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - COVER_H, width, height: COVER_H, color: INK });
  page.drawRectangle({ x: 0, y: height - COVER_H, width, height: 4, color: SKY });

  // "P" mark + wordmark
  const markCX = MARGIN + 15;
  const markCY = height - 34;
  page.drawCircle({ x: markCX, y: markCY, size: 15, color: SKY });
  page.drawText("P", {
    x: markCX - bold.widthOfTextAtSize("P", 16) / 2,
    y: markCY - 6,
    size: 16,
    font: bold,
    color: WHITE,
  });
  page.drawText("PhysioOnClick", { x: markCX + 26, y: markCY - 6, size: 15, font: bold, color: WHITE });

  page.drawText("Your Exercise Plan", { x: MARGIN, y: height - 80, size: 26, font: bold, color: WHITE });

  const patient = pdfSafe(input.patientName) || "you";
  page.drawText(`For ${patient}`, { x: MARGIN, y: height - 106, size: 12, font, color: TAGLINE });

  const physio = pdfSafe(input.physioName) || "your physiotherapist";
  const dstr = fmtDate(input.sessionDateISO);
  const sessionLine = dstr
    ? `From your session on ${dstr} with ${physio}`
    : `From your session with ${physio}`;
  page.drawText(sessionLine, { x: MARGIN, y: height - 123, size: 10, font, color: TAGLINE });

  const creds = pdfSafe(`${founder.credentials[0]} ${DOT} ${founder.credentials[1]}`);
  page.drawText(creds, { x: MARGIN, y: height - 139, size: 8.5, font, color: COVER_META });

  page.drawText(`Move Better ${DOT} Live Brighter`, {
    x: MARGIN,
    y: height - 160,
    size: 9,
    font: bold,
    color: SKY,
  });
}

function drawFooters(pdf: PDFDocument, font: PDFFont): void {
  const pages = pdf.getPages();
  const line = pdfSafe(
    `${invoiceIssuer.tradingName} ${DOT} ${invoiceIssuer.addressLines.join(", ")} ${DOT} ${PRACTICE_PHONE} ${DOT} hello@physioonclick.co.uk`
  );
  pages.forEach((page, i) => {
    const { width } = page.getSize();
    const right = width - MARGIN;
    page.drawLine({
      start: { x: MARGIN, y: 52 },
      end: { x: right, y: 52 },
      thickness: 1,
      color: FOOTER_RULE,
    });
    page.drawText(line, { x: MARGIN, y: 38, size: T_FOOTER, font, color: MUTED });
    page.drawText(`Small Steps ${DOT} Big Progress`, { x: MARGIN, y: 25, size: T_FOOTER, font, color: MUTED });
    const label = `Page ${i + 1} of ${pages.length}`;
    page.drawText(label, {
      x: right - font.widthOfTextAtSize(label, T_FOOTER),
      y: 25,
      size: T_FOOTER,
      font,
      color: MUTED,
    });
    page.drawRectangle({ x: 0, y: 0, width, height: 4, color: SKY });
  });
}

export async function buildExercisePlanPdf(input: ExercisePlanPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage(PAGE);
  const { width, height } = page.getSize();

  drawCover(page, input, font, bold);
  let y = height - COVER_H - 22;

  for (const card of input.cards) {
    // Embed the illustration, tolerating a corrupt PNG (render as if no image).
    let image: PDFImage | null = null;
    if (card.imageBytes != null) {
      try {
        image = await pdf.embedPng(card.imageBytes);
      } catch {
        image = null;
      }
    }

    const layout = layoutCard(card, font, bold, width, image != null);

    // A card taller than a whole page still gets drawn (overflowing the
    // footer) — it only triggers one page break, never an infinite loop.
    if (y - layout.height < BOTTOM_MARGIN) {
      page = pdf.addPage(PAGE);
      y = height - TOP_MARGIN;
    }

    drawCard(page, y, card, layout, font, bold, image, width);
    y -= layout.height + CARD_GAP;
  }

  drawFooters(pdf, font);

  return pdf.save();
}
