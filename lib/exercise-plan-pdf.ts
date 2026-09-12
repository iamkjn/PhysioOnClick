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
const PAD = 16; // card inner padding
const BADGE = 24; // number-badge diameter
const IMG = 108; // embedded illustration box (square)
const IMG_GAP = 16;
const CARD_GAP = 13;
const COVER_H = 128;
const BOTTOM_MARGIN = 58; // clearance above the footer band
const TOP_MARGIN = 42; // top of content on continuation pages

// Text sizes
const T_TITLE = 13.5;
const T_SETUP = 9.5;
const T_STEP = 10;
const T_CUE = 10;
const T_SAFETY = 9.5;
const T_DOSE = 11.5;
const T_NOTE = 9;
const T_FOOTER = 7.5;

const leading = (size: number): number => size * 1.3;

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

/** One laid-out text line, positioned relative to the card's body top. */
type Row = {
  text: string;
  x: number; // absolute x of the text
  top: number; // distance below the body's top edge to this line's top
  size: number;
  font: PDFFont;
  color: ReturnType<typeof rgb>;
  check?: boolean; // draw a cue checkmark in the left margin of this row
};

type CardLayout = {
  height: number;
  hasVisual: boolean;
  titleLines: string[];
  preRows: Row[]; // setup + numbered steps + cues, flowing around the figure
  safety: { lines: string[]; top: number; height: number } | null;
  tailRows: Row[]; // dose + physio note, always full width
  bodyHeight: number;
};

const GAP_TITLE_BODY = 8;
const CHECK_INDENT = T_CUE + 4;

function layoutCard(
  card: ExercisePlanCard,
  font: PDFFont,
  bold: PDFFont,
  pageWidth: number,
  withVisual: boolean
): CardLayout {
  const innerLeft = MARGIN + PAD;
  const innerRight = pageWidth - MARGIN - PAD;
  const titleX = innerLeft + BADGE + 10;
  const titleWidth = innerRight - titleX;

  // Two zones: text sits in the narrow column beside the figure until it has
  // flowed past the figure's height, then reclaims the full card width.
  const narrowX = withVisual ? innerLeft + IMG + IMG_GAP : innerLeft;
  const narrowW = innerRight - narrowX;
  const fullW = innerRight - innerLeft;
  const figureZone = withVisual ? IMG + 2 : 0;

  const titleLines = wrapText(pdfSafe(card.title) || "Exercise", bold, T_TITLE, titleWidth);

  const preRows: Row[] = [];
  let y = 0;

  // A whole block (setup, the step list, the cue list) takes one width, chosen
  // by where the block *starts*: narrow beside the figure, full once the text
  // has flowed past it. Keeping each list at one width keeps it visually
  // aligned rather than stair-stepping across the figure's bottom edge.
  const addBlock = (
    paragraphs: string[],
    size: number,
    f: PDFFont,
    color: ReturnType<typeof rgb>,
    opts: { check?: boolean; gapBetween: number; gapAfter: number },
  ): void => {
    if (paragraphs.length === 0) return;
    const inZone = y < figureZone;
    const baseX = inZone ? narrowX : innerLeft;
    const indent = opts.check ? CHECK_INDENT : 0;
    const width = (inZone ? narrowW : fullW) - indent;
    paragraphs.forEach((raw, i) => {
      if (i > 0) y += opts.gapBetween;
      wrapText(raw, f, size, width).forEach((line, li) => {
        preRows.push({
          text: line,
          x: baseX + indent,
          top: y,
          size,
          font: f,
          color,
          check: opts.check && li === 0, // one tick per cue, on its first line
        });
        y += leading(size);
      });
    });
    y += opts.gapAfter;
  };

  if (card.setup) {
    addBlock([pdfSafe(card.setup)], T_SETUP, font, MUTED, { gapBetween: 0, gapAfter: 7 });
  }
  addBlock(
    card.steps.map((s, i) => `${i + 1}. ${pdfSafe(s)}`).filter((s) => s.length > 3),
    T_STEP,
    font,
    INK,
    { gapBetween: 3, gapAfter: 6 },
  );
  addBlock(
    card.cues.map((c) => pdfSafe(c)).filter(Boolean),
    T_CUE,
    font,
    INK,
    { check: true, gapBetween: 3, gapAfter: 6 },
  );

  let safety: CardLayout["safety"] = null;
  if (card.safetyLine) {
    const lines = wrapText(pdfSafe(card.safetyLine), font, T_SAFETY, fullW - 16);
    const height = lines.length * leading(T_SAFETY) + 13;
    safety = { lines, top: y, height };
    y += height + 9;
  }

  const tailRows: Row[] = [];
  for (const line of wrapText(
    pdfSafe(card.doseText) || "As advised by your physio",
    bold,
    T_DOSE,
    fullW,
  )) {
    tailRows.push({ text: line, x: innerLeft, top: y, size: T_DOSE, font: bold, color: INK });
    y += leading(T_DOSE);
  }
  if (card.physioNote) {
    y += 4;
    for (const line of wrapText(`Physio note: ${pdfSafe(card.physioNote)}`, font, T_NOTE, fullW)) {
      tailRows.push({ text: line, x: innerLeft, top: y, size: T_NOTE, font, color: MUTED });
      y += leading(T_NOTE);
    }
  }

  const bodyHeight = Math.max(y, figureZone);
  const titleRowH = Math.max(BADGE, titleLines.length * leading(T_TITLE));
  const height = PAD + titleRowH + GAP_TITLE_BODY + bodyHeight + PAD;

  return { height, hasVisual: withVisual, titleLines, preRows, safety, tailRows, bodyHeight };
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
  const bodyTop = topY - PAD - titleRowH - GAP_TITLE_BODY;

  // Left gutter: the real illustration, when we have one.
  if (layout.hasVisual && image) {
    page.drawImage(image, { x: innerLeft, y: bodyTop - IMG, width: IMG, height: IMG });
  }

  const drawRow = (row: Row): void => {
    if (row.check) {
      drawCheck(page, row.x - CHECK_INDENT, bodyTop - row.top - T_CUE + 1, T_CUE - 2, SKY);
    }
    page.drawText(row.text, {
      x: row.x,
      y: bodyTop - row.top - row.size,
      size: row.size,
      font: row.font,
      color: row.color,
    });
  };

  for (const row of layout.preRows) drawRow(row);

  if (layout.safety) {
    const boxTop = bodyTop - layout.safety.top;
    page.drawSvgPath(roundedRectPath(innerRight - innerLeft, layout.safety.height, 6), {
      x: innerLeft,
      y: boxTop,
      color: SAFETY_FILL,
      borderColor: SAFETY_BORDER,
      borderWidth: 1,
    });
    let inner = boxTop - 7;
    for (const line of layout.safety.lines) {
      page.drawText(line, { x: innerLeft + 8, y: inner - T_SAFETY, size: T_SAFETY, font, color: SAFETY_INK });
      inner -= leading(T_SAFETY);
    }
  }

  for (const row of layout.tailRows) drawRow(row);
}

function drawCover(page: PDFPage, input: ExercisePlanPdfInput, font: PDFFont, bold: PDFFont): void {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - COVER_H, width, height: COVER_H, color: INK });
  page.drawRectangle({ x: 0, y: height - COVER_H, width, height: 4, color: SKY });

  // "P" mark + wordmark
  const markCX = MARGIN + 12;
  const markCY = height - 25;
  page.drawCircle({ x: markCX, y: markCY, size: 12, color: SKY });
  page.drawText("P", {
    x: markCX - bold.widthOfTextAtSize("P", 13) / 2,
    y: markCY - 4.5,
    size: 13,
    font: bold,
    color: WHITE,
  });
  page.drawText("PhysioOnClick", { x: markCX + 21, y: markCY - 4.5, size: 12, font: bold, color: WHITE });

  page.drawText("Your Exercise Plan", { x: MARGIN, y: height - 60, size: 22, font: bold, color: WHITE });

  const patient = pdfSafe(input.patientName) || "you";
  const physio = pdfSafe(input.physioName) || "your physiotherapist";
  const dstr = fmtDate(input.sessionDateISO);
  const sessionLine = dstr
    ? `For ${patient} ${DOT} from your session on ${dstr} with ${physio}`
    : `For ${patient} ${DOT} from your session with ${physio}`;
  page.drawText(pdfSafe(sessionLine), { x: MARGIN, y: height - 80, size: 10, font, color: TAGLINE });

  const creds = pdfSafe(
    `${founder.credentials[0]} ${DOT} ${founder.credentials[1]} ${DOT} Move Better ${DOT} Live Brighter`,
  );
  page.drawText(creds, { x: MARGIN, y: height - 96, size: 8.5, font, color: COVER_META });
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
  let y = height - COVER_H - 12;

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

    // No stick-figure fallback: a card only reserves the illustration gutter
    // when a real image embedded successfully, otherwise text reclaims the
    // full card width.
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
