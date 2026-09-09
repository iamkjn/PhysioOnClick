/**
 * Symptom-aware ranking for the public exercise-library search.
 *
 * The catalogue tags exercises and conditions in clinical language
 * ("Patellofemoral pain", "Rotator cuff tendinopathy") but people search in lay
 * language ("kneecap pain", "sore shoulder at night", "trapped nerve"). This
 * module turns the catalogue into a flat, pre-joined `SearchItem[]` and ranks it
 * against a free-text query, expanding a hand-written synonym map so the common
 * lay names resolve to the right hub.
 *
 * Pure and dependency-light: it imports the two static arrays plus the body-area
 * taxonomy directly (never `@/lib/exercise-library`, to avoid an import cycle -
 * that barrel re-exports from here). No `"use client"`; the matcher is safe to
 * run in the browser (the client search box calls `searchItems` directly).
 */

import { conditions } from "@/lib/conditions";
import { exercises } from "@/lib/exercises";
import { BODY_AREAS } from "@/lib/body-areas";

export type SearchItem =
  | { kind: "exercise"; slug: string; title: string; terms: string }
  | { kind: "condition"; slug: string; name: string; terms: string };

/**
 * Lay phrase -> extra term strings to inject into the match when that phrase is
 * in the query. Keys are lower-case ASCII (may be multi-word). Every injected
 * term is chosen to actually occur in some catalogue record's `terms` so the
 * expansion lands on real content.
 *
 * Deliberately omitted for lack of matching content: there is no plantar
 * fasciitis or shin-splints hub, so "shin splints" / "plantar" map to the
 * nearest calf / ankle-foot content rather than a dedicated page; carpal tunnel
 * has exercise-level content only (no hub).
 */
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  kneecap: ["patellofemoral", "kneecap pain", "knee"],
  "knee cap": ["patellofemoral", "kneecap pain", "knee"],
  "runners knee": ["patellofemoral", "anterior knee pain"],
  "jumpers knee": ["patellar tendinopathy", "knee"],
  "trapped nerve": ["sciatica", "nerve", "leg pain"],
  "pinched nerve": ["sciatica", "nerve"],
  "slipped disc": ["low back pain", "sciatica", "disc"],
  "herniated disc": ["low back pain", "sciatica", "disc"],
  lumbago: ["low back pain"],
  sciatica: ["sciatica", "nerve"],
  "tennis elbow": ["tennis elbow", "lateral epicondyl"],
  "golfers elbow": ["golfers elbow", "medial epicondyl"],
  frozen: ["frozen shoulder", "adhesive capsulitis"],
  "frozen shoulder": ["frozen shoulder", "adhesive capsulitis"],
  "stiff shoulder": ["frozen shoulder", "shoulder"],
  "sore shoulder": ["shoulder", "rotator cuff"],
  "shoulder pain at night": ["rotator cuff", "shoulder"],
  "rotator cuff": ["rotator cuff", "shoulder"],
  achilles: ["achilles tendinopathy", "calf"],
  "heel cord": ["achilles tendinopathy", "calf"],
  "shin splints": ["calf", "ankle"],
  "plantar fasciitis": ["ankle", "foot"],
  "heel pain": ["achilles tendinopathy", "ankle"],
  "sprained ankle": ["ankle sprain"],
  "rolled ankle": ["ankle sprain"],
  "twisted ankle": ["ankle sprain"],
  "hip bursitis": ["gluteal tendinopathy", "hip"],
  "outer hip pain": ["gluteal tendinopathy", "hip"],
  groin: ["hip", "groin"],
  "groin strain": ["hip", "groin"],
  hamstring: ["hamstring strain", "hamstring"],
  "pulled hamstring": ["hamstring strain", "hamstring"],
  "text neck": ["neck pain", "neck"],
  "neck stiffness": ["neck pain", "neck"],
  whiplash: ["neck pain", "whiplash"],
  "arthritis knee": ["knee osteoarthritis", "knee"],
  "worn knee": ["knee osteoarthritis", "knee"],
  "knee replacement": ["after a knee replacement", "knee replacement"],
  tkr: ["after a knee replacement", "knee replacement"],
  "hip replacement": ["after a hip replacement", "hip replacement"],
  thr: ["after a hip replacement", "hip replacement"],
  acl: ["acl", "anterior cruciate"],
  "pelvic floor": ["stress urinary incontinence", "pelvic floor"],
  leaking: ["stress urinary incontinence", "pelvic floor"],
  incontinence: ["stress urinary incontinence", "pelvic floor"],
  "bladder leakage": ["stress urinary incontinence"],
  "pregnancy pain": ["pregnancy-related pelvic girdle pain", "pelvic girdle"],
  spd: ["pregnancy-related pelvic girdle pain", "pelvic girdle"],
  pgp: ["pregnancy-related pelvic girdle pain", "pelvic girdle"],
  balance: ["falls prevention", "balance"],
  falls: ["falls prevention", "balance"],
  unsteady: ["falls prevention", "balance"],
  "return to running": ["return to running", "running"],
  "back to running": ["return to running", "running"],
  "return to sport": ["return to sport readiness", "return to sport"],
  "carpal tunnel": ["wrist", "median nerve"],
  stroke: ["post-stroke", "stroke"],
  parkinsons: ["parkinson"],
  "facial palsy": ["facial palsy", "facial"],
  "bells palsy": ["facial palsy", "facial"],
};

const STOPWORDS = new Set([
  "the",
  "a",
  "my",
  "for",
  "in",
  "on",
  "of",
  "is",
  "it",
  "i",
  "and",
  "to",
  "at",
  "with",
  "when",
  "from",
]);

/** Lower-case, drop apostrophes so "golfer's" and "golfers" match. */
function normalise(value: string): string {
  return value.toLowerCase().replace(/['\u2018\u2019]/g, "");
}

function tokenise(value: string): string[] {
  return normalise(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

/**
 * Does `needle` occur in `haystack`? A multi-word needle is a plain substring
 * test; a single word must sit on word boundaries so the injected term "hip"
 * does not match "w[hip]lash" and "acl" does not match "obst[acl]e".
 */
function termAppears(haystack: string, needle: string): boolean {
  if (!needle) return false;
  if (needle.includes(" ")) return haystack.includes(needle);

  const isWordChar = (char: string | undefined) =>
    char !== undefined && /[a-z0-9]/.test(char);

  let from = 0;
  for (;;) {
    const index = haystack.indexOf(needle, from);
    if (index === -1) return false;
    const before = index === 0 ? undefined : haystack[index - 1];
    const after = haystack[index + needle.length];
    if (!isWordChar(before) && !isWordChar(after)) return true;
    from = index + 1;
  }
}

/** The plain-language body-area label an exercise's `bodyPart` rolls up into. */
function areaLabelForBodyPart(bodyPart: string): string {
  const area = BODY_AREAS.find((entry) => entry.bodyParts.includes(bodyPart));
  return area ? area.label : bodyPart;
}

/**
 * The whole catalogue as flat, pre-joined search items. Exercise terms are
 * `[title, ...aka, ...helpsWith, condition, body-area label]`; condition terms
 * are `[name, ...aka, bodyArea, ...programme stage names]` - all lower-cased and
 * joined into one string. Pure and deterministic (source order preserved:
 * exercises first, then conditions).
 */
export function buildSearchItems(): SearchItem[] {
  const exerciseItems: SearchItem[] = exercises.map((exercise) => ({
    kind: "exercise",
    slug: exercise.slug,
    title: exercise.title,
    terms: normalise(
      [
        exercise.title,
        ...(exercise.aka ?? []),
        ...(exercise.helpsWith ?? []),
        exercise.condition,
        areaLabelForBodyPart(exercise.bodyPart),
      ].join(" "),
    ),
  }));

  const conditionItems: SearchItem[] = conditions.map((condition) => ({
    kind: "condition",
    slug: condition.slug,
    name: condition.name,
    terms: normalise(
      [
        condition.name,
        ...(condition.aka ?? []),
        condition.bodyArea,
        ...condition.program.map((stage) => stage.stage),
      ].join(" "),
    ),
  }));

  return [...exerciseItems, ...conditionItems];
}

/**
 * Rank `items` against `query`. Tokenises the query (dropping <2-char tokens and
 * a small stopword set), expands it through `SEARCH_SYNONYMS`, then scores each
 * item: +10 for the full query phrase inside the title/name, +4 when every query
 * token is somewhere in `terms`, +1 per individual token found, +3 once if any
 * injected synonym term is found. Keeps score > 0, sorts by score then
 * conditions-before-exercises then label, dedupes by (kind, slug), caps at 12.
 * An empty / whitespace-only / all-stopword query returns `[]`.
 */
export function searchItems(items: SearchItem[], query: string): SearchItem[] {
  const raw = normalise(query.trim());
  const tokens = tokenise(query);
  if (tokens.length === 0) return [];

  const injected = new Set<string>();
  for (const [phrase, extraTerms] of Object.entries(SEARCH_SYNONYMS)) {
    const matched = phrase.includes(" ")
      ? raw.includes(phrase)
      : tokens.includes(phrase);
    if (matched) {
      for (const term of extraTerms) injected.add(normalise(term));
    }
  }

  const ranked = items
    .map((item) => {
      const label = normalise(item.kind === "exercise" ? item.title : item.name);
      const { terms } = item;
      let score = 0;
      if (raw.length >= 2 && termAppears(label, raw)) score += 10;
      if (tokens.every((token) => termAppears(terms, token))) score += 4;
      for (const token of tokens) if (termAppears(terms, token)) score += 1;
      for (const term of injected) {
        if (termAppears(terms, term)) {
          score += 3;
          break;
        }
      }
      return { item, score, label };
    })
    .filter((entry) => entry.score > 0);

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.item.kind !== b.item.kind) {
      return a.item.kind === "condition" ? -1 : 1;
    }
    return a.label.localeCompare(b.label);
  });

  const seen = new Set<string>();
  const out: SearchItem[] = [];
  for (const entry of ranked) {
    const key = `${entry.item.kind}:${entry.item.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry.item);
    if (out.length >= 12) break;
  }
  return out;
}
