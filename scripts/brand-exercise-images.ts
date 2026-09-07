/**
 * scripts/brand-exercise-images.ts
 *
 * Adds the PhysioOnClick brand footer to each generated exercise illustration
 * so the stored asset is unmistakably ours. The AI generators cannot draw our
 * logo legibly (they produce a garbled fake), so the real mark is composited
 * on here, after generation.
 *
 * Pipeline:  generate-exercise-images  ->  brand-exercise-images  ->  upload-exercise-images
 *
 * Usage:
 *   npx tsx --env-file=.env.development scripts/brand-exercise-images.ts --only=ex-12,ex-13
 *   npx tsx --env-file=.env.development scripts/brand-exercise-images.ts --all
 *
 * Reads  exercise-images-src/{id}.png  (raw), writes  exercise-images-src/{id}.branded.png.
 * The upload script prefers the .branded.png when present.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { exerciseImagePrompts } from "../lib/exercise-image-prompts";

const SRC_DIR = "exercise-images-src";
const SIZE = 1024; // square illustration
const BAND = 128; // brand footer height

// Palette — mirrors lib/exercise-plan-pdf.ts / "The Clarity System"
const PAPER = "#FBF7F0";
const INK = "#043246";
const SKY = "#0EA5E9";
const RULE = "#E6EEF2";
const MUTED = "#64737D";

function footerSvg(): Buffer {
  const bandTop = SIZE;
  return Buffer.from(`<svg width="${SIZE}" height="${SIZE + BAND}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="${bandTop}" width="${SIZE}" height="${BAND}" fill="${PAPER}"/>
  <rect x="0" y="${bandTop}" width="${SIZE}" height="1.5" fill="${RULE}"/>
  <rect x="0" y="${SIZE + BAND - 6}" width="${SIZE}" height="6" fill="${SKY}"/>
  <rect x="40" y="${bandTop + 30}" width="64" height="64" rx="16" fill="${SKY}"/>
  <text x="72" y="${bandTop + 74}" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="700" fill="#ffffff" text-anchor="middle">P</text>
  <text x="122" y="${bandTop + 60}" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="${INK}">PhysioOnClick</text>
  <text x="122" y="${bandTop + 88}" font-family="Helvetica, Arial, sans-serif" font-size="17" fill="${MUTED}">physioonclick.co.uk</text>
</svg>`);
}

async function brand(id: string): Promise<void> {
  const raw = `${SRC_DIR}/${id}.png`;
  if (!existsSync(raw)) {
    console.warn(`skip ${id}: no ${raw}`);
    return;
  }

  // Fit the illustration into a SIZE x SIZE square on a paper ground, then
  // extend the canvas downward by BAND and lay the footer over the whole thing.
  const square = await sharp(readFileSync(raw))
    .resize(SIZE, SIZE, { fit: "contain", background: PAPER })
    .flatten({ background: PAPER })
    .toBuffer();

  const out = await sharp(square)
    .extend({ bottom: BAND, background: PAPER })
    .composite([{ input: footerSvg(), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const dst = `${SRC_DIR}/${id}.branded.png`;
  writeFileSync(dst, out);
  console.log(`branded ${dst} (${Math.round(out.length / 1024)} KB)`);
}

function idsFromArgs(argv: string[]): string[] {
  const only = argv.find((a) => a.startsWith("--only="));
  if (only) return only.slice(7).split(",");
  if (argv.includes("--all")) return Object.keys(exerciseImagePrompts);
  console.error("Usage:");
  console.error("  npx tsx --env-file=.env.development scripts/brand-exercise-images.ts --only=ex-12,ex-13");
  console.error("  npx tsx --env-file=.env.development scripts/brand-exercise-images.ts --all");
  process.exit(1);
}

async function main() {
  const ids = idsFromArgs(process.argv.slice(2));
  console.log(`Branding ${ids.length} image(s)...`);
  for (const id of ids) await brand(id);
}

main().catch((err) => {
  console.error("Branding failed:", err);
  process.exit(1);
});
