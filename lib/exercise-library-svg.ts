/**
 * Per-page OG (social preview) images for the public exercise library.
 *
 * Two pure functions that return a 1200x630 SVG string each — one for an
 * exercise page, one for a condition hub. Rendered on demand by
 * `app/exercise-og/[slug]/route.ts` and `app/condition-og/[slug]/route.ts`,
 * mirroring `lib/blog-image-svg.ts` + `app/blog-images/[slug]/route.ts`.
 *
 * The Clarity System, flattened to what an SVG renderer can draw: warm paper
 * ground, navy ink, a single sky accent, and a web-safe serif for the title
 * (the renderer has no Fraunces, so we fall back the same way
 * `lib/blog-image-svg.ts` does for its display type).
 */

import type { Condition, Exercise } from "@/lib/exercise-library";
import type { SelfTest } from "@/lib/self-tests";

const PAPER = "#F6F3EC";
const INK = "#043246";
const SKY = "#0EA5E9";
const MUTED = "#5B6B72";

/** No Fraunces in the SVG renderer — same web-safe fallback approach as `lib/blog-image-svg.ts`. */
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'DM Sans', Arial, Helvetica, sans-serif";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Greedy word-wrap into at most `maxLines` lines of roughly `maxChars` each. */
function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1]}…`;
  return kept;
}

/** Sky rounded-square "P" mark + "PhysioOnClick" wordmark, top-left. */
function brandMark(): string {
  return `
    <rect x="72" y="64" width="52" height="52" rx="14" fill="${SKY}" />
    <text x="98" y="101" text-anchor="middle" font-family="${SANS}" font-size="32" font-weight="700" fill="#ffffff">P</text>
    <text x="140" y="99" font-family="${SANS}" font-size="27" font-weight="700" fill="${INK}">PhysioOnClick</text>
  `;
}

function frame(inner: string): string {
  return (
    `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="1200" height="630" fill="${PAPER}" />` +
    `<circle cx="1140" cy="600" r="240" fill="${SKY}" fill-opacity="0.06" />` +
    `<rect x="0" y="0" width="1200" height="10" fill="${SKY}" />` +
    brandMark() +
    `<rect x="72" y="188" width="104" height="8" rx="4" fill="${SKY}" />` +
    inner +
    `</svg>`
  );
}

function kicker(text: string): string {
  return `<text x="72" y="170" font-family="${SANS}" font-size="24" font-weight="600" letter-spacing="1" fill="${MUTED}">${escapeXml(
    text,
  )}</text>`;
}

function titleBlock(lines: string[], startY: number): string {
  const lineHeight = 84;
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="72" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");
  return `<text x="72" y="${startY}" font-family="${SERIF}" font-size="72" font-weight="700" fill="${INK}">${tspans}</text>`;
}

function chip(label: string, y: number): string {
  const width = 44 + label.length * 15;
  return (
    `<rect x="72" y="${y}" width="${width}" height="48" rx="24" fill="${SKY}" fill-opacity="0.14" />` +
    `<text x="${72 + width / 2}" y="${y + 31}" text-anchor="middle" font-family="${SANS}" font-size="23" font-weight="600" fill="${INK}">${escapeXml(
      label,
    )}</text>`
  );
}

/** OG card for a single exercise page: the exercise title + an "Exercise" kicker. */
export function generateExerciseOgSvg(ex: Exercise): string {
  const lines = wrapLines(ex.title, 22, 3);
  const startY = lines.length >= 3 ? 300 : 340;
  return frame(kicker("Exercise · PhysioOnClick") + titleBlock(lines, startY));
}

/** OG card for a condition hub page: "<name> exercises" + a library kicker + a body-area chip. */
export function generateConditionOgSvg(c: Condition): string {
  const lines = wrapLines(`${c.name} exercises`, 22, 3);
  const startY = lines.length >= 3 ? 296 : 332;
  const chipY = startY + (lines.length - 1) * 84 + 44;
  return frame(
    kicker("Exercise library · PhysioOnClick") +
      titleBlock(lines, startY) +
      (c.bodyArea ? chip(c.bodyArea, chipY) : ""),
  );
}

/** A muted sub-line under the title (e.g. what a self-check test assesses). */
function subline(lines: string[], startY: number): string {
  const lineHeight = 42;
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="72" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");
  return `<text x="72" y="${startY}" font-family="${SANS}" font-size="30" fill="${MUTED}">${tspans}</text>`;
}

/** OG card for a self-check test page: the test name + a "SELF-CHECK TEST" kicker + what it assesses. */
export function generateSelfTestOgSvg(t: SelfTest): string {
  const lines = wrapLines(t.name, 22, 3);
  const startY = lines.length >= 3 ? 288 : 324;
  const subY = startY + (lines.length - 1) * 84 + 62;
  return frame(
    kicker("SELF-CHECK TEST · PhysioOnClick") +
      titleBlock(lines, startY) +
      subline(wrapLines(`Checks: ${t.assesses}`, 44, 2), subY),
  );
}
