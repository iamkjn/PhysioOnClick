#!/usr/bin/env node
/**
 * Builds the 1200x630 social preview image at public/og-default.png.
 *
 * Why this exists: og:image used to point at /home-hero-premium.svg. Facebook,
 * LinkedIn, X, WhatsApp and Slack all refuse to render SVG link previews, so
 * every share of the site came out with no image at all. Social crawlers want a
 * raster file at 1200x630.
 *
 * The wordmark PNG is composited rather than re-typeset because Fraunces and
 * DM Sans are not installed on every machine that might run this — rendering
 * text here would silently fall back to a system font and go off-brand. The
 * wordmark already has the brand type and tagline baked in.
 *
 * Regenerate with: node scripts/build-og-image.js
 * Output is committed, so this only needs re-running when the brand assets change.
 */
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const WORDMARK = path.join(ROOT, "public/social/physioonclick-wordmark.png");
const OUT = path.join(ROOT, "public/og-default.png");

// The Clarity System, from DESIGN.md.
const WARM_PAPER = { r: 0xf6, g: 0xf3, b: 0xec, alpha: 1 };
const ACCENT_DEEP = "#0A77A8";
const SKY_ACCENT = "#0EA5E9";

const W = 1200;
const H = 630;
const WORDMARK_W = 1080;

async function main() {
  // public/social/ holds the brand kit and is not currently tracked in git, so
  // a fresh clone has the committed og-default.png but not the source art.
  if (!fs.existsSync(WORDMARK)) {
    console.error(
      `Missing ${path.relative(ROOT, WORDMARK)}.\n` +
        "The brand kit in public/social/ is untracked — restore it before regenerating.\n" +
        "public/og-default.png is committed, so the site is unaffected until then."
    );
    process.exit(1);
  }

  const wordmark = await sharp(WORDMARK)
    .resize({ width: WORDMARK_W, fit: "inside", withoutEnlargement: false })
    .toBuffer();
  const { height: wordmarkH } = await sharp(wordmark).metadata();

  // A single accent rule along the bottom edge — enough to read as deliberate
  // brand furniture at thumbnail size without competing with the wordmark.
  const accentBar = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="14">
       <defs>
         <linearGradient id="g" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">
           <stop stop-color="${ACCENT_DEEP}"/>
           <stop offset="1" stop-color="${SKY_ACCENT}"/>
         </linearGradient>
       </defs>
       <rect width="${W}" height="14" fill="url(#g)"/>
     </svg>`
  );

  await sharp({ create: { width: W, height: H, channels: 4, background: WARM_PAPER } })
    .composite([
      { input: wordmark, left: Math.round((W - WORDMARK_W) / 2), top: Math.round((H - wordmarkH) / 2) },
      { input: accentBar, left: 0, top: H - 14 }
    ])
    .png({ compressionLevel: 9 })
    .toFile(OUT);

  const { width, height } = await sharp(OUT).metadata();
  const { size } = require("node:fs").statSync(OUT);
  console.log(`wrote ${path.relative(ROOT, OUT)} — ${width}x${height}, ${Math.round(size / 1024)}KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
