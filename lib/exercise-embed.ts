import { exerciseImageUrl } from "@/lib/exercise-images";
import { formatDosage, resolveDosage, type Exercise } from "@/lib/exercises";
import { splitMistakes } from "@/lib/exercise-safety-line";
import { REFERENCE_ONLY_NOTE } from "@/lib/exercise-disclaimer";
import { absoluteUrl } from "@/lib/utils";

// Embeddable exercises (docs/superpowers/specs/2026-09-30-exercise-embeds-design.md).
// Other sites paste buildEmbedSnippet(); the iframe loads renderEmbedHtml() from
// /embed/exercises/<slug>. The attribution <a> deliberately sits OUTSIDE the
// iframe: links inside an iframe belong to our document, so only the host-page
// link counts as a backlink.

/** Off switch: false serves a plain "view at PhysioOnClick" card instead. */
export const EMBEDS_ENABLED = true;

export function embedPath(slug: string): string {
  return `/embed/exercises/${encodeURIComponent(slug)}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function exercisePageUrl(slug: string): string {
  return absoluteUrl(`/exercises/${encodeURIComponent(slug)}`);
}

/**
 * Iframe height for this exercise, so short exercises don't sit above a blank
 * gap and long ones don't scroll inside the box. Fitted (with headroom) to
 * rendered heights at a 360px-wide phone column, the tallest case:
 * clam-shell 665px, sit-to-stand-control 747px, full-body-stretch-routine 932px.
 */
export function embedHeight(exercise: Exercise): number {
  const steps = exercise.steps ?? [];
  const chars =
    (exercise.setup?.length ?? 0) +
    steps.reduce((sum, step) => sum + step.length, 0) +
    splitMistakes(exercise.mistakes ?? []).safety.length +
    formatDosage(resolveDosage(exercise)).length;
  const estimate = 464 + 0.42 * chars + 8 * steps.length;
  return Math.min(1100, Math.max(600, Math.ceil(estimate / 20) * 20));
}

export function buildEmbedSnippet(exercise: Exercise): string {
  const title = escapeHtml(exercise.title);
  const src = escapeHtml(absoluteUrl(embedPath(exercise.slug)));
  const page = escapeHtml(exercisePageUrl(exercise.slug));
  const home = escapeHtml(absoluteUrl("/"));
  return (
    `<iframe src="${src}" title="${title} exercise - PhysioOnClick" width="100%" height="${embedHeight(exercise)}" loading="lazy" style="border:0;max-width:520px;width:100%"></iframe>\n` +
    `<p style="font-size:14px;margin:6px 0 0"><a href="${page}">${title} exercise</a> by <a href="${home}">PhysioOnClick</a></p>`
  );
}

// The Clarity System, inlined: paper background, navy ink, sky accent. System
// fonts only so the embed makes no third-party font requests.
const STYLES = `
*{box-sizing:border-box}
body{margin:0;background:#fffdf8;color:#14213d;font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.card{max-width:520px;margin:0 auto;padding:12px 16px}
.media{position:relative;border-radius:14px;overflow:hidden;background:#eaf6fb;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.media img{display:block;width:100%;max-height:200px;object-fit:contain;pointer-events:none}
.wm{position:absolute;right:10px;bottom:10px;padding:3px 8px;border-radius:999px;background:rgba(255,253,248,.78);color:#14213d;font-size:11px;font-weight:600;opacity:.8}
h1{font-size:19px;line-height:1.25;margin:10px 0 4px}
p{margin:0 0 8px}
ol{margin:0 0 8px;padding-left:22px}
li{margin-bottom:2px}
.dose{font-weight:600}
.ref{font-size:13px;font-weight:600;color:#4a5568;margin:4px 0 0}
.safety{background:#fff4f2;border:1px solid #f3d6d0;color:#a83a2c;border-radius:10px;padding:6px 12px;font-size:13px}
.cta{display:inline-block;margin-top:4px;color:#0369a1;font-weight:600;text-decoration:none}
.cta:hover{text-decoration:underline}
.foot{margin:8px 0 0;font-size:12px;color:#64737d}
`;

function documentShell(exercise: Exercise, body: string): string {
  const title = escapeHtml(exercise.title);
  const canonical = escapeHtml(exercisePageUrl(exercise.slug));
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="robots" content="noindex">` +
    `<link rel="canonical" href="${canonical}">` +
    `<title>${title} exercise - PhysioOnClick</title>` +
    `<style>${STYLES}</style></head><body>${body}</body></html>`
  );
}

function fullGuideUrl(slug: string): string {
  return `${exercisePageUrl(slug)}?utm_source=embed&utm_medium=referral`;
}

export function renderEmbedHtml(exercise: Exercise): string {
  const title = escapeHtml(exercise.title);
  // Relative on purpose: the embed document is always served from our own
  // origin, so this resolves there regardless of which host built the page.
  const image = escapeHtml(exerciseImageUrl(exercise.id, "full"));
  const steps = (exercise.steps ?? []).map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  const dose = formatDosage(resolveDosage(exercise));
  const { safety } = splitMistakes(exercise.mistakes ?? []);
  const cta = escapeHtml(fullGuideUrl(exercise.slug));

  const body =
    `<main class="card">` +
    `<div class="media" oncontextmenu="return false"><img src="${image}" alt="Illustration of the ${title} exercise" width="960" height="960" draggable="false" loading="lazy"><span class="wm" aria-hidden="true">© physioonclick.co.uk</span></div>` +
    `<h1>${title}</h1>` +
    `<p class="ref">${escapeHtml(REFERENCE_ONLY_NOTE)}</p>` +
    (exercise.setup ? `<p>${escapeHtml(exercise.setup)}</p>` : "") +
    (steps ? `<ol>${steps}</ol>` : "") +
    (dose ? `<p class="dose">${escapeHtml(dose)}</p>` : "") +
    `<p class="safety">${escapeHtml(safety)}</p>` +
    `<a class="cta" href="${cta}" target="_blank" rel="noopener">See the full guide at PhysioOnClick →</a>` +
    `<p class="foot">© PhysioOnClick · General guidance, not a diagnosis.</p>` +
    `</main>`;
  return documentShell(exercise, body);
}

export function renderEmbedDisabledHtml(exercise: Exercise): string {
  const title = escapeHtml(exercise.title);
  const url = escapeHtml(exercisePageUrl(exercise.slug));
  return documentShell(
    exercise,
    `<main class="card"><h1>${title}</h1><a class="cta" href="${url}" target="_blank" rel="noopener">View this exercise at PhysioOnClick →</a></main>`,
  );
}
