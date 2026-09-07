/**
 * scripts/apply-exercise-drafts.mjs  (one-off integration tool for Plan 2)
 *
 * Reads draft JSON files (one per batch) of the shape:
 *   { "ex-1": { pose?, equipment, setup, steps, cues, mistakes, defaultDosage }, ... }
 * and merges those fields into the matching entries in lib/exercises.ts,
 * re-serialising ONLY the touched entries. Untouched entries and the file's
 * structure/comments are left byte-for-byte.
 *
 * Usage: node scripts/apply-exercise-drafts.mjs <draft1.json> [draft2.json ...]
 *   --check : report what would change, write nothing
 */
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const check = args.includes("--check");
const files = args.filter((a) => !a.startsWith("--"));
if (files.length === 0) {
  console.error("usage: node scripts/apply-exercise-drafts.mjs <draft.json> [...]  [--check]");
  process.exit(1);
}

const drafts = {};
for (const f of files) {
  const obj = JSON.parse(readFileSync(f, "utf8"));
  for (const [id, fields] of Object.entries(obj)) {
    if (drafts[id]) throw new Error(`duplicate draft for ${id} (in ${f})`);
    drafts[id] = fields;
  }
}
console.log(`${Object.keys(drafts).length} draft entries from ${files.length} file(s)`);

const path = "lib/exercises.ts";
const src = readFileSync(path, "utf8");

// Locate the `export const exercises: Exercise[] = [` ... `];` block.
const startMarker = "export const exercises: Exercise[] = [";
const startIdx = src.indexOf(startMarker);
if (startIdx === -1) throw new Error("could not find the exercises array");
const arrOpen = startIdx + startMarker.length;

// Walk the array body tracking brace/bracket/string depth to find top-level
// `{ ... }` entries and the array's closing `]`.
let i = arrOpen;
let depth = 0;
let inStr = null;
let entryStart = -1;
const entries = []; // { start, end }  (end exclusive, at the char after `}`)
for (; i < src.length; i++) {
  const c = src[i];
  if (inStr) {
    if (c === "\\") { i++; continue; }
    if (c === inStr) inStr = null;
    continue;
  }
  if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
  if (c === "{") { if (depth === 0) entryStart = i; depth++; continue; }
  if (c === "}") {
    depth--;
    if (depth === 0) { entries.push({ start: entryStart, end: i + 1 }); entryStart = -1; }
    continue;
  }
  if (c === "[") { depth++; continue; }
  if (c === "]") { if (depth === 0) break; depth--; continue; }
}
console.log(`scanned ${entries.length} entries in the array`);

const idRe = /\bid:\s*"([^"]+)"/;
const titleRe = /\btitle:\s*"((?:[^"\\]|\\.)*)"/;

function ser(v, indent) {
  const pad = "  ".repeat(indent);
  const pad1 = "  ".repeat(indent + 1);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    if (v.every((x) => typeof x !== "object")) {
      // string/number array — one per line for readability if long
      const inline = "[" + v.map((x) => JSON.stringify(x)).join(", ") + "]";
      if (inline.length <= 100) return inline;
      return "[\n" + v.map((x) => pad1 + JSON.stringify(x)).join(",\n") + "\n" + pad + "]";
    }
    return "[\n" + v.map((x) => pad1 + ser(x, indent + 1)).join(",\n") + "\n" + pad + "]";
  }
  if (v && typeof v === "object") {
    const parts = Object.entries(v).map(([k, val]) => `${k}: ${ser(val, indent + 1)}`);
    // dosage-style small objects stay inline
    const inline = "{ " + parts.join(", ") + " }";
    if (inline.length <= 110 && !parts.some((p) => p.includes("\n"))) return inline;
    return "{\n" + parts.map((p) => pad1 + p).join(",\n") + "\n" + pad + "}";
  }
  return JSON.stringify(v);
}

const FIELD_ORDER = ["id", "title", "bodyPart", "clinicalArea", "tags", "condition", "stage", "description", "videoUrl", "equipment", "pose", "setup", "steps", "cues", "mistakes", "defaultDosage", "retired"];

let out = "";
let cursor = 0;
let applied = 0;
const seen = new Set();
for (const { start, end } of entries) {
  const text = src.slice(start, end);
  const idM = text.match(idRe);
  if (!idM) continue;
  const id = idM[1];
  const draft = drafts[id];
  if (!draft) continue;
  seen.add(id);

  // parse the existing entry via eval in a sandbox-ish Function (trusted file)
  let existing;
  try {
    existing = new Function(`return (${text})`)();
  } catch (e) {
    throw new Error(`could not parse existing entry ${id}: ${e.message}`);
  }
  const titleM = text.match(titleRe);
  const merged = { ...existing };
  for (const k of ["equipment", "pose", "setup", "steps", "cues", "mistakes", "defaultDosage"]) {
    if (draft[k] !== undefined) merged[k] = draft[k];
  }
  // guard: identity fields unchanged
  for (const k of ["id", "title", "bodyPart", "clinicalArea", "condition", "stage", "description"]) {
    if (draft[k] !== undefined && JSON.stringify(draft[k]) !== JSON.stringify(existing[k])) {
      throw new Error(`draft for ${id} tries to change ${k}`);
    }
  }

  const ordered = {};
  for (const k of FIELD_ORDER) if (merged[k] !== undefined) ordered[k] = merged[k];
  for (const k of Object.keys(merged)) if (!(k in ordered)) ordered[k] = merged[k];

  const rendered = ser(ordered, 1); // array entries: fields at 4 spaces, closing brace at 2
  out += src.slice(cursor, start) + rendered;
  cursor = end;
  applied++;
}
out += src.slice(cursor);

const missing = Object.keys(drafts).filter((id) => !seen.has(id));
if (missing.length) console.warn(`WARNING: ${missing.length} draft ids not found in the array: ${missing.join(", ")}`);

console.log(`${applied} entries rewritten`);
if (check) {
  console.log("(--check: not writing)");
} else {
  writeFileSync(path, out);
  console.log(`wrote ${path}`);
}
