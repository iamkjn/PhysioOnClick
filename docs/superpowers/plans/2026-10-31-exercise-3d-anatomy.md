# Exercise 3D Anatomy (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On each public exercise page, add a "View in 3D" switch on the hero picture that shows the exercise's muscles lit on the live 3D body, plus a server-rendered "What it works and how it helps" section. Drafts are visible on dev only; prod shows only approved entries.

**Architecture:**
- **Data:** pure data and helpers live in `lib/exercise-anatomy/`: a muscle dictionary that maps keys to model part-name patterns, per-exercise entries keyed by slug, shared healing copy, and visibility rules.
- **Add-on model:** a small add-on model (pelvic floor, diaphragm, deep neck flexors, discs) is built by a new script in the existing binary format.
- **Viewer:** a lazy client viewer reuses the booking chart's loader, format and picking libraries, but has its own three.js stage.
- **Page:** the page gets two guarded insertions. With nothing visible, the page renders exactly as today.

**Tech Stack:** Next.js 16 (App Router, webpack), React 19, TypeScript, three.js 0.187 (client-only, dynamically imported), Vitest + Testing Library (jsdom), tsx scripts, meshoptimizer.

**Spec:** `docs/superpowers/specs/2026-10-31-exercise-3d-anatomy-design.md`. Read its "Refinements" sections; they override older wording below them.

## Global Constraints

**Where to work**
- Work only in `/Users/iamkjn/Documents/Playground/.claude/worktrees/exercise-3d-anatomy` on branch `feat/exercise-3d-anatomy`.
- Run `git branch --show-current` before every commit; it must print `feat/exercise-3d-anatomy`.

**Git rules**
- Never `git add -A` or `git add .`. Stage the named files only.
- Never push. Never touch `.env*` files except where a task says so, and never print their contents.
- Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**Files that must not change**
- `lib/exercises.ts`, `components/body-chart-3d.tsx`, `components/body-chart-picker.tsx`, `lib/body-chart-3d-regions.ts`, `scripts/build-body-model.ts`, anything in `public/models/body-chart/`, `mobile_app/`, and the exercise PDF and embed code.
- The only shared-library edit allowed is exporting `readModelFile` from `lib/body-model-loader.ts` (Task 3).

**Page safety**
- No change to any page's `<title>`, meta description, canonical, H1, quick answer, JSON-LD, sitemap or URLs.

**Tools and libraries**
- three.js is only ever reached through `import("three")` / `import("three/examples/jsm/controls/OrbitControls.js")` at runtime, as `components/body-chart-3d.tsx` does. Never add a static value import of `three`; type-only imports are fine.
- The next.config server alias `three: false` stays.

**Content and copy rules**
- Copy is UK English, plain words, second person.
- No promises: never "cure", "guarantee", "will heal" or "will fix". No personal timelines.
- Paragraph margin is 0 site-wide, so every heading/text/list pair needs explicit spacing (flex column + gap).
- Draft flag: `NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS=1` shows drafts (dev only). It must never be added to `.env.production`.

**Testing**
- Tests live under `tests/`, mirroring the source tree.
- Run a single file with `npx vitest run <path>` and the full suite with `npm run test:run`.
- The suite was 1716/1716 green on master 2d37ecf3.

---

## File map

| File | Responsibility |
| --- | --- |
| `lib/exercise-anatomy/types.ts` | Shared types: `BodyView`, `MuscleGroup`, `TissueTrack`, `ExerciseAnatomy` |
| `lib/exercise-anatomy/muscles.ts` | `MUSCLES` dictionary + `MuscleKey` (client-safe) |
| `lib/exercise-anatomy/addon-parts.ts` | `ADDON_PART` pattern + `ANATOMY_ADDON_DIR` (shared by script, loader, tests) |
| `lib/exercise-anatomy/drafts.ts` | `draftsVisible()` (reads the build-time flag) |
| `lib/exercise-anatomy/healing.ts` | Stage captions, tissue lines, closing line, `healingCopyVisible()` |
| `lib/exercise-anatomy/index.ts` | `EXERCISE_ANATOMY`, `ANATOMY_BATCHES`, `isVisible`, `visibleAnatomy`, `canShow3D`, `startView`, `entryProblems` |
| `lib/exercise-anatomy/entries/*.ts` | Per-batch entries (6 files) |
| `lib/exercise-anatomy/scene.ts` | Pure 3D helpers: roles, draw groups, boxes, framing, labels |
| `lib/exercise-anatomy/addon-loader.ts` | `loadAnatomyAddon()` |
| `scripts/build-anatomy-addon.ts` | Builds `public/models/exercise-anatomy/` |
| `components/exercise-library/exercise-body-3d-stage.ts` | three.js scene (`createAnatomyStage`) |
| `components/exercise-library/exercise-body-3d.tsx` | Viewer UI (`ExerciseBody3D`), lazy |
| `components/exercise-library/exercise-hero-media.tsx` | Picture ↔ 3D switch (`ExerciseHeroMedia`) |
| `components/exercise-library/exercise-anatomy-section.tsx` | Server section (`ExerciseAnatomySection`) |
| `app/exercises/[slug]/page.tsx` | Two guarded insertions |
| `app/globals.css` | Appended block (no existing selector changes) |
| `lib/analytics.ts`, `docs/analytics-tracking.md` | `library_3d_view` event |

---

### Task 1: Types and muscle dictionary

**Files:**
- Create: `lib/exercise-anatomy/types.ts`
- Create: `lib/exercise-anatomy/muscles.ts`
- Test: `tests/lib/exercise-anatomy/muscles.test.ts`

**Interfaces:**
- Produces:
  - `BodyView = "front" | "back" | "left" | "right"`.
  - `MuscleSource = "base" | "addon" | "none"`.
  - `MuscleGroup { label; plain; source; parts: readonly RegExp[]; standIn?: { parts: readonly RegExp[]; note: string }; view: BodyView }`.
  - `TissueTrack`, `AnatomyStatus = "draft" | "approved"`.
  - `ExerciseAnatomy { main: MuscleKey[]; helpers: MuscleKey[]; howItHelps: string; tissue?: TissueTrack; view?: BodyView; hide3D?: true; status: AnatomyStatus }`.
  - `MUSCLES: Readonly<Record<MuscleKey, MuscleGroup>>`, `type MuscleKey`.

- [ ] **Step 1: Write the failing test**

Create `tests/lib/exercise-anatomy/muscles.test.ts`:

```ts
// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { BodyModelManifest } from "@/lib/body-model-format";
import { MUSCLES, type MuscleKey } from "@/lib/exercise-anatomy/muscles";

const base = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "public", "models", "body-chart", "manifest.json"), "utf8")
) as BodyModelManifest;
const baseNames = base.parts.map((p) => p.name);
const entries = Object.entries(MUSCLES) as [MuscleKey, (typeof MUSCLES)[MuscleKey]][];

/** null when the patterns light at least one part, on both sides if the parts are sided. */
function sideProblem(names: readonly string[], patterns: readonly RegExp[]): string | null {
  const hits = names.filter((n) => patterns.some((r) => r.test(n)));
  if (!hits.length) return "matches no part";
  const sided = hits.filter((n) => /\b(right|left)\b/i.test(n));
  const both = sided.some((n) => /\bright\b/i.test(n)) && sided.some((n) => /\bleft\b/i.test(n));
  return sided.length && !both ? "matches one side only" : null;
}

describe("muscle dictionary", () => {
  it("uses case-insensitive, stateless patterns", () => {
    for (const [key, m] of entries) {
      for (const r of [...m.parts, ...(m.standIn?.parts ?? [])]) {
        expect(r.flags, key).toContain("i");
        expect(r.global || r.sticky, key).toBe(false);
      }
    }
  });

  it("lights base-model parts on both sides for every base muscle", () => {
    for (const [key, m] of entries.filter(([, m]) => m.source === "base")) {
      expect(sideProblem(baseNames, m.parts), key).toBeNull();
    }
  });

  it("gives a muscle that is not in the model no parts, and any stand-in real base parts", () => {
    for (const [key, m] of entries.filter(([, m]) => m.source === "none")) {
      expect(m.parts, key).toHaveLength(0);
      if (m.standIn) {
        expect(sideProblem(baseNames, m.standIn.parts), key).toBeNull();
        expect(m.standIn.note, key).toMatch(/isn't in the 3D model|aren't in the 3D model/);
      }
    }
  });

  it("only gives stand-ins to muscles that are not in the model", () => {
    for (const [key, m] of entries.filter(([, m]) => m.source !== "none")) {
      expect(m.standIn, key).toBeUndefined();
    }
  });

  it("writes labels capitalised and plain words lower-case with no full stop", () => {
    for (const [key, m] of entries) {
      expect(m.label, key).toMatch(/^[A-Z]/);
      expect(m.plain, key).toMatch(/^[a-z]/);
      expect(m.plain, key).not.toMatch(/\.$/);
    }
  });

  it("keeps the face out of 3D (the model has no facial muscles)", () => {
    for (const key of ["frontalis", "orbicularis-oculi", "zygomaticus", "orbicularis-oris", "buccinator"] as MuscleKey[]) {
      expect(MUSCLES[key].source).toBe("none");
      expect(MUSCLES[key].standIn).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/exercise-anatomy/muscles.test.ts`
Expected: FAIL. It can't resolve `@/lib/exercise-anatomy/muscles`.

- [ ] **Step 3: Write the types**

Create `lib/exercise-anatomy/types.ts`:

```ts
// lib/exercise-anatomy/types.ts
// Shapes for the exercise-page anatomy: the muscle dictionary entries, what each
// exercise works, and the shared healing-copy tracks.

import type { MuscleKey } from "@/lib/exercise-anatomy/muscles";

export type BodyView = "front" | "back" | "left" | "right";

/** Where a muscle's 3D parts come from: the booking model, the add-on, or nowhere. */
export type MuscleSource = "base" | "addon" | "none";

export interface MuscleGroup {
  /** "Gluteus medius" */
  label: string;
  /** "side of your hip": shown as "Gluteus medius (side of your hip)" */
  plain: string;
  source: MuscleSource;
  /** Matched against model part names (case-insensitive, never /g). Empty when source is "none". */
  parts: readonly RegExp[];
  /** Nearest base-model parts, lit instead when the muscle itself is not in any model. */
  standIn?: { parts: readonly RegExp[]; note: string };
  /** The side it is best seen from; the 3D view starts there. */
  view: BodyView;
}

export type TissueTrack = "muscle-tendon" | "joint-ligament" | "post-surgery" | "nerve-brain" | "pelvic-floor";

export type AnatomyStatus = "draft" | "approved";

export interface ExerciseAnatomy {
  /** 1–3, no duplicates. */
  main: MuscleKey[];
  /** 0–4, none also in main. */
  helpers: MuscleKey[];
  /** 2–3 sentences, at most 60 words. */
  howItHelps: string;
  /** Omitted for general fitness, falls-prevention balance and pain education. */
  tissue?: TissueTrack;
  /** Overrides the first main muscle's view. */
  view?: BodyView;
  /** Clinical override: text section only, no 3D button. */
  hide3D?: true;
  status: AnatomyStatus;
}
```

- [ ] **Step 4: Write the dictionary**

Create `lib/exercise-anatomy/muscles.ts`:

```ts
// lib/exercise-anatomy/muscles.ts
// Muscle dictionary for the exercise pages: plain-English names plus the model
// part names each one lights up (base = public/models/body-chart, addon =
// public/models/exercise-anatomy). tests/lib/exercise-anatomy/muscles.test.ts
// checks every pattern against the committed manifests, so a typo fails a test,
// not the page. Pure data with no exercise entries: safe for client bundles.

import type { MuscleGroup } from "@/lib/exercise-anatomy/types";

const MUSCLE_TABLE = {
  // Hip and thigh
  "gluteus-maximus": { label: "Gluteus maximus", plain: "your main buttock muscle", source: "base", parts: [/gluteus maximus/i], view: "back" },
  "gluteus-medius": { label: "Gluteus medius", plain: "side of your hip", source: "base", parts: [/gluteus medius/i], view: "right" },
  "gluteus-minimus": { label: "Gluteus minimus", plain: "deep side of your hip", source: "base", parts: [/gluteus minimus/i], view: "right" },
  "deep-hip-rotators": {
    label: "Deep hip rotators",
    plain: "deep muscles at the back of your hip, including piriformis",
    source: "base",
    parts: [/piriformis|gemellus|obturator (internus|externus)|quadratus femoris/i],
    view: "back",
  },
  iliopsoas: { label: "Iliopsoas", plain: "deep hip flexor at the front of your hip", source: "base", parts: [/psoas major|iliacus/i], view: "front" },
  quadriceps: { label: "Quadriceps", plain: "front of your thigh", source: "base", parts: [/rectus femoris|vastus (lateralis|medialis|intermedius)/i], view: "front" },
  "vastus-medialis": { label: "Vastus medialis", plain: "inner front of your thigh, just above the knee", source: "base", parts: [/vastus medialis/i], view: "front" },
  "rectus-femoris": { label: "Rectus femoris", plain: "the thigh muscle that also lifts your leg at the hip", source: "base", parts: [/rectus femoris/i], view: "front" },
  hamstrings: { label: "Hamstrings", plain: "back of your thigh", source: "base", parts: [/biceps femoris|semitendinosus|semimembranosus/i], view: "back" },
  adductors: { label: "Adductors", plain: "inner thigh", source: "base", parts: [/adductor (longus|brevis|magnus|minimus)|gracilis|pectineus/i], view: "front" },
  "tfl-it-band": { label: "Tensor fasciae latae and IT band", plain: "outside of your hip and thigh", source: "base", parts: [/tensor fasciae latae|iliotibial tract/i], view: "right" },
  patella: { label: "Kneecap (patella)", plain: "the bone at the front of your knee", source: "base", parts: [/patella/i], view: "front" },
  "patellar-tendon": {
    label: "Patellar tendon",
    plain: "the tendon just below your kneecap",
    source: "none",
    parts: [],
    standIn: { parts: [/patella/i], note: "The patellar tendon isn't in the 3D model, so the kneecap it attaches to is lit instead." },
    view: "front",
  },

  // Lower leg and foot
  gastrocnemius: { label: "Gastrocnemius", plain: "the big calf muscle", source: "base", parts: [/gastrocnemius/i], view: "back" },
  soleus: { label: "Soleus", plain: "deep calf muscle", source: "base", parts: [/soleus/i], view: "back" },
  "achilles-tendon": { label: "Achilles tendon", plain: "back of your ankle", source: "base", parts: [/calcaneal tendon/i], view: "back" },
  "tibialis-anterior": { label: "Tibialis anterior", plain: "front of your shin", source: "base", parts: [/tibialis anterior/i], view: "front" },
  "tibialis-posterior": { label: "Tibialis posterior", plain: "deep inside of your lower leg, supporting your arch", source: "base", parts: [/tibialis posterior/i], view: "back" },
  fibularis: { label: "Fibularis (peroneals)", plain: "outside of your lower leg and ankle", source: "base", parts: [/fibularis (longus|brevis)/i], view: "right" },
  "foot-intrinsics": {
    label: "Small foot muscles",
    plain: "the muscles in the sole of your foot",
    source: "base",
    parts: [
      /(lumbrical|plantar interosseous|abductor digiti minimi|flexor digiti minimi brevis|opponens digiti minimi) of (right|left) foot|abductor hallucis|flexor digitorum brevis|flexor hallucis brevis|flexor accessorius|adductor hallucis/i,
    ],
    view: "front",
  },

  // Shoulder and arm
  deltoid: { label: "Deltoid", plain: "the rounded muscle over your shoulder", source: "base", parts: [/deltoid/i], view: "right" },
  "front-deltoid": { label: "Front deltoid", plain: "front of your shoulder", source: "base", parts: [/clavicular part of (right|left) deltoid/i], view: "front" },
  "rear-deltoid": { label: "Rear deltoid", plain: "back of your shoulder", source: "base", parts: [/spinal part of (right|left) deltoid/i], view: "back" },
  "rotator-cuff": {
    label: "Rotator cuff",
    plain: "four small muscles that keep your shoulder joint centred",
    source: "base",
    parts: [/supraspinatus|infraspinatus|teres minor|subscapularis/i],
    view: "back",
  },
  supraspinatus: { label: "Supraspinatus", plain: "top of your shoulder blade", source: "base", parts: [/supraspinatus/i], view: "back" },
  infraspinatus: { label: "Infraspinatus", plain: "back of your shoulder blade", source: "base", parts: [/infraspinatus/i], view: "back" },
  "teres-minor": { label: "Teres minor", plain: "small muscle under the back of your shoulder", source: "base", parts: [/teres minor/i], view: "back" },
  subscapularis: { label: "Subscapularis", plain: "front of your shoulder blade, against your ribs", source: "base", parts: [/subscapularis/i], view: "front" },
  "teres-major": { label: "Teres major", plain: "lower edge of your shoulder blade", source: "base", parts: [/teres major/i], view: "back" },
  "latissimus-dorsi": {
    label: "Latissimus dorsi",
    plain: "the broad muscle across your back and side",
    source: "none",
    parts: [],
    standIn: {
      parts: [/teres major|serratus posterior inferior/i],
      note: "Latissimus dorsi isn't in the 3D model, so the muscles lying just under it are lit instead.",
    },
    view: "back",
  },
  "pectoralis-major": { label: "Pectoralis major", plain: "your chest muscle", source: "base", parts: [/pectoralis major/i], view: "front" },
  "pectoralis-minor": { label: "Pectoralis minor", plain: "small chest muscle under pectoralis major", source: "base", parts: [/pectoralis minor/i], view: "front" },
  "serratus-anterior": { label: "Serratus anterior", plain: "side of your ribs, holding your shoulder blade flat", source: "base", parts: [/serratus anterior/i], view: "right" },
  rhomboids: { label: "Rhomboids", plain: "between your shoulder blades", source: "base", parts: [/rhomboid (major|minor)/i], view: "back" },
  "upper-trapezius": { label: "Upper trapezius", plain: "top of your shoulders and neck", source: "base", parts: [/descending part of (right|left) trapezius/i], view: "back" },
  "middle-trapezius": { label: "Middle trapezius", plain: "across your upper back", source: "base", parts: [/transverse part of (right|left) trapezius/i], view: "back" },
  "lower-trapezius": { label: "Lower trapezius", plain: "middle of your back, below your shoulder blades", source: "base", parts: [/ascending part of (right|left) trapezius/i], view: "back" },
  "levator-scapulae": { label: "Levator scapulae", plain: "side and back of your neck", source: "base", parts: [/levator scapulae/i], view: "back" },
  "biceps-brachii": { label: "Biceps", plain: "front of your upper arm", source: "base", parts: [/biceps brachii/i], view: "front" },
  brachialis: { label: "Brachialis", plain: "deep front of your upper arm", source: "base", parts: [/\bbrachialis\b/i], view: "front" },
  brachioradialis: { label: "Brachioradialis", plain: "top of your forearm, near the elbow", source: "base", parts: [/brachioradialis/i], view: "front" },
  triceps: { label: "Triceps", plain: "back of your upper arm", source: "base", parts: [/triceps brachii|anconeus/i], view: "back" },
  "wrist-extensors": { label: "Wrist extensors", plain: "top of your forearm", source: "base", parts: [/extensor carpi (radialis longus|radialis brevis|ulnaris)/i], view: "back" },
  "finger-extensors": {
    label: "Finger and thumb extensors",
    plain: "top of your forearm and back of your hand",
    source: "base",
    parts: [/extensor digitorum$|extensor indicis|extensor digiti minimi|extensor pollicis (longus|brevis)|abductor pollicis longus/i],
    view: "back",
  },
  "wrist-flexors": { label: "Wrist flexors", plain: "inside of your forearm", source: "base", parts: [/flexor carpi (radialis|ulnaris)|palmaris longus/i], view: "front" },
  "finger-flexors": {
    label: "Finger flexors",
    plain: "inside of your forearm, bending your fingers",
    source: "base",
    parts: [/flexor digitorum (superficialis|profundus)|flexor pollicis longus/i],
    view: "front",
  },
  "forearm-rotators": {
    label: "Pronators and supinator",
    plain: "forearm muscles that turn your palm up and down",
    source: "base",
    parts: [/pronator (teres|quadratus)|supinator/i],
    view: "front",
  },
  "hand-intrinsics": {
    label: "Small hand muscles",
    plain: "the muscles in your palm and between your fingers",
    source: "base",
    parts: [
      /(lumbricals|interossei) of (right|left) hand|(abductor digiti minimi|flexor digiti minimi brevis|opponens digiti minimi) of (right|left) hand|abductor pollicis brevis|flexor pollicis brevis|opponens pollicis|adductor pollicis/i,
    ],
    view: "front",
  },

  // Nerves (no limb nerves in the model)
  "median-nerve": {
    label: "Median nerve",
    plain: "the nerve running down the inside of your arm to your hand",
    source: "none",
    parts: [],
    standIn: {
      parts: [/flexor digitorum superficialis|flexor carpi radialis|pronator teres|palmaris longus/i],
      note: "Nerves aren't in the 3D model. The median nerve runs between these forearm muscles, so they are lit instead.",
    },
    view: "front",
  },
  "sciatic-nerve": {
    label: "Sciatic nerve",
    plain: "the nerve running from your lower back down the back of your leg",
    source: "none",
    parts: [],
    standIn: {
      parts: [/piriformis|biceps femoris|semitendinosus|semimembranosus/i],
      note: "Nerves aren't in the 3D model. The sciatic nerve runs under piriformis and down between the hamstrings, so they are lit instead.",
    },
    view: "back",
  },

  // Spine and trunk
  "erector-spinae": { label: "Erector spinae", plain: "the long muscles either side of your spine", source: "base", parts: [/iliocostalis|longissimus|\bspinalis\b/i], view: "back" },
  multifidus: {
    label: "Multifidus",
    plain: "small deep muscles that steady each joint of your lower back",
    source: "none",
    parts: [],
    standIn: {
      parts: [/lumbar rotator|interspinales lumborum|lumbar intertransversarius/i],
      note: "Multifidus isn't in the 3D model, so the small deep muscles beside it on your lower spine are lit instead.",
    },
    view: "back",
  },
  "quadratus-lumborum": {
    label: "Quadratus lumborum",
    plain: "deep muscle between your lowest rib and your pelvis",
    source: "none",
    parts: [],
    standIn: {
      parts: [/lateral lumbar intertransversarius|iliocostalis lumborum/i],
      note: "Quadratus lumborum isn't in the 3D model, so the deep muscles next to it are lit instead.",
    },
    view: "back",
  },
  "rectus-abdominis": {
    label: "Rectus abdominis",
    plain: "the six-pack muscle down the front of your tummy",
    source: "none",
    parts: [],
    standIn: {
      parts: [/linea alba|external oblique/i],
      note: "Rectus abdominis isn't in the 3D model, so the tummy muscle beside it and the band down its middle are lit instead.",
    },
    view: "front",
  },
  "transversus-abdominis": {
    label: "Transversus abdominis",
    plain: "the deepest tummy muscle, wrapping round like a corset",
    source: "none",
    parts: [],
    standIn: {
      parts: [/linea alba|external oblique/i],
      note: "Transversus abdominis isn't in the 3D model, so the tummy muscles over it are lit instead.",
    },
    view: "front",
  },
  "external-oblique": { label: "External oblique", plain: "side of your tummy", source: "base", parts: [/external oblique/i], view: "right" },
  intercostals: { label: "Intercostals", plain: "small muscles between your ribs", source: "base", parts: [/external intercostal/i], view: "right" },
  diaphragm: { label: "Diaphragm", plain: "the dome-shaped breathing muscle under your ribs", source: "addon", parts: [/\bdiaphragm\b/i], view: "front" },
  "pelvic-floor": {
    label: "Pelvic floor muscles",
    plain: "the sling of muscles at the base of your pelvis",
    source: "addon",
    parts: [/coccygeus|puborectalis|anal sphincter|perineal/i],
    view: "front",
  },
  "lumbar-discs": {
    label: "Lower back discs",
    plain: "the cushions between the bones of your lower back",
    source: "addon",
    parts: [/intervertebral disk of (first|second|third|fourth|fifth) lumbar vertebra/i],
    view: "back",
  },
  "neck-discs": {
    label: "Neck discs",
    plain: "the cushions between the bones of your neck",
    source: "addon",
    parts: [/intervertebral disk of (axis|(third|fourth|fifth|sixth|seventh) cervical vertebra)/i],
    view: "back",
  },
  "lumbar-spine": { label: "Lower back joints", plain: "the bones and joints of your lower back", source: "base", parts: [/^(first|second|third|fourth|fifth) lumbar vertebra$|^sacrum$/i], view: "back" },
  "thoracic-spine": { label: "Mid-back joints", plain: "the bones and joints of your upper and mid back", source: "base", parts: [/thoracic vertebra$/i], view: "back" },
  "cervical-spine": { label: "Neck joints", plain: "the bones and joints of your neck", source: "base", parts: [/cervical vertebra$|^atlas$|^axis$/i], view: "back" },

  // Neck
  "deep-neck-flexors": {
    label: "Deep neck flexors",
    plain: "deep muscles at the front of your neck",
    source: "addon",
    parts: [/longus colli|longus capitis|rectus capitis (anterior|lateralis)/i],
    view: "right",
  },
  "neck-extensors": {
    label: "Neck extensors",
    plain: "the muscles at the back of your neck",
    source: "base",
    parts: [/semispinalis (capitis|cervicis)|splenius (capitis|cervicis)|longissimus capitis|rectus capitis posterior|obliquus capitis/i],
    view: "back",
  },
  sternocleidomastoid: { label: "Sternocleidomastoid", plain: "the muscle running down the side of your neck", source: "base", parts: [/sternocleidomastoid/i], view: "right" },
  scalenes: { label: "Scalenes", plain: "deep side of your neck", source: "base", parts: [/scalenus/i], view: "right" },

  // Face (no facial muscles in any model we use: text only)
  frontalis: { label: "Frontalis", plain: "the forehead muscle that raises your eyebrows", source: "none", parts: [], view: "front" },
  corrugator: { label: "Corrugator and procerus", plain: "the small muscles between your eyebrows that frown", source: "none", parts: [], view: "front" },
  "orbicularis-oculi": { label: "Orbicularis oculi", plain: "the ring of muscle around your eye", source: "none", parts: [], view: "front" },
  "levator-palpebrae": { label: "Levator palpebrae", plain: "the muscle that lifts your upper eyelid", source: "none", parts: [], view: "front" },
  zygomaticus: { label: "Zygomaticus major", plain: "the cheek muscle that lifts the corners of your mouth", source: "none", parts: [], view: "front" },
  risorius: { label: "Risorius", plain: "the muscle that pulls the corners of your mouth sideways", source: "none", parts: [], view: "front" },
  buccinator: { label: "Buccinator", plain: "the cheek muscle that holds air in your mouth", source: "none", parts: [], view: "front" },
  "orbicularis-oris": { label: "Orbicularis oris", plain: "the ring of muscle around your lips", source: "none", parts: [], view: "front" },
} satisfies Record<string, MuscleGroup>;

export type MuscleKey = keyof typeof MUSCLE_TABLE;

/** Widened so every entry reads as a MuscleGroup (optional standIn included). */
export const MUSCLES: Readonly<Record<MuscleKey, MuscleGroup>> = MUSCLE_TABLE;
```

- [ ] **Step 5: Run the test to verify it passes, and typecheck**

Run: `npx vitest run tests/lib/exercise-anatomy/muscles.test.ts`
Expected: PASS (6 tests).

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "lib/exercise-anatomy|tests/lib/exercise-anatomy" || echo "no type errors in my files"`
Expected: `no type errors in my files`.

- [ ] **Step 6: Commit**

```bash
git branch --show-current
git add lib/exercise-anatomy/types.ts lib/exercise-anatomy/muscles.ts tests/lib/exercise-anatomy/muscles.test.ts
git commit -m "feat(exercise-anatomy): muscle dictionary mapped to 3D model parts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Add-on model (pelvic floor, diaphragm, deep neck flexors, discs)

**Files:**
- Create: `lib/exercise-anatomy/addon-parts.ts`
- Create: `scripts/build-anatomy-addon.ts`
- Modify: `package.json` (one script line after `"build:body-model"`)
- Generated and committed: `public/models/exercise-anatomy/manifest.json`, `public/models/exercise-anatomy/chunk-0.bin.gz` (and `chunk-1…` if the script writes more), `public/models/exercise-anatomy/ATTRIBUTION.md`
- Test: `tests/lib/exercise-anatomy/addon-model.test.ts`

**Interfaces:**
- Consumes: `MUSCLES` (Task 1); `writeChunk`, `NO_REGION`, `POSITION_SCALE`, `MAX_CHUNK_VERTICES`, `MODEL_SYSTEMS`, `BodyModelManifest`, `ModelChunk`, `ModelPart`, `ModelSystem` from `lib/body-model-format.ts`.
- Produces:
  - `ADDON_PART: RegExp`.
  - `ANATOMY_ADDON_DIR = "/models/exercise-anatomy"`.
  - Committed add-on files in the same format as the booking model, with `regions: []` and every vertex `NO_REGION`.

- [ ] **Step 1: Write the shared constants**

Create `lib/exercise-anatomy/addon-parts.ts`:

```ts
// lib/exercise-anatomy/addon-parts.ts
// The deep structures exercise pages need but the booking model leaves out
// (EXCLUDE in lib/body-chart-3d-regions.ts): pelvic floor, diaphragm, deep neck
// flexors and the intervertebral discs. Shared by scripts/build-anatomy-addon.ts,
// the add-on loader and the tests.

export const ANATOMY_ADDON_DIR = "/models/exercise-anatomy";

export const ADDON_PART =
  /coccygeus|puborectalis|anal sphincter|perineal|\bdiaphragm\b|longus colli|longus capitis|rectus capitis (anterior|lateralis)|intervertebral disk of/i;
```

- [ ] **Step 2: Write the failing test**

Create `tests/lib/exercise-anatomy/addon-model.test.ts`:

```ts
// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { NO_REGION, readChunk, type BodyModelManifest } from "@/lib/body-model-format";
import { ADDON_PART } from "@/lib/exercise-anatomy/addon-parts";
import { MUSCLES, type MuscleKey } from "@/lib/exercise-anatomy/muscles";

const ROOT = path.join(process.cwd(), "public", "models");
const read = (dir: string) => JSON.parse(fs.readFileSync(path.join(ROOT, dir, "manifest.json"), "utf8")) as BodyModelManifest;
const addon = read("exercise-anatomy");
const base = read("body-chart");

function sideProblem(names: readonly string[], patterns: readonly RegExp[]): string | null {
  const hits = names.filter((n) => patterns.some((r) => r.test(n)));
  if (!hits.length) return "matches no part";
  const sided = hits.filter((n) => /\b(right|left)\b/i.test(n));
  const both = sided.some((n) => /\bright\b/i.test(n)) && sided.some((n) => /\bleft\b/i.test(n));
  return sided.length && !both ? "matches one side only" : null;
}

describe("committed exercise-anatomy add-on model", () => {
  it("holds only add-on structures, with no booking areas", () => {
    expect(addon.regions).toEqual([]);
    expect(addon.parts.length).toBeGreaterThan(0);
    for (const p of addon.parts) expect(ADDON_PART.test(p.name), p.name).toBe(true);
  });

  it("stays a small download (at most 500 KB gzipped)", () => {
    const gz = addon.chunks.reduce((n, c) => n + fs.statSync(path.join(ROOT, "exercise-anatomy", c.file)).size, 0);
    expect(gz).toBe(addon.chunks.reduce((n, c) => n + c.gzipBytes, 0));
    expect(gz).toBeLessThanOrEqual(500_000);
  });

  it("tiles each chunk and keeps indices in range, with no areas baked in", () => {
    addon.chunks.forEach((c, i) => {
      const parts = addon.parts.filter((p) => p.chunk === i);
      expect(parts.reduce((n, p) => n + p.indexCount, 0)).toBe(c.indexCount);
      expect(parts.reduce((n, p) => n + p.vertexCount, 0)).toBe(c.vertexCount);
      const raw = gunzipSync(fs.readFileSync(path.join(ROOT, "exercise-anatomy", c.file)));
      const arrays = readChunk(c, raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length));
      expect(arrays.regions.every((r) => r === NO_REGION)).toBe(true);
      let maxIndex = 0;
      for (const i of arrays.indices) if (i > maxIndex) maxIndex = i; // no spread: tens of thousands of indices
      expect(maxIndex).toBeLessThan(c.vertexCount);
    });
  });

  it("lights add-on parts on both sides for every add-on muscle", () => {
    const names = addon.parts.map((p) => p.name);
    const keys = (Object.keys(MUSCLES) as MuscleKey[]).filter((k) => MUSCLES[k].source === "addon");
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) expect(sideProblem(names, MUSCLES[key].parts), key).toBeNull();
  });

  it("leaves the booking model untouched", () => {
    expect(base.parts).toHaveLength(569);
    expect(base.parts.filter((p) => ADDON_PART.test(p.name))).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/lib/exercise-anatomy/addon-model.test.ts`
Expected: FAIL with ENOENT for `public/models/exercise-anatomy/manifest.json`.

- [ ] **Step 4: Write the build script**

Create `scripts/build-anatomy-addon.ts`:

```ts
// scripts/build-anatomy-addon.ts
// Builds the exercise-page add-on model in public/models/exercise-anatomy/: the
// deep structures the booking model leaves out (ADDON_PART: pelvic floor,
// diaphragm, deep neck flexors, intervertebral discs). Same source, pinned
// commit and binary format as scripts/build-body-model.ts, so the viewer draws
// both with one transform. Vertices carry NO_REGION: none of this is part of
// the booking chart, and the booking model files are not touched.
//
// Run from the repo root: npm run build:anatomy-addon
// (reuses .cache/human-atlas/ from build:body-model, or downloads it once)

import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { MeshoptSimplifier } from "meshoptimizer";
import { ADDON_PART } from "../lib/exercise-anatomy/addon-parts";
import {
  MAX_CHUNK_VERTICES,
  MODEL_SYSTEMS,
  NO_REGION,
  POSITION_SCALE,
  writeChunk,
  type BodyModelManifest,
  type ModelChunk,
  type ModelPart,
  type ModelSystem,
} from "../lib/body-model-format";

const COMMIT = "1c38bf35c254a891200d3cedecfd57abebe83d8d"; // same pin as build-body-model.ts
const RAW = `https://raw.githubusercontent.com/ashemag/human-atlas/${COMMIT}/public/models`;
const ROOT = process.cwd();
const CACHE = path.join(ROOT, ".cache", "human-atlas", COMMIT.slice(0, 12));
const OUT = path.join(ROOT, "public", "models", "exercise-anatomy");

const TRIANGLE_BUDGET = 30_000;
const MAX_ERROR = 0.02;
const MIN_TRIANGLES = 48;
const MAX_GZIP_BYTES = 500_000;
const KEEP_SYSTEMS: readonly ModelSystem[] = ["skeletal", "muscular"];

interface SourcePart {
  name: string;
  system: string;
  chunk: number;
  positions: number;
  normals: number;
  indices: number;
  vertexCount: number;
  indexCount: number;
}
interface SourceAtlas {
  parts: SourcePart[];
  chunks: { url: string; bytes: number; gzip: string; gzipBytes: number }[];
}

async function download(file: string): Promise<Buffer> {
  const local = path.join(CACHE, file);
  if (fs.existsSync(local)) return fs.readFileSync(local);
  const res = await fetch(`${RAW}/${file}`);
  if (!res.ok) throw new Error(`Download failed: ${file} (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(local, buf);
  return buf;
}

function concat<T extends Int16Array | Int8Array | Uint8Array | Uint16Array>(list: T[], make: (n: number) => T): T {
  const out = make(list.reduce((n, a) => n + a.length, 0));
  let offset = 0;
  for (const a of list) {
    out.set(a as unknown as ArrayLike<number>, offset);
    offset += a.length;
  }
  return out;
}

const ATTRIBUTION = `# Exercise anatomy add-on attribution

## Anatomy data

BodyParts3D, © The Database Center for Life Science, licensed under Creative Commons
Attribution 4.0 International (CC BY 4.0).

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical
  concepts. https://doi.org/10.1093/nar/gkn613

Adaptations by PhysioOnClick: kept only the pelvic floor muscles, diaphragm, deep neck
flexors and intervertebral disks; simplified with meshoptimizer; quantised positions and
normals; merged into chunks.

## Packaging

Converted geometry taken from Human Atlas (https://github.com/ashemag/human-atlas) at commit
${COMMIT}, MIT License, Copyright (c) 2026 ashemag. The full MIT notice is in
/models/body-chart/ATTRIBUTION.md.
`;

async function main() {
  await MeshoptSimplifier.ready;
  const atlas = JSON.parse((await download("atlas.json")).toString("utf8")) as SourceAtlas;
  const sources = await Promise.all(
    atlas.chunks.map(async (c) => {
      const raw = gunzipSync(await download(path.basename(c.gzip)));
      if (raw.length !== c.bytes) throw new Error(`${c.gzip} unpacked to ${raw.length} bytes, expected ${c.bytes}`);
      return raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length);
    })
  );

  const systems: ModelSystem[] = [...MODEL_SYSTEMS];
  const kept = atlas.parts.filter((p) => KEEP_SYSTEMS.includes(p.system as ModelSystem) && ADDON_PART.test(p.name));
  if (!kept.length) throw new Error("No atlas parts matched ADDON_PART");
  const sourceTriangles = kept.reduce((n, p) => n + p.indexCount / 3, 0);
  const ratio = Math.min(1, TRIANGLE_BUDGET / sourceTriangles);

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const parts: ModelPart[] = [];
  const chunks: ModelChunk[] = [];
  type Pending = { positions: Int16Array[]; normals: Int8Array[]; regions: Uint8Array[]; indices: Uint16Array[]; vertexCount: number; indexCount: number };
  const empty = (): Pending => ({ positions: [], normals: [], regions: [], indices: [], vertexCount: 0, indexCount: 0 });
  let pending = empty();

  const flush = () => {
    if (!pending.vertexCount) return;
    const bytes = writeChunk({
      positions: concat(pending.positions, (n) => new Int16Array(n)),
      normals: concat(pending.normals, (n) => new Int8Array(n)),
      regions: concat(pending.regions, (n) => new Uint8Array(n)),
      indices: concat(pending.indices, (n) => new Uint16Array(n)),
    });
    const file = `chunk-${chunks.length}.bin.gz`;
    const gz = gzipSync(bytes, { level: 9 });
    fs.writeFileSync(path.join(OUT, file), gz);
    chunks.push({ file, bytes: bytes.length, gzipBytes: gz.length, vertexCount: pending.vertexCount, indexCount: pending.indexCount });
    pending = empty();
  };

  for (const p of kept) {
    const src = sources[p.chunk];
    const pos = new Float32Array(src, p.positions, p.vertexCount * 3);
    const nrm = new Int16Array(src, p.normals, p.vertexCount * 3);
    const idx = new Uint32Array(src, p.indices, p.indexCount);
    const target = Math.min(p.indexCount, Math.max(MIN_TRIANGLES * 3, Math.floor((p.indexCount * ratio) / 3) * 3));
    const [simplified] = MeshoptSimplifier.simplify(idx, pos, 3, target, MAX_ERROR);
    const [remap, vertexCount] = MeshoptSimplifier.compactMesh(simplified); // rewrites `simplified` in place
    if (vertexCount > MAX_CHUNK_VERTICES) throw new Error(`${p.name} has ${vertexCount} vertices after simplification`);
    if (pending.vertexCount + vertexCount > MAX_CHUNK_VERTICES) flush();

    const positions = new Int16Array(vertexCount * 3);
    const normals = new Int8Array(vertexCount * 3);
    const regions = new Uint8Array(vertexCount).fill(NO_REGION);
    for (let old = 0; old < remap.length; old++) {
      const v = remap[old];
      if (v === 0xffffffff) continue;
      for (let k = 0; k < 3; k++) {
        positions[v * 3 + k] = Math.round((pos[old * 3 + k] / POSITION_SCALE) * 32767);
        normals[v * 3 + k] = Math.round((nrm[old * 3 + k] / 32767) * 127);
      }
    }
    const indices = new Uint16Array(simplified.length);
    for (let i = 0; i < simplified.length; i++) indices[i] = simplified[i] + pending.vertexCount;

    parts.push({
      name: p.name,
      system: systems.indexOf(p.system as ModelSystem),
      chunk: chunks.length,
      firstVertex: pending.vertexCount,
      vertexCount,
      firstIndex: pending.indexCount,
      indexCount: indices.length,
    });
    pending.positions.push(positions);
    pending.normals.push(normals);
    pending.regions.push(regions);
    pending.indices.push(indices);
    pending.vertexCount += vertexCount;
    pending.indexCount += indices.length;
  }
  flush();

  const triangles = parts.reduce((n, p) => n + p.indexCount / 3, 0);
  const manifest: BodyModelManifest = {
    version: 1,
    source: `BodyParts3D 4.0 via Human Atlas ${COMMIT.slice(0, 12)} (exercise add-on)`,
    triangles,
    regions: [],
    systems,
    parts,
    chunks,
  };
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest));
  fs.writeFileSync(path.join(OUT, "ATTRIBUTION.md"), ATTRIBUTION);

  const gzipTotal = chunks.reduce((n, c) => n + c.gzipBytes, 0);
  console.log(`add-on parts ${parts.length}, triangles ${triangles}, chunks ${chunks.length}, download ${(gzipTotal / 1e3).toFixed(0)} KB`);
  if (gzipTotal > MAX_GZIP_BYTES) {
    throw new Error(`Add-on is ${(gzipTotal / 1e3).toFixed(0)} KB; the cap is ${MAX_GZIP_BYTES / 1e3} KB. Lower TRIANGLE_BUDGET.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

In `package.json`, add this line directly after the `"build:body-model": "tsx scripts/build-body-model.ts",` line:

```json
    "build:anatomy-addon": "tsx scripts/build-anatomy-addon.ts",
```

- [ ] **Step 5: Run the script**

Reuse the atlas cache from the booking-chart worktree instead of downloading 33 MB (`.cache/` is gitignored):

```bash
mkdir -p .cache && [ -d .cache/human-atlas ] || cp -cR ../3d-body-chart/.cache/human-atlas .cache/human-atlas
npm run build:anatomy-addon
```

Expected: a line like `add-on parts 42, triangles …, chunks 1, download … KB`, with download under 500 KB, and no error. `git status --short public/models` shows only new files under `public/models/exercise-anatomy/`. Nothing under `public/models/body-chart/` changes.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/lib/exercise-anatomy/addon-model.test.ts tests/lib/exercise-anatomy/muscles.test.ts tests/lib/body-chart-3d-manifest.test.ts`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git branch --show-current
git add lib/exercise-anatomy/addon-parts.ts scripts/build-anatomy-addon.ts package.json public/models/exercise-anatomy tests/lib/exercise-anatomy/addon-model.test.ts
git commit -m "feat(exercise-anatomy): add-on model with pelvic floor, diaphragm, deep neck flexors and discs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Add-on loader

**Files:**
- Modify: `lib/body-model-loader.ts` (rename the private `readFile` to an exported `readModelFile`; update its one call site)
- Create: `lib/exercise-anatomy/addon-loader.ts`
- Test: `tests/lib/exercise-anatomy/addon-loader.test.ts`

**Interfaces:**
- Consumes: `ANATOMY_ADDON_DIR` (Task 2); `BodyModel`, `readChunk`, `BodyModelManifest`.
- Produces:
  - `readModelFile(response: Response, expectedBytes: number): Promise<ArrayBuffer>`, exported from `lib/body-model-loader.ts`.
  - `loadAnatomyAddon(): Promise<BodyModel>` and `resetAnatomyAddonForTests(): void`, from `lib/exercise-anatomy/addon-loader.ts`.

- [ ] **Step 1: Write the failing test**

Create `tests/lib/exercise-anatomy/addon-loader.test.ts`:

```ts
// @vitest-environment node
import { gzipSync } from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NO_REGION, writeChunk, type BodyModelManifest } from "@/lib/body-model-format";
import { loadAnatomyAddon, resetAnatomyAddonForTests } from "@/lib/exercise-anatomy/addon-loader";

const chunkBytes = writeChunk({
  positions: new Int16Array([0, 0, 0, 100, 0, 0, 0, 100, 0]),
  normals: new Int8Array([0, 0, 127, 0, 0, 127, 0, 0, 127]),
  regions: new Uint8Array([NO_REGION, NO_REGION, NO_REGION]),
  indices: new Uint16Array([0, 1, 2]),
});
const gz = gzipSync(chunkBytes);
const manifest: BodyModelManifest = {
  version: 1,
  source: "test",
  triangles: 1,
  regions: [],
  systems: ["skeletal", "muscular", "connective"],
  parts: [{ name: "Diaphragm", system: 1, chunk: 0, firstVertex: 0, vertexCount: 3, firstIndex: 0, indexCount: 3 }],
  chunks: [{ file: "chunk-0.bin.gz", bytes: chunkBytes.length, gzipBytes: gz.length, vertexCount: 3, indexCount: 3 }],
};

function mockFetch(fail = false) {
  return vi.fn(async (url: string) => {
    if (fail) return new Response("nope", { status: 500 });
    if (url === "/models/exercise-anatomy/manifest.json") return new Response(JSON.stringify(manifest));
    if (url === "/models/exercise-anatomy/chunk-0.bin.gz") return new Response(new Uint8Array(gz));
    return new Response("missing", { status: 404 });
  });
}

beforeEach(() => resetAnatomyAddonForTests());
afterEach(() => vi.unstubAllGlobals());

describe("loadAnatomyAddon", () => {
  it("downloads and decodes the add-on from its own folder", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const addon = await loadAnatomyAddon();
    expect(addon.manifest.parts[0].name).toBe("Diaphragm");
    expect([...addon.chunks[0].indices]).toEqual([0, 1, 2]);
  });

  it("downloads once however many times it is asked", async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);
    await Promise.all([loadAnatomyAddon(), loadAnatomyAddon()]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries after a failed download", async () => {
    vi.stubGlobal("fetch", mockFetch(true));
    await expect(loadAnatomyAddon()).rejects.toThrow();
    vi.stubGlobal("fetch", mockFetch());
    await expect(loadAnatomyAddon()).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/exercise-anatomy/addon-loader.test.ts`
Expected: FAIL. It can't resolve `@/lib/exercise-anatomy/addon-loader`.

- [ ] **Step 3: Export the shared file reader**

In `lib/body-model-loader.ts`, replace:

```ts
// Static hosts may serve .gz with or without Content-Encoding; fetch already
// decodes the former, so check the gzip magic bytes rather than decode twice.
async function readFile(response: Response, expectedBytes: number): Promise<ArrayBuffer> {
```

with:

```ts
// Static hosts may serve .gz with or without Content-Encoding; fetch already
// decodes the former, so check the gzip magic bytes rather than decode twice.
// Also used by lib/exercise-anatomy/addon-loader.ts for the add-on model.
export async function readModelFile(response: Response, expectedBytes: number): Promise<ArrayBuffer> {
```

and replace the call site:

```ts
        const buffer = await readFile(await fetch(`${BODY_MODEL_DIR}/${chunk.file}`), chunk.bytes);
```

with:

```ts
        const buffer = await readModelFile(await fetch(`${BODY_MODEL_DIR}/${chunk.file}`), chunk.bytes);
```

- [ ] **Step 4: Write the add-on loader**

Create `lib/exercise-anatomy/addon-loader.ts`:

```ts
// lib/exercise-anatomy/addon-loader.ts
// Downloads the exercise add-on model (public/models/exercise-anatomy) once
// per page load. Only exercises whose muscles live in the add-on ask for it.

import { readChunk, type BodyModelManifest } from "@/lib/body-model-format";
import { readModelFile, type BodyModel } from "@/lib/body-model-loader";
import { ANATOMY_ADDON_DIR } from "@/lib/exercise-anatomy/addon-parts";

let pending: Promise<BodyModel> | null = null;

export function loadAnatomyAddon(): Promise<BodyModel> {
  pending ??= (async () => {
    const res = await fetch(`${ANATOMY_ADDON_DIR}/manifest.json`);
    if (!res.ok) throw new Error(`Anatomy add-on manifest failed (${res.status})`);
    const manifest = (await res.json()) as BodyModelManifest;
    const chunks = await Promise.all(
      manifest.chunks.map(async (chunk) =>
        readChunk(chunk, await readModelFile(await fetch(`${ANATOMY_ADDON_DIR}/${chunk.file}`), chunk.bytes))
      )
    );
    return { manifest, chunks };
  })().catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}

/** Test-only: forget the cached add-on. */
export function resetAnatomyAddonForTests(): void {
  pending = null;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/lib/exercise-anatomy/addon-loader.test.ts tests/lib/body-model-loader.test.ts tests/lib/body-model-support.test.ts`
Expected: all PASS. The existing loader tests prove the rename changed no behaviour.

- [ ] **Step 6: Commit**

```bash
git branch --show-current
git add lib/body-model-loader.ts lib/exercise-anatomy/addon-loader.ts tests/lib/exercise-anatomy/addon-loader.test.ts
git commit -m "feat(exercise-anatomy): load the add-on model with the shared file reader

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Pure 3D scene helpers

**Files:**
- Create: `lib/exercise-anatomy/scene.ts`
- Test: `tests/lib/exercise-anatomy/scene.test.ts`

**Interfaces:**
- Consumes: `MUSCLES`, `MuscleKey` (Task 1); `ModelPart`.
- Produces:
  - Constants: `ROLE = { other: 0, main: 1, helper: 2 }`; `MATERIAL = { main: 0, helper: 1, muscle: 2, bone: 3 }`; `ANATOMY_COLOURS = { main: "#0EA5E9", helper: "#7DD3FC", muscle: "#C48C7C", bone: "#E8DFC6" }`; `type Box = [x0, y0, z0, x1, y1, z1]`.
  - Role and draw-group helpers:
    - `patternsFor(key): readonly RegExp[]`
    - `partRoles(parts, main, helpers): Uint8Array`
    - `drawGroups(parts, roles, systems): { start; count; materialIndex }[]`
  - Box and framing helpers:
    - `subsetBoxes(boxes, picks): Float32Array`
    - `unionBox(entries: readonly (readonly [Float32Array, number])[]): Box | null`
    - `fitDistance(size: { height; width }, fovDegrees, aspect, margin): number`
  - Label helpers:
    - `displayPartName(name): string`
    - `partLabel(partName, main, helpers): string`
    - `needsAddon(keys): boolean`
    - `standInNotes(keys): string[]`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/exercise-anatomy/scene.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { ModelPart } from "@/lib/body-model-format";
import {
  MATERIAL,
  ROLE,
  displayPartName,
  drawGroups,
  fitDistance,
  needsAddon,
  partLabel,
  partRoles,
  standInNotes,
  subsetBoxes,
  unionBox,
} from "@/lib/exercise-anatomy/scene";

const SYSTEMS = ["skeletal", "muscular", "connective"];
const part = (name: string, system: number, firstIndex: number, indexCount: number): ModelPart => ({
  name,
  system,
  chunk: 0,
  firstVertex: 0,
  vertexCount: 3,
  firstIndex,
  indexCount,
});

describe("partRoles", () => {
  const parts = [
    part("Right gluteus medius", 1, 0, 3),
    part("Right piriformis", 1, 3, 3),
    part("Right femur", 0, 6, 3),
    part("Right lumbar rotator", 1, 9, 3),
  ];

  it("marks main and helper parts, leaving the rest", () => {
    expect([...partRoles(parts, ["gluteus-medius"], ["deep-hip-rotators"])]).toEqual([ROLE.main, ROLE.helper, ROLE.other, ROLE.other]);
  });

  it("lets main win when a part is in both", () => {
    expect([...partRoles(parts, ["deep-hip-rotators"], ["deep-hip-rotators"])][1]).toBe(ROLE.main);
  });

  it("lights a stand-in for a muscle that is not in the model", () => {
    expect([...partRoles(parts, ["multifidus"], [])][3]).toBe(ROLE.main);
  });

  it("lights nothing for a face muscle", () => {
    expect([...partRoles(parts, ["zygomaticus"], [])]).toEqual([0, 0, 0, 0]);
  });
});

describe("drawGroups", () => {
  it("merges neighbouring parts that share a material and splits bone from muscle", () => {
    const parts = [part("A", 1, 0, 3), part("B", 1, 3, 6), part("C", 0, 9, 3), part("D", 1, 12, 3)];
    const roles = new Uint8Array([ROLE.main, ROLE.main, ROLE.other, ROLE.other]);
    expect(drawGroups(parts, roles, SYSTEMS)).toEqual([
      { start: 0, count: 9, materialIndex: MATERIAL.main },
      { start: 9, count: 3, materialIndex: MATERIAL.bone },
      { start: 12, count: 3, materialIndex: MATERIAL.muscle },
    ]);
  });
});

describe("boxes and framing", () => {
  const boxes = new Float32Array([0, 0, 0, 1, 1, 1, -1, 2, -1, 0, 3, 0]);

  it("copies the chosen boxes in order", () => {
    expect([...subsetBoxes(boxes, [1])]).toEqual([-1, 2, -1, 0, 3, 0]);
  });

  it("unions boxes across chunks, or returns null for none", () => {
    expect(unionBox([[boxes, 0], [boxes, 1]])).toEqual([-1, 0, -1, 1, 3, 1]);
    expect(unionBox([])).toBeNull();
  });

  it("backs off far enough to fit the box plus margin", () => {
    const tanHalf = Math.tan((30 * Math.PI) / 360);
    expect(fitDistance({ height: 1, width: 0.2 }, 30, 1, 0)).toBeCloseTo(0.5 / tanHalf);
    expect(fitDistance({ height: 1, width: 0.2 }, 30, 1, 0.25)).toBeCloseTo(0.75 / tanHalf);
    // A narrow stage is limited by width instead.
    expect(fitDistance({ height: 0.2, width: 1 }, 30, 0.5, 0)).toBeCloseTo(0.5 / (tanHalf * 0.5));
  });
});

describe("labels", () => {
  it("drops left/right from part names", () => {
    expect(displayPartName("Long head of right biceps femoris")).toBe("Long head of biceps femoris");
    expect(displayPartName("thoracic rotator")).toBe("Thoracic rotator");
  });

  it("names lit parts by their muscle and role", () => {
    expect(partLabel("Right gluteus medius", ["gluteus-medius"], [])).toBe("Gluteus medius: side of your hip (main focus)");
    expect(partLabel("Left piriformis", ["gluteus-medius"], ["deep-hip-rotators"])).toBe(
      "Deep hip rotators: deep muscles at the back of your hip, including piriformis (helper)"
    );
  });

  it("names stand-in parts as near the missing muscle", () => {
    expect(partLabel("Right teres major", ["latissimus-dorsi"], [])).toBe("Teres major, near the latissimus dorsi (main focus)");
  });

  it("falls back to the part's own name", () => {
    expect(partLabel("Right femur", ["gluteus-medius"], [])).toBe("Femur");
  });
});

describe("needsAddon and standInNotes", () => {
  it("asks for the add-on only when a muscle lives there", () => {
    expect(needsAddon(["gluteus-medius", "hamstrings"])).toBe(false);
    expect(needsAddon(["gluteus-maximus", "pelvic-floor"])).toBe(true);
  });

  it("lists each stand-in note once", () => {
    expect(standInNotes(["rectus-abdominis", "multifidus", "gluteus-medius"])).toHaveLength(2);
    expect(standInNotes(["gluteus-medius", "zygomaticus"])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/exercise-anatomy/scene.test.ts`
Expected: FAIL. It can't resolve `@/lib/exercise-anatomy/scene`.

- [ ] **Step 3: Write the helpers**

Create `lib/exercise-anatomy/scene.ts`:

```ts
// lib/exercise-anatomy/scene.ts
// Pure helpers behind the exercise 3D view: which model parts an exercise
// lights, how a chunk splits into draw groups, how to frame the lit muscles,
// and what a tapped part is called. No three.js import, so it stays cheap to
// test and can never pull three.js into a static bundle.

import type { ModelPart } from "@/lib/body-model-format";
import { MUSCLES, type MuscleKey } from "@/lib/exercise-anatomy/muscles";

export const ROLE = { other: 0, main: 1, helper: 2 } as const;
/** Material slots, in the order components/exercise-library/exercise-body-3d-stage.ts builds them. */
export const MATERIAL = { main: 0, helper: 1, muscle: 2, bone: 3 } as const;
/** Keep main/helper in step with .exercise-body-3d__swatch--* in app/globals.css. */
export const ANATOMY_COLOURS = { main: "#0EA5E9", helper: "#7DD3FC", muscle: "#C48C7C", bone: "#E8DFC6" } as const;

/** Axis-aligned box in model units: [minX, minY, minZ, maxX, maxY, maxZ]. */
export type Box = [number, number, number, number, number, number];

export interface DrawGroup {
  start: number;
  count: number;
  materialIndex: number;
}

/** The patterns to light for one muscle: its own parts, or its stand-in's. */
export function patternsFor(key: MuscleKey): readonly RegExp[] {
  const m = MUSCLES[key];
  return m.source === "none" ? (m.standIn?.parts ?? []) : m.parts;
}

/** Role of each part (same order as `parts`). Main wins over helper. */
export function partRoles(parts: readonly ModelPart[], main: readonly MuscleKey[], helpers: readonly MuscleKey[]): Uint8Array {
  const mainPatterns = main.flatMap(patternsFor);
  const helperPatterns = helpers.flatMap(patternsFor);
  const roles = new Uint8Array(parts.length);
  parts.forEach((part, i) => {
    if (mainPatterns.some((r) => r.test(part.name))) roles[i] = ROLE.main;
    else if (helperPatterns.some((r) => r.test(part.name))) roles[i] = ROLE.helper;
  });
  return roles;
}

/** Geometry groups for one chunk; `parts` are that chunk's parts in index order. */
export function drawGroups(parts: readonly ModelPart[], roles: ArrayLike<number>, systems: readonly string[]): DrawGroup[] {
  const groups: DrawGroup[] = [];
  parts.forEach((part, i) => {
    const materialIndex =
      roles[i] === ROLE.main
        ? MATERIAL.main
        : roles[i] === ROLE.helper
          ? MATERIAL.helper
          : systems[part.system] === "skeletal"
            ? MATERIAL.bone
            : MATERIAL.muscle;
    const last = groups[groups.length - 1];
    if (last && last.materialIndex === materialIndex && last.start + last.count === part.firstIndex) last.count += part.indexCount;
    else groups.push({ start: part.firstIndex, count: part.indexCount, materialIndex });
  });
  return groups;
}

/** The boxes of the chosen parts, packed in the order given (for pickChunk on a subset). */
export function subsetBoxes(boxes: Float32Array, picks: readonly number[]): Float32Array {
  const out = new Float32Array(picks.length * 6);
  picks.forEach((p, i) => out.set(boxes.subarray(p * 6, p * 6 + 6), i * 6));
  return out;
}

/** One box around every [boxes, partIndex] pair (boxes from computePartBoxes), or null. */
export function unionBox(entries: readonly (readonly [Float32Array, number])[]): Box | null {
  if (!entries.length) return null;
  const box: Box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (const [boxes, p] of entries) {
    for (let k = 0; k < 3; k++) {
      box[k] = Math.min(box[k], boxes[p * 6 + k]);
      box[k + 3] = Math.max(box[k + 3], boxes[p * 6 + k + 3]);
    }
  }
  return box;
}

/** Camera distance that fits `size` (metres) plus `margin` (0.25 = 25% each side). */
export function fitDistance(size: { height: number; width: number }, fovDegrees: number, aspect: number, margin: number): number {
  const tanHalf = Math.tan((fovDegrees * Math.PI) / 360);
  const height = size.height * (1 + 2 * margin);
  const width = size.width * (1 + 2 * margin);
  return Math.max(height / 2 / tanHalf, width / 2 / (tanHalf * aspect));
}

export function displayPartName(name: string): string {
  const n = name.replace(/\b(left|right)\b ?/gi, "").replace(/\s+/g, " ").trim();
  return n.charAt(0).toUpperCase() + n.slice(1);
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** What a tapped part is called, in this exercise's terms. */
export function partLabel(partName: string, main: readonly MuscleKey[], helpers: readonly MuscleKey[]): string {
  const roles: [readonly MuscleKey[], string][] = [
    [main, "main focus"],
    [helpers, "helper"],
  ];
  for (const [keys, role] of roles) {
    for (const key of keys) {
      const m = MUSCLES[key];
      if (m.source !== "none" && m.parts.some((r) => r.test(partName))) return `${m.label}: ${m.plain} (${role})`;
      if (m.standIn?.parts.some((r) => r.test(partName))) return `${displayPartName(partName)}, near the ${lowerFirst(m.label)} (${role})`;
    }
  }
  return displayPartName(partName);
}

export function needsAddon(keys: readonly MuscleKey[]): boolean {
  return keys.some((k) => MUSCLES[k].source === "addon");
}

export function standInNotes(keys: readonly MuscleKey[]): string[] {
  return [
    ...new Set(
      keys.flatMap((k) => {
        const m = MUSCLES[k];
        return m.source === "none" && m.standIn ? [m.standIn.note] : [];
      })
    ),
  ];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/lib/exercise-anatomy/scene.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git branch --show-current
git add lib/exercise-anatomy/scene.ts tests/lib/exercise-anatomy/scene.test.ts
git commit -m "feat(exercise-anatomy): pure helpers for lighting, framing and naming parts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Visibility rules, healing copy and entry checks

**Files:**
- Create: `lib/exercise-anatomy/drafts.ts`
- Create: `lib/exercise-anatomy/healing.ts`
- Create: `lib/exercise-anatomy/index.ts`
- Test: `tests/lib/exercise-anatomy/index.test.ts` (rules, using fixtures)
- Test: `tests/lib/exercise-anatomy/entries.test.ts` (checks every real entry; content tasks extend it)

**Interfaces:**
- Consumes: `MUSCLES` (Task 1), `ExerciseAnatomy`, `BodyView`, `TissueTrack`, `AnatomyStatus` (Task 1).
- Produces:
  - `draftsVisible(): boolean`.
  - `HEALING_COPY_STATUS`, `HEALING_STAGES` (`readonly { stage; label; caption }[]`), `TISSUE_LINES: Record<TissueTrack, string>`, `HEALING_CLOSING`, `healingCopyVisible(): boolean`.
  - `ANATOMY_BATCHES`, `EXERCISE_ANATOMY`.
  - `isVisible(entry): boolean`, `visibleAnatomy(slug): ExerciseAnatomy | null`.
  - `canShow3D(entry): boolean`, `startView(entry): BodyView`, `entryProblems(entry): string[]`.

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/exercise-anatomy/index.test.ts`:

```ts
// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { canShow3D, entryProblems, isVisible, startView } from "@/lib/exercise-anatomy";
import { HEALING_STAGES, healingCopyVisible } from "@/lib/exercise-anatomy/healing";
import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

const entry = (over: Partial<ExerciseAnatomy> = {}): ExerciseAnatomy => ({
  main: ["gluteus-medius"],
  helpers: ["deep-hip-rotators"],
  howItHelps: "It strengthens the side of your hip. That keeps your knee in line when you walk.",
  tissue: "muscle-tendon",
  status: "draft",
  ...over,
});

afterEach(() => vi.unstubAllEnvs());

describe("isVisible", () => {
  it("hides drafts unless the drafts flag is on", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "");
    expect(isVisible(entry())).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "1");
    expect(isVisible(entry())).toBe(true);
  });

  it("always shows approved entries", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "");
    expect(isVisible(entry({ status: "approved" }))).toBe(true);
  });
});

describe("healing copy", () => {
  it("follows the drafts flag while it is still a draft", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "");
    expect(healingCopyVisible()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "1");
    expect(healingCopyVisible()).toBe(true);
  });

  it("names the catalogue's four stages in order", () => {
    expect(HEALING_STAGES.map((s) => s.stage)).toEqual(["Early rehab", "Mobility phase", "Strength phase", "Return to function"]);
  });
});

describe("canShow3D", () => {
  it("allows muscles in the model, in the add-on or with a stand-in", () => {
    expect(canShow3D(entry())).toBe(true);
    expect(canShow3D(entry({ main: ["pelvic-floor"] }))).toBe(true);
    expect(canShow3D(entry({ main: ["multifidus"] }))).toBe(true);
  });

  it("refuses face muscles and clinical overrides", () => {
    expect(canShow3D(entry({ main: ["zygomaticus"], helpers: [] }))).toBe(false);
    expect(canShow3D(entry({ hide3D: true }))).toBe(false);
  });
});

describe("startView", () => {
  it("uses the first main muscle's side unless the entry overrides it", () => {
    expect(startView(entry())).toBe("right");
    expect(startView(entry({ view: "back" }))).toBe("back");
  });
});

describe("entryProblems", () => {
  it("passes a well-formed entry", () => {
    expect(entryProblems(entry())).toEqual([]);
  });

  it("flags counts, duplicates, length, sentences and promises", () => {
    expect(entryProblems(entry({ main: [] }))).toContain("main needs 1-3 muscles");
    expect(entryProblems(entry({ helpers: ["adductors", "hamstrings", "quadriceps", "soleus", "triceps"] }))).toContain(
      "helpers allows at most 4"
    );
    expect(entryProblems(entry({ helpers: ["gluteus-medius"] }))).toContain("a muscle is listed twice");
    expect(entryProblems(entry({ howItHelps: "One sentence only." }))).toContain("howItHelps has 1 sentences (2-3)");
    expect(entryProblems(entry({ howItHelps: `${"word ".repeat(61).trim()}. Two.` })).some((p) => p.startsWith("howItHelps has 62 words"))).toBe(
      true
    );
    expect(entryProblems(entry({ howItHelps: "This will heal your hip. Do it daily." }))).toContain("howItHelps makes a promise");
  });
});
```

Create `tests/lib/exercise-anatomy/entries.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ANATOMY_BATCHES, EXERCISE_ANATOMY, canShow3D, entryProblems } from "@/lib/exercise-anatomy";
import { exercises } from "@/lib/exercises";

const slugs = new Set(exercises.map((e) => e.slug));

describe("exercise anatomy entries", () => {
  it("keys every entry by a real exercise slug", () => {
    for (const slug of Object.keys(EXERCISE_ANATOMY)) expect(slugs.has(slug), slug).toBe(true);
  });

  it("never lists one exercise in two batches", () => {
    const total = ANATOMY_BATCHES.reduce((n, batch) => n + Object.keys(batch).length, 0);
    expect(Object.keys(EXERCISE_ANATOMY)).toHaveLength(total);
  });

  it("follows the writing rules", () => {
    for (const [slug, entry] of Object.entries(EXERCISE_ANATOMY)) expect(entryProblems(entry), slug).toEqual([]);
  });

  it("keeps face exercises out of 3D", () => {
    for (const e of exercises.filter((x) => x.bodyPart === "Face")) {
      const entry = EXERCISE_ANATOMY[e.slug];
      if (entry) expect(canShow3D(entry), e.slug).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/exercise-anatomy/index.test.ts tests/lib/exercise-anatomy/entries.test.ts`
Expected: FAIL. They can't resolve `@/lib/exercise-anatomy`.

- [ ] **Step 3: Write the drafts flag**

Create `lib/exercise-anatomy/drafts.ts`:

```ts
// lib/exercise-anatomy/drafts.ts
// Draft anatomy content shows only where NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS=1
// (.env.development, so the dev site). Next inlines the value at build time;
// prod builds never set it, so prod shows approved content only.

export function draftsVisible(): boolean {
  return process.env.NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS === "1";
}
```

- [ ] **Step 4: Write the healing copy**

Create `lib/exercise-anatomy/healing.ts`:

```ts
// lib/exercise-anatomy/healing.ts
// Shared copy for "Where it fits in recovery" in the exercise anatomy section.
// One status covers all of it: Shivaliba reviews it once, with batch 1. Until
// then only the dev site (drafts flag) shows it.

import { draftsVisible } from "@/lib/exercise-anatomy/drafts";
import type { AnatomyStatus, TissueTrack } from "@/lib/exercise-anatomy/types";

export const HEALING_COPY_STATUS: AnatomyStatus = "draft";

/** The catalogue's four recovery stages, in order. "Facial rehab" has no strip. */
export const HEALING_STAGES = [
  { stage: "Early rehab", label: "Early rehab", caption: "Calm pain and keep moving gently." },
  { stage: "Mobility phase", label: "Mobility", caption: "Win back comfortable movement." },
  { stage: "Strength phase", label: "Strength", caption: "Build strength so the area copes with more." },
  { stage: "Return to function", label: "Return to function", caption: "Get back to work, sport and daily life." },
] as const;

export const TISSUE_LINES: Record<TissueTrack, string> = {
  "muscle-tendon":
    "Muscles and tendons: muscle strains often settle within a few weeks, but tendons rebuild strength slowly, often over three months or more, so steady, gradual loading matters.",
  "joint-ligament":
    "Joints and ligaments: swelling and soreness usually ease over the first few weeks, while ligaments keep remodelling for months. Strength and balance work protects the joint as they do.",
  "post-surgery":
    "After surgery: follow your surgeon's and physio's limits first. Tissues usually knit over about six weeks, then strength and confidence are rebuilt step by step.",
  "nerve-brain":
    "Nerves and the brain: recovery after a nerve or brain injury is often slow and can carry on for months. Regular, repeated practice helps your brain and nerves relearn movement.",
  "pelvic-floor":
    "Pelvic floor: like any muscle, it gets stronger with regular practice. Most people notice a difference after about three months of daily exercises.",
};

export const HEALING_CLOSING = "Everyone heals at their own pace. Your physio will tell you when to move on.";

export function healingCopyVisible(): boolean {
  return HEALING_COPY_STATUS === "approved" || draftsVisible();
}
```

- [ ] **Step 5: Write the index**

Create `lib/exercise-anatomy/index.ts`:

```ts
// lib/exercise-anatomy/index.ts
// What each exercise works and how it helps, keyed by exercise slug, plus the
// rules for when it shows. The exercise page reads this at build time and
// hands plain muscle keys to client components, so the entries never reach a
// client bundle. Entries are drafted per body area in entries/*.ts.

import { draftsVisible } from "@/lib/exercise-anatomy/drafts";
import { MUSCLES } from "@/lib/exercise-anatomy/muscles";
import type { BodyView, ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

/** One record per drafting batch (entries/*.ts). */
export const ANATOMY_BATCHES: readonly Readonly<Record<string, ExerciseAnatomy>>[] = [];

export const EXERCISE_ANATOMY: Readonly<Record<string, ExerciseAnatomy>> = Object.assign({}, ...ANATOMY_BATCHES);

/** Approved entries show everywhere; drafts only where the drafts flag is on (dev). */
export function isVisible(entry: ExerciseAnatomy): boolean {
  return entry.status === "approved" || draftsVisible();
}

export function visibleAnatomy(slug: string): ExerciseAnatomy | null {
  const entry = EXERCISE_ANATOMY[slug];
  return entry && isVisible(entry) ? entry : null;
}

/** Every main muscle must be drawable: in a model, or lit by a stand-in. */
export function canShow3D(entry: ExerciseAnatomy): boolean {
  if (entry.hide3D) return false;
  return entry.main.every((key) => MUSCLES[key].source !== "none" || MUSCLES[key].standIn !== undefined);
}

export function startView(entry: ExerciseAnatomy): BodyView {
  return entry.view ?? MUSCLES[entry.main[0]].view;
}

const PROMISE = /\b(cure[sd]?|guarantee[sd]?|will heal|will fix)\b/i;

/** Writing-rule breaches for one entry; empty when it is fine. */
export function entryProblems(entry: ExerciseAnatomy): string[] {
  const problems: string[] = [];
  if (entry.main.length < 1 || entry.main.length > 3) problems.push("main needs 1-3 muscles");
  if (entry.helpers.length > 4) problems.push("helpers allows at most 4");
  const all = [...entry.main, ...entry.helpers];
  for (const key of all) if (!(key in MUSCLES)) problems.push(`unknown muscle "${key}"`);
  if (new Set(all).size !== all.length) problems.push("a muscle is listed twice");
  const words = entry.howItHelps.trim().split(/\s+/).length;
  if (words > 60) problems.push(`howItHelps has ${words} words (max 60)`);
  const sentences = entry.howItHelps.split(/[.!?](?:\s|$)/).filter((s) => s.trim()).length;
  if (sentences < 2 || sentences > 3) problems.push(`howItHelps has ${sentences} sentences (2-3)`);
  if (PROMISE.test(entry.howItHelps)) problems.push("howItHelps makes a promise");
  return problems;
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/lib/exercise-anatomy/`
Expected: all PASS. `entries.test.ts` passes trivially while there are no entries.

- [ ] **Step 7: Commit**

```bash
git branch --show-current
git add lib/exercise-anatomy/drafts.ts lib/exercise-anatomy/healing.ts lib/exercise-anatomy/index.ts tests/lib/exercise-anatomy/index.test.ts tests/lib/exercise-anatomy/entries.test.ts
git commit -m "feat(exercise-anatomy): visibility rules, healing copy and entry checks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: "What it works and how it helps" section

**Files:**
- Create: `components/exercise-library/exercise-anatomy-section.tsx`
- Test: `tests/components/exercise-anatomy-section.test.tsx`

**Interfaces:**
- Consumes: `MUSCLES`, `MuscleKey` (Task 1); `HEALING_STAGES`, `TISSUE_LINES`, `HEALING_CLOSING`, `healingCopyVisible` (Task 5); `ExerciseAnatomy`; `Reveal` from `@/components/reveal`.
- Produces: `ExerciseAnatomySection({ anatomy: ExerciseAnatomy; stage: string })`. It is a server component (no `"use client"`) whose root is `<section data-anatomy>`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/exercise-anatomy-section.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExerciseAnatomySection } from "@/components/exercise-library/exercise-anatomy-section";
import { HEALING_CLOSING, TISSUE_LINES } from "@/lib/exercise-anatomy/healing";
import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

const entry: ExerciseAnatomy = {
  main: ["gluteus-medius"],
  helpers: ["deep-hip-rotators"],
  howItHelps: "It strengthens the side of your hip. That keeps your knee in line when you walk.",
  tissue: "muscle-tendon",
  status: "draft",
};

afterEach(() => vi.unstubAllEnvs());

describe("ExerciseAnatomySection", () => {
  it("lists the main focus and helpers in plain words, then how it helps", () => {
    render(<ExerciseAnatomySection anatomy={entry} stage="Strength phase" />);
    expect(screen.getByRole("heading", { level: 2, name: "What it works and how it helps" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Main focus" })).toBeInTheDocument();
    expect(screen.getByText("Gluteus medius")).toBeInTheDocument();
    expect(screen.getByText(/\(side of your hip\)/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Also working" })).toBeInTheDocument();
    expect(screen.getByText(entry.howItHelps)).toBeInTheDocument();
  });

  it("leaves out 'Also working' when there are no helpers", () => {
    render(<ExerciseAnatomySection anatomy={{ ...entry, helpers: [] }} stage="Strength phase" />);
    expect(screen.queryByRole("heading", { name: "Also working" })).not.toBeInTheDocument();
  });

  it("hides the healing copy while it is a draft and the drafts flag is off", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "");
    const { container } = render(<ExerciseAnatomySection anatomy={entry} stage="Strength phase" />);
    expect(container.querySelector("[data-healing]")).toBeNull();
  });

  it("marks this exercise's stage and shows its tissue line when the copy is visible", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "1");
    const { container } = render(<ExerciseAnatomySection anatomy={entry} stage="Strength phase" />);
    const current = container.querySelector('[aria-current="step"]')!;
    expect(current).toHaveTextContent("Strength");
    expect(current).toHaveTextContent("This exercise");
    expect(container.querySelectorAll(".exlib-anatomy__stages li")).toHaveLength(4);
    expect(screen.getByText(TISSUE_LINES["muscle-tendon"])).toBeInTheDocument();
    expect(screen.getByText(HEALING_CLOSING)).toBeInTheDocument();
  });

  it("drops the stages strip for facial rehab but keeps the tissue line", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "1");
    const face: ExerciseAnatomy = { ...entry, main: ["zygomaticus"], helpers: [], tissue: "nerve-brain" };
    const { container } = render(<ExerciseAnatomySection anatomy={face} stage="Facial rehab" />);
    expect(container.querySelector(".exlib-anatomy__stages")).toBeNull();
    expect(screen.getByText(TISSUE_LINES["nerve-brain"])).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/exercise-anatomy-section.test.tsx`
Expected: FAIL. It can't resolve the component.

- [ ] **Step 3: Write the component**

Create `components/exercise-library/exercise-anatomy-section.tsx`:

```tsx
// components/exercise-library/exercise-anatomy-section.tsx
// "What it works and how it helps": the exercise's main muscles and helpers in
// plain words, how it helps recovery, and where it sits in the four recovery
// stages. Server-rendered text, so it reads without the 3D view or JavaScript.

import { Reveal } from "@/components/reveal";
import { HEALING_CLOSING, HEALING_STAGES, TISSUE_LINES, healingCopyVisible } from "@/lib/exercise-anatomy/healing";
import { MUSCLES, type MuscleKey } from "@/lib/exercise-anatomy/muscles";
import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

function MuscleList({ keys }: { keys: readonly MuscleKey[] }) {
  return (
    <ul className="exlib-anatomy__muscles">
      {keys.map((key) => (
        <li key={key}>
          <strong>{MUSCLES[key].label}</strong> ({MUSCLES[key].plain})
        </li>
      ))}
    </ul>
  );
}

export function ExerciseAnatomySection({ anatomy, stage }: { anatomy: ExerciseAnatomy; stage: string }) {
  const current = HEALING_STAGES.findIndex((s) => s.stage === stage);
  return (
    <section className="page-section" data-anatomy aria-labelledby="exlib-anatomy-heading">
      <Reveal direction="up">
        <article className="simple-service-card exlib-anatomy">
          <h2 id="exlib-anatomy-heading">What it works and how it helps</h2>
          <div className="exlib-anatomy__group">
            <h3>Main focus</h3>
            <MuscleList keys={anatomy.main} />
          </div>
          {anatomy.helpers.length ? (
            <div className="exlib-anatomy__group">
              <h3>Also working</h3>
              <MuscleList keys={anatomy.helpers} />
            </div>
          ) : null}
          <div className="exlib-anatomy__group">
            <h3>How this helps your recovery</h3>
            <p>{anatomy.howItHelps}</p>
          </div>
          {healingCopyVisible() ? (
            <div className="exlib-anatomy__group" data-healing>
              <h3>Where it fits in recovery</h3>
              {current >= 0 ? (
                <ol className="exlib-anatomy__stages">
                  {HEALING_STAGES.map((s, i) => (
                    <li key={s.stage} aria-current={i === current ? "step" : undefined} className={i === current ? "is-current" : undefined}>
                      <strong>{s.label}</strong>
                      {i === current ? <span className="exlib-anatomy__here">This exercise</span> : null}
                      <span>{s.caption}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
              {anatomy.tissue ? <p data-tissue>{TISSUE_LINES[anatomy.tissue]}</p> : null}
              <p className="muted">{HEALING_CLOSING}</p>
            </div>
          ) : null}
        </article>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/components/exercise-anatomy-section.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git branch --show-current
git add components/exercise-library/exercise-anatomy-section.tsx tests/components/exercise-anatomy-section.test.tsx
git commit -m "feat(exercise-anatomy): server section for what an exercise works and how it helps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 3D viewer (stage + UI)

**Files:**
- Create: `components/exercise-library/exercise-body-3d-stage.ts`
- Create: `components/exercise-library/exercise-body-3d.tsx`
- Test: `tests/components/exercise-body-3d.test.tsx`

**Interfaces:**
- Consumes:
  - `loadBodyModel`, `onBodyModelProgress`, `BodyModel` (`lib/body-model-loader.ts`).
  - `loadAnatomyAddon` (Task 3).
  - `computePartBoxes`, `pickChunk`, `Vec3` (`lib/body-model-pick.ts`); `POSITION_SCALE`, `ModelPart`.
  - Task 4 helpers: `ROLE`, `ANATOMY_COLOURS`, `partRoles`, `drawGroups`, `subsetBoxes`, `unionBox`, `fitDistance`, `partLabel`, `displayPartName`, `needsAddon`, `standInNotes`.
  - `MUSCLES`, `MuscleKey`, `BodyView`.
- Produces:
  - `createAnatomyStage(THREE, OrbitControls, host, sources: readonly BodyModel[], options: { main; helpers; view }, handlers: { onTap(label: string | null); onContextLost(); onRotate() }): AnatomyStage`, where `AnatomyStage = { setView(view); setWholeBody(whole); dispose() }`.
  - `ExerciseBody3D(props: ExerciseBody3DProps)`, where `ExerciseBody3DProps = { title: string; main: MuscleKey[]; helpers: MuscleKey[]; view: BodyView; corner?: ReactNode; onError(): void }`.

This task can't be fully proven in jsdom (no WebGL). The component test mocks the stage module; Task 16 checks the real scene in a browser.

- [ ] **Step 1: Write the failing component test**

Create `tests/components/exercise-body-3d.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

// vi.mock factories are hoisted above everything, so shared mocks come from vi.hoisted.
const { stage, created, loadBodyModel, loadAnatomyAddon } = vi.hoisted(() => ({
  stage: { setView: vi.fn(), setWholeBody: vi.fn(), dispose: vi.fn() },
  created: { handlers: null as null | { onTap(label: string | null): void }, sources: 0 },
  loadBodyModel: vi.fn(),
  loadAnatomyAddon: vi.fn(),
}));

vi.mock("three", () => ({}));
vi.mock("three/examples/jsm/controls/OrbitControls.js", () => ({ OrbitControls: class {} }));
vi.mock("@/components/exercise-library/exercise-body-3d-stage", () => ({
  createAnatomyStage: vi.fn((_t: unknown, _o: unknown, _h: unknown, sources: unknown[], _opts: unknown, handlers: { onTap(label: string | null): void }) => {
    created.handlers = handlers;
    created.sources = sources.length;
    return stage;
  }),
}));
vi.mock("@/lib/body-model-loader", () => ({
  loadBodyModel: () => loadBodyModel(),
  onBodyModelProgress: () => () => {},
}));
vi.mock("@/lib/exercise-anatomy/addon-loader", () => ({ loadAnatomyAddon: () => loadAnatomyAddon() }));

import { ExerciseBody3D } from "@/components/exercise-library/exercise-body-3d";

beforeEach(() => {
  created.handlers = null;
  created.sources = 0;
  loadBodyModel.mockResolvedValue({ manifest: {}, chunks: [] });
  loadAnatomyAddon.mockResolvedValue({ manifest: {}, chunks: [] });
});
afterEach(() => vi.clearAllMocks());

describe("ExerciseBody3D", () => {
  it("loads, then shows the controls, legend and stand-in note", async () => {
    render(<ExerciseBody3D title="Bird Dog" main={["multifidus"]} helpers={["gluteus-maximus"]} view="back" onError={vi.fn()} />);
    expect(screen.getByText("Loading the 3D body…")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Back view" })).toBeEnabled());
    expect(screen.getByText("Main focus")).toBeInTheDocument();
    expect(screen.getByText("Helpers")).toBeInTheDocument();
    expect(screen.getByText(/Multifidus isn't in the 3D model/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Multifidus as the main focus/ })).toBeInTheDocument();
    expect(created.sources).toBe(1);
    expect(loadAnatomyAddon).not.toHaveBeenCalled();
  });

  it("loads the add-on when a muscle lives there", async () => {
    render(<ExerciseBody3D title="Kegel" main={["pelvic-floor"]} helpers={[]} view="front" onError={vi.fn()} />);
    await waitFor(() => expect(created.sources).toBe(2));
    expect(screen.queryByText("Helpers")).not.toBeInTheDocument();
  });

  it("turns the body, zooms out and names a tapped part", async () => {
    render(<ExerciseBody3D title="Clam" main={["gluteus-medius"]} helpers={[]} view="right" onError={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Back view" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Back view" }));
    expect(stage.setView).toHaveBeenCalledWith("back");
    fireEvent.click(screen.getByRole("button", { name: "Whole body" }));
    expect(stage.setWholeBody).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Close-up" })).toBeInTheDocument();
    act(() => created.handlers!.onTap("Gluteus medius: side of your hip (main focus)"));
    expect(screen.getByText("Gluteus medius: side of your hip (main focus)")).toBeInTheDocument();
  });

  it("reports a failed download", async () => {
    loadBodyModel.mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onError = vi.fn();
    render(<ExerciseBody3D title="Clam" main={["gluteus-medius"]} helpers={[]} view="right" onError={onError} />);
    await waitFor(() => expect(onError).toHaveBeenCalled());
  });

  it("disposes the scene when it unmounts", async () => {
    const { unmount } = render(<ExerciseBody3D title="Clam" main={["gluteus-medius"]} helpers={[]} view="right" onError={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Back view" })).toBeEnabled());
    unmount();
    expect(stage.dispose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/exercise-body-3d.test.tsx`
Expected: FAIL. It can't resolve `@/components/exercise-library/exercise-body-3d`.

- [ ] **Step 3: Write the three.js stage**

Create `components/exercise-library/exercise-body-3d-stage.ts`:

```ts
// components/exercise-library/exercise-body-3d-stage.ts
// The three.js scene behind the exercise 3D view: the booking-chart body (plus
// the deep-structures add-on when the exercise needs it) with this exercise's
// muscles lit in the accent colours and everything else see-through, so deep
// muscles show. three.js arrives as an argument (as in
// components/body-chart-3d.tsx), so it only downloads after "View in 3D".

import type { Material, Mesh } from "three";
import type { OrbitControls as OrbitControlsType } from "three/examples/jsm/controls/OrbitControls.js";
import { POSITION_SCALE, type ModelPart } from "@/lib/body-model-format";
import type { BodyModel } from "@/lib/body-model-loader";
import { computePartBoxes, pickChunk, type Vec3 } from "@/lib/body-model-pick";
import type { MuscleKey } from "@/lib/exercise-anatomy/muscles";
import {
  ANATOMY_COLOURS,
  ROLE,
  displayPartName,
  drawGroups,
  fitDistance,
  partLabel,
  partRoles,
  subsetBoxes,
  unionBox,
} from "@/lib/exercise-anatomy/scene";
import type { BodyView } from "@/lib/exercise-anatomy/types";

type Three = typeof import("three");

const FOV = 30;
const TAP_SLOP_PX = 8;
const MARGIN = 0.25; // close-up: 25% of the lit box on every side
const MIN_FRAME = 0.35; // metres: never frame less than this, so the joint stays in view
const WHOLE = { y: 0.87, height: 1.85, width: 0.9 }; // the booking chart's full-body framing
// Azimuths: the body faces +Z and its left side is +X (as in components/body-chart-3d.tsx).
const AZIMUTH: Record<BodyView, number> = { front: 0, back: Math.PI, left: Math.PI / 2, right: -Math.PI / 2 };

export interface AnatomyStageOptions {
  main: readonly MuscleKey[];
  helpers: readonly MuscleKey[];
  view: BodyView;
}

export interface AnatomyStageHandlers {
  onTap(label: string | null): void;
  onContextLost(): void;
  onRotate(): void;
}

export interface AnatomyStage {
  setView(view: BodyView): void;
  setWholeBody(whole: boolean): void;
  dispose(): void;
}

interface PickSet {
  positions: Int16Array;
  indices: Uint16Array;
  parts: ModelPart[];
  boxes: Float32Array;
  litParts: ModelPart[];
  litBoxes: Float32Array;
}

export function createAnatomyStage(
  THREE: Three,
  OrbitControls: typeof OrbitControlsType,
  host: HTMLDivElement,
  sources: readonly BodyModel[],
  options: AnatomyStageOptions,
  handlers: AnatomyStageHandlers
): AnatomyStage {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  host.appendChild(canvas);

  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 20);
    scene.add(camera);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b2a6, 1.3));
    // Key light rides with the camera, so every view is lit the same way.
    const key = new THREE.DirectionalLight(0xfffaf4, 1.8);
    key.position.set(-1.5, 2.5, 1);
    camera.add(key);

    // Order matches MATERIAL in lib/exercise-anatomy/scene.ts. See-through
    // layers don't write depth, so the lit muscles show through them.
    const materials: Material[] = [
      new THREE.MeshStandardMaterial({ color: ANATOMY_COLOURS.main, roughness: 0.55, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: ANATOMY_COLOURS.helper, roughness: 0.6, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: ANATOMY_COLOURS.muscle, roughness: 0.7, transparent: true, opacity: 0.12, depthWrite: false }),
      new THREE.MeshStandardMaterial({ color: ANATOMY_COLOURS.bone, roughness: 0.7, transparent: true, opacity: 0.3, depthWrite: false }),
    ];

    const meshes: Mesh[] = [];
    const pickSets: PickSet[] = [];
    const mainBoxes: [Float32Array, number][] = [];
    for (const source of sources) {
      const { manifest } = source;
      source.chunks.forEach((chunk, i) => {
        const parts = manifest.parts.filter((p) => p.chunk === i);
        const roles = partRoles(parts, options.main, options.helpers);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(chunk.positions, 3, true));
        geometry.setAttribute("normal", new THREE.BufferAttribute(chunk.normals, 3, true));
        geometry.setIndex(new THREE.BufferAttribute(chunk.indices, 1));
        for (const g of drawGroups(parts, roles, manifest.systems)) geometry.addGroup(g.start, g.count, g.materialIndex);
        const mesh = new THREE.Mesh(geometry, materials);
        mesh.scale.setScalar(POSITION_SCALE);
        scene.add(mesh);
        meshes.push(mesh);

        const boxes = computePartBoxes(chunk.positions, parts);
        const lit: number[] = [];
        roles.forEach((role, p) => {
          if (role !== ROLE.other) lit.push(p);
          if (role === ROLE.main) mainBoxes.push([boxes, p]);
        });
        pickSets.push({
          positions: chunk.positions,
          indices: chunk.indices,
          parts,
          boxes,
          litParts: lit.map((p) => parts[p]),
          litBoxes: subsetBoxes(boxes, lit),
        });
      });
    }

    // Close-up frames the main muscles (both sides); whole body matches the booking chart.
    const litBox = unionBox(mainBoxes);
    const close = litBox
      ? {
          target: new THREE.Vector3(
            ((litBox[0] + litBox[3]) / 2) * POSITION_SCALE,
            ((litBox[1] + litBox[4]) / 2) * POSITION_SCALE,
            ((litBox[2] + litBox[5]) / 2) * POSITION_SCALE
          ),
          height: Math.max(MIN_FRAME, (litBox[4] - litBox[1]) * POSITION_SCALE),
          width: Math.max(MIN_FRAME, Math.max(litBox[3] - litBox[0], litBox[5] - litBox[2]) * POSITION_SCALE),
          margin: MARGIN,
        }
      : null;
    const whole = { target: new THREE.Vector3(0, WHOLE.y, 0), height: WHOLE.height, width: WHOLE.width, margin: 0 };
    let wholeBody = close === null;

    let frame = 0;
    const render = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        renderer.render(scene, camera);
      });
    };

    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI * 0.42;
    controls.maxPolarAngle = Math.PI * 0.58;
    controls.rotateSpeed = 0.7;
    controls.addEventListener("change", render);
    // A drag by the patient (not our own setView) means no preset view is active.
    let dragging = false;
    controls.addEventListener("start", () => {
      dragging = true;
    });
    controls.addEventListener("end", () => {
      dragging = false;
    });
    controls.addEventListener("change", () => {
      if (dragging) handlers.onRotate();
    });
    // Vertical swipes keep scrolling the page; sideways drags turn the body.
    canvas.style.touchAction = "pan-y";

    const azimuthNow = () => Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
    const place = (azimuth: number) => {
      const f = wholeBody || !close ? whole : close;
      controls.target.copy(f.target);
      const distance = fitDistance({ height: f.height, width: f.width }, FOV, camera.aspect, f.margin);
      camera.position.set(f.target.x + Math.sin(azimuth) * distance, f.target.y, f.target.z + Math.cos(azimuth) * distance);
      controls.update();
      render();
    };

    let placed = false;
    const fit = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      place(placed ? azimuthNow() : AZIMUTH[options.view]);
      placed = true;
    };
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    fit();

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pickIn = (origin: Vec3, dir: Vec3, litOnly: boolean): ModelPart | null => {
      let best: { part: ModelPart; distance: number } | null = null;
      for (const set of pickSets) {
        const parts = litOnly ? set.litParts : set.parts;
        const boxes = litOnly ? set.litBoxes : set.boxes;
        if (!parts.length) continue;
        const hit = pickChunk(origin, dir, set.positions, set.indices, parts, boxes, best?.distance);
        if (hit) best = { part: parts[hit.part], distance: hit.distance };
      }
      return best?.part ?? null;
    };
    const tapLabel = (clientX: number, clientY: number): string | null => {
      const rect = canvas.getBoundingClientRect();
      ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      // Every mesh shares one transform (uniform scale POSITION_SCALE), so one
      // local-space ray serves them all and distances compare directly.
      const o = raycaster.ray.origin;
      const d = raycaster.ray.direction;
      const origin: Vec3 = [o.x / POSITION_SCALE, o.y / POSITION_SCALE, o.z / POSITION_SCALE];
      const dir: Vec3 = [d.x, d.y, d.z];
      // Lit parts first, so a tap names the highlighted muscle even under see-through layers.
      const lit = pickIn(origin, dir, true);
      if (lit) return partLabel(lit.name, options.main, options.helpers);
      const any = pickIn(origin, dir, false);
      return any ? displayPartName(any.name) : null;
    };

    let down: { x: number; y: number; id: number } | null = null;
    const onPointerDown = (e: PointerEvent) => {
      down = e.button === 0 && e.isPrimary ? { x: e.clientX, y: e.clientY, id: e.pointerId } : null;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!down || down.id !== e.pointerId) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved <= TAP_SLOP_PX) handlers.onTap(tapLabel(e.clientX, e.clientY));
    };
    const onContextLost = (e: Event) => {
      e.preventDefault();
      handlers.onContextLost();
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("webglcontextlost", onContextLost);

    return {
      setView(view) {
        place(AZIMUTH[view]);
      },
      setWholeBody(next) {
        wholeBody = next || !close;
        place(azimuthNow());
      },
      dispose() {
        observer.disconnect();
        if (frame) cancelAnimationFrame(frame);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("webglcontextlost", onContextLost);
        controls.dispose();
        meshes.forEach((m) => m.geometry.dispose());
        materials.forEach((m) => m.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      },
    };
  } catch (error) {
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    throw error;
  }
}
```

- [ ] **Step 4: Write the viewer UI**

Create `components/exercise-library/exercise-body-3d.tsx`:

```tsx
"use client";

// components/exercise-library/exercise-body-3d.tsx
// The exercise page's 3D view: the live body model with this exercise's main
// muscles and helpers lit, Front/Back/Left/Right, a close-up/whole-body
// switch, tap-to-name, a legend and any "approximate" notes. Loaded with
// import() from exercise-hero-media.tsx only after "View in 3D", and it
// imports three.js and the scene the same lazy way.

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AnatomyStage } from "@/components/exercise-library/exercise-body-3d-stage";
import { loadBodyModel, onBodyModelProgress } from "@/lib/body-model-loader";
import { loadAnatomyAddon } from "@/lib/exercise-anatomy/addon-loader";
import { MUSCLES, type MuscleKey } from "@/lib/exercise-anatomy/muscles";
import { needsAddon, standInNotes } from "@/lib/exercise-anatomy/scene";
import type { BodyView } from "@/lib/exercise-anatomy/types";

const VIEWS: { id: BodyView; label: string; aria: string }[] = [
  { id: "front", label: "Front", aria: "Front view" },
  { id: "back", label: "Back", aria: "Back view" },
  { id: "left", label: "Left", aria: "Your left side" },
  { id: "right", label: "Right", aria: "Your right side" },
];

function joinList(items: readonly string[]): string {
  return items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export interface ExerciseBody3DProps {
  title: string;
  main: MuscleKey[];
  helpers: MuscleKey[];
  view: BodyView;
  /** Rendered inside the stage's corner (the "Back to picture" button). */
  corner?: ReactNode;
  onError(): void;
}

export function ExerciseBody3D({ title, main, helpers, view: startView, corner, onError }: ExerciseBody3DProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<AnatomyStage | null>(null);
  const onErrorRef = useRef(onError);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [view, setView] = useState<BodyView | null>(startView);
  const [whole, setWhole] = useState(false);
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => onBodyModelProgress((loaded, total) => setProgress(total ? loaded / total : 0)), []);

  useEffect(() => {
    let disposed = false;
    let stage: AnatomyStage | null = null;
    (async () => {
      try {
        const [THREE, { OrbitControls }, { createAnatomyStage }, base, addon] = await Promise.all([
          import("three"),
          import("three/examples/jsm/controls/OrbitControls.js"),
          import("@/components/exercise-library/exercise-body-3d-stage"),
          loadBodyModel(),
          needsAddon([...main, ...helpers]) ? loadAnatomyAddon() : Promise.resolve(null),
        ]);
        const host = stageRef.current;
        if (disposed || !host) return;
        stage = createAnatomyStage(THREE, OrbitControls, host, addon ? [base, addon] : [base], { main, helpers, view: startView }, {
          onTap: setTip,
          onContextLost: () => onErrorRef.current(),
          onRotate: () => setView(null),
        });
        apiRef.current = stage;
        setReady(true);
      } catch (error) {
        console.error("Exercise 3D view failed to load", error);
        if (!disposed) onErrorRef.current();
      }
    })();
    return () => {
      disposed = true;
      stage?.dispose();
      apiRef.current = null;
    };
    // The muscles and starting side are fixed for a page; the scene is built once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mainLabels = main.map((k) => MUSCLES[k].label);
  const helperLabels = helpers.map((k) => MUSCLES[k].label);
  const notes = standInNotes([...main, ...helpers]);
  const label =
    `3D body for ${title}, showing ${joinList(mainLabels)} as the main focus` +
    (helperLabels.length ? ` with ${joinList(helperLabels)} helping` : "") +
    ". Drag sideways to turn it all the way round.";

  return (
    <div className="exercise-body-3d">
      <div ref={stageRef} className="exercise-body-3d__stage" role="img" aria-label={label}>
        {!ready && (
          <div className="body-chart-3d__loading">
            <span>Loading the 3D body…</span>
            <progress max={1} value={progress} />
          </div>
        )}
        {ready ? (
          <div className="body-chart-3d__badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 4v5h-5" />
            </svg>
            <span>
              <strong>360°</strong>
              <span>Drag to turn</span>
            </span>
          </div>
        ) : null}
        {corner}
      </div>

      <div className="exercise-body-3d__controls">
        <div className="body-chart__views" role="group" aria-label="Body view">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className="body-chart__view-btn"
              aria-pressed={view === v.id}
              aria-label={v.aria}
              disabled={!ready}
              onClick={() => {
                apiRef.current?.setView(v.id);
                setView(v.id);
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="exercise-body-3d__zoom"
          disabled={!ready}
          onClick={() => {
            apiRef.current?.setWholeBody(!whole);
            setWhole(!whole);
          }}
        >
          {whole ? "Close-up" : "Whole body"}
        </button>
      </div>

      <p className="exercise-body-3d__tip" aria-live="polite">
        {tip ?? ""}
      </p>

      <ul className="exercise-body-3d__legend">
        <li>
          <span className="exercise-body-3d__swatch exercise-body-3d__swatch--main" aria-hidden="true" />
          Main focus
        </li>
        {helpers.length ? (
          <li>
            <span className="exercise-body-3d__swatch exercise-body-3d__swatch--helper" aria-hidden="true" />
            Helpers
          </li>
        ) : null}
      </ul>
      {notes.map((note) => (
        <p key={note} className="exercise-body-3d__note">
          {note}
        </p>
      ))}

      <p className="body-chart-3d__credit">
        Anatomy adapted from BodyParts3D © DBCLS,{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY 4.0
        </a>{" "}
        ·{" "}
        <a href="/models/body-chart/ATTRIBUTION.md" target="_blank" rel="noopener noreferrer">
          licence details
        </a>
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes, then lint and typecheck**

Run: `npx vitest run tests/components/exercise-body-3d.test.tsx`
Expected: PASS (5 tests).

Run: `npx eslint components/exercise-library/exercise-body-3d.tsx components/exercise-library/exercise-body-3d-stage.ts`
Expected: 0 errors.

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "exercise-body-3d|exercise-anatomy" || echo "no type errors in my files"`
Expected: `no type errors in my files`.

- [ ] **Step 6: Commit**

```bash
git branch --show-current
git add components/exercise-library/exercise-body-3d-stage.ts components/exercise-library/exercise-body-3d.tsx tests/components/exercise-body-3d.test.tsx
git commit -m "feat(exercise-anatomy): 3D viewer that lights an exercise's muscles over an x-ray body

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Picture ↔ 3D switch and analytics event

**Files:**
- Create: `components/exercise-library/exercise-hero-media.tsx`
- Modify: `lib/analytics.ts` (add `| "library_3d_view"` to `LibraryEvent`)
- Modify: `docs/analytics-tracking.md` (the `app/exercises/[slug]/page.tsx` row)
- Test: `tests/components/exercise-hero-media.test.tsx`

**Interfaces:**
- Consumes:
  - `ExerciseBody3D`, `ExerciseBody3DProps` (Task 7), dynamically imported.
  - `canUse3D`, `loadBodyModel` (`lib/body-model-loader.ts`).
  - `trackLibraryEvent` (`lib/analytics.ts`); `MuscleKey`; `BodyView`.
- Produces: `ExerciseHeroMedia({ slug, title, main, helpers, view, children })`. Every prop is serialisable (strings and string arrays), so the server page can render it.

- [ ] **Step 1: Write the failing test**

Create `tests/components/exercise-hero-media.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ExerciseBody3DProps } from "@/components/exercise-library/exercise-body-3d";

const { support, track } = vi.hoisted(() => ({ support: { ok: true }, track: vi.fn() }));
vi.mock("@/lib/body-model-loader", () => ({
  canUse3D: () => support.ok,
  loadBodyModel: vi.fn(() => new Promise(() => {})),
}));
vi.mock("@/lib/analytics", () => ({ trackLibraryEvent: (...args: unknown[]) => track(...args) }));
vi.mock("@/components/exercise-library/exercise-body-3d", () => ({
  ExerciseBody3D: ({ corner, onError, main }: ExerciseBody3DProps) => (
    <div data-testid="viewer">
      <span>{main.join(",")}</span>
      {corner}
      <button type="button" onClick={onError}>
        stub error
      </button>
    </div>
  ),
}));

import { ExerciseHeroMedia } from "@/components/exercise-library/exercise-hero-media";

function renderMedia() {
  return render(
    <ExerciseHeroMedia slug="clam-shell" title="Clam Shell" main={["gluteus-medius"]} helpers={[]} view="right">
      <img alt="Clam Shell exercise demonstration" src="/x.png" />
    </ExerciseHeroMedia>
  );
}

beforeEach(() => {
  support.ok = true;
});
afterEach(() => vi.clearAllMocks());

describe("ExerciseHeroMedia", () => {
  it("shows only the picture when the browser can't do 3D", () => {
    support.ok = false;
    renderMedia();
    expect(screen.getByAltText("Clam Shell exercise demonstration")).toBeVisible();
    expect(screen.queryByRole("button", { name: "View in 3D" })).not.toBeInTheDocument();
  });

  it("swaps the picture for the 3D view and logs it", async () => {
    renderMedia();
    fireEvent.click(screen.getByRole("button", { name: "View in 3D" }));
    expect(await screen.findByTestId("viewer")).toBeInTheDocument();
    expect(screen.getByAltText("Clam Shell exercise demonstration")).not.toBeVisible();
    expect(track).toHaveBeenCalledWith("library_3d_view", "clam-shell");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Back to picture" }));
  });

  it("goes back to the picture and returns focus to the switch", async () => {
    renderMedia();
    fireEvent.click(screen.getByRole("button", { name: "View in 3D" }));
    await screen.findByTestId("viewer");
    fireEvent.click(screen.getByRole("button", { name: "Back to picture" }));
    expect(screen.queryByTestId("viewer")).not.toBeInTheDocument();
    expect(screen.getByAltText("Clam Shell exercise demonstration")).toBeVisible();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "View in 3D" }));
  });

  it("falls back to the picture with a note when 3D fails", async () => {
    renderMedia();
    fireEvent.click(screen.getByRole("button", { name: "View in 3D" }));
    await screen.findByTestId("viewer");
    fireEvent.click(screen.getByRole("button", { name: "stub error" }));
    expect(screen.queryByTestId("viewer")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("The 3D view couldn't load");
    expect(screen.getByRole("button", { name: "View in 3D" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/exercise-hero-media.test.tsx`
Expected: FAIL. It can't resolve `@/components/exercise-library/exercise-hero-media`.

- [ ] **Step 3: Add the analytics event**

In `lib/analytics.ts`, replace:

```ts
  | "library_embed_copy";
```

with:

```ts
  | "library_embed_copy"
  | "library_3d_view";
```

In `docs/analytics-tracking.md`, in the `app/exercises/[slug]/page.tsx` row, replace:

```
`library_embed_copy` `{ slug }` from `components/exercise-library/embed-exercise-button.tsx`. |
```

with:

```
`library_embed_copy` `{ slug }` from `components/exercise-library/embed-exercise-button.tsx`. `library_3d_view` `{ slug }` from `components/exercise-library/exercise-hero-media.tsx` each time the 3D view opens. |
```

- [ ] **Step 4: Write the component**

Create `components/exercise-library/exercise-hero-media.tsx`:

```tsx
"use client";

// components/exercise-library/exercise-hero-media.tsx
// The exercise hero picture with a "View in 3D" switch. The illustration stays
// the default and stays mounted (hidden) while 3D is open, so it never
// reloads. The 3D viewer, three.js and the model download only after a tap
// (warmed on hover/focus). Browsers without WebGL, or with Save-Data on, never
// see the switch; server HTML never has it.

import { useCallback, useRef, useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import type { ExerciseBody3DProps } from "@/components/exercise-library/exercise-body-3d";
import { trackLibraryEvent } from "@/lib/analytics";
import { canUse3D, loadBodyModel } from "@/lib/body-model-loader";
import type { MuscleKey } from "@/lib/exercise-anatomy/muscles";
import type { BodyView } from "@/lib/exercise-anatomy/types";

const loadViewer = () => import("@/components/exercise-library/exercise-body-3d");
const noSubscribe = () => () => {};
const noSupportOnServer = () => false;

interface Props {
  slug: string;
  title: string;
  main: MuscleKey[];
  helpers: MuscleKey[];
  view: BodyView;
  children: ReactNode;
}

export function ExerciseHeroMedia({ slug, title, main, helpers, view, children }: Props) {
  const supported = useSyncExternalStore(noSubscribe, canUse3D, noSupportOnServer);
  const [open, setOpen] = useState(false);
  const [Viewer, setViewer] = useState<ComponentType<ExerciseBody3DProps> | null>(null);
  const [failed, setFailed] = useState(false);
  // After the first tap, every remount of the switch (picture <-> 3D, loading
  // -> viewer, error -> picture) takes focus, so keyboard users never land on <body>.
  const wantFocus = useRef(false);
  const toggleRef = useCallback((el: HTMLButtonElement | null) => {
    if (el && wantFocus.current) el.focus();
  }, []);

  const warm = () => {
    loadBodyModel().catch(() => {});
    loadViewer().catch(() => {});
  };
  const fail = () => {
    setOpen(false);
    setFailed(true);
  };
  const show = () => {
    wantFocus.current = true;
    setFailed(false);
    setOpen(true);
    trackLibraryEvent("library_3d_view", slug);
    loadViewer()
      .then((m) => setViewer(() => m.ExerciseBody3D))
      .catch(fail);
  };
  const hide = () => {
    wantFocus.current = true;
    setOpen(false);
  };

  const toggle = supported ? (
    <button
      ref={toggleRef}
      type="button"
      className="exlib-hero-media__toggle"
      onClick={open ? hide : show}
      onPointerEnter={open ? undefined : warm}
      onFocus={open ? undefined : warm}
    >
      {open ? "Back to picture" : "View in 3D"}
    </button>
  ) : null;

  return (
    <div className="exlib-hero-media">
      <div className="exlib-hero-media__frame">
        <div hidden={open}>{children}</div>
        {!open ? toggle : null}
        {open && Viewer ? <Viewer title={title} main={main} helpers={helpers} view={view} corner={toggle} onError={fail} /> : null}
        {open && !Viewer ? (
          <div className="exercise-body-3d__stage">
            <div className="body-chart-3d__loading">
              <span>Loading the 3D body…</span>
            </div>
            {toggle}
          </div>
        ) : null}
      </div>
      {failed ? (
        <p className="exlib-hero-media__note" role="status">
          The 3D view couldn&apos;t load, so here&apos;s the picture instead.
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/components/exercise-hero-media.test.tsx tests/lib/analytics.test.ts tests/app/analytics-tracking-registry.test.ts`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git branch --show-current
git add components/exercise-library/exercise-hero-media.tsx lib/analytics.ts docs/analytics-tracking.md tests/components/exercise-hero-media.test.tsx
git commit -m "feat(exercise-anatomy): View in 3D switch on the exercise picture

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Page insertions, styles and the drafts flag note

**Files:**
- Modify: `app/exercises/[slug]/page.tsx` (imports; hero media; section after the booking prompt)
- Modify: `app/globals.css` (append one block at the end of the file)
- Modify: `.env.example` (append a commented flag line)
- Test: `tests/app/exercise-page-anatomy.test.tsx`

**Interfaces:**
- Consumes: `visibleAnatomy`, `canShow3D`, `startView` (Task 5); `ExerciseHeroMedia` (Task 8); `ExerciseAnatomySection` (Task 6).
- Produces: the page behaviour the spec describes. With no visible entry, the markup is unchanged.

- [ ] **Step 1: Write the failing test**

Create `tests/app/exercise-page-anatomy.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

const state = vi.hoisted(() => ({ entry: null as null | ExerciseAnatomy }));
vi.mock("@/lib/exercise-anatomy", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/exercise-anatomy")>();
  return { ...actual, visibleAnatomy: () => state.entry };
});
vi.mock("@/lib/body-model-loader", () => ({
  canUse3D: () => true,
  loadBodyModel: vi.fn(() => new Promise(() => {})),
  onBodyModelProgress: () => () => {},
}));

import ExercisePage, { generateMetadata } from "@/app/exercises/[slug]/page";

const SLUG = "clam-shell";
const glute: ExerciseAnatomy = {
  main: ["gluteus-medius"],
  helpers: ["deep-hip-rotators"],
  howItHelps: "It strengthens the side of your hip. That keeps your knee in line when you walk.",
  tissue: "muscle-tendon",
  status: "draft",
};

async function renderPage() {
  return render(await ExercisePage({ params: Promise.resolve({ slug: SLUG }) }));
}
const jsonLd = (c: HTMLElement) => [...c.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.innerHTML);

afterEach(() => {
  state.entry = null;
});

describe("exercise page anatomy", () => {
  it("renders exactly today's hero and no section when nothing is visible", async () => {
    const { container } = await renderPage();
    const media = container.querySelector(".exlib-detail-hero__media")!;
    expect(media.children).toHaveLength(1);
    expect(media.firstElementChild!.classList.contains("exlib-detail-hero__image")).toBe(true);
    expect(container.querySelector(".exlib-hero-media")).toBeNull();
    expect(container.querySelector("[data-anatomy]")).toBeNull();
  });

  it("wraps the unchanged picture with the 3D switch and adds the section after the booking prompt", async () => {
    state.entry = glute;
    const { container } = await renderPage();
    const media = container.querySelector(".exlib-detail-hero__media .exlib-hero-media")!;
    expect(media.querySelector(".exlib-detail-hero__image")).not.toBeNull();
    expect(screen.getByRole("button", { name: "View in 3D" })).toBeInTheDocument();
    const section = container.querySelector("[data-anatomy]")!;
    const prompt = container.querySelector(".exlib-next-step")!;
    expect(prompt.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows the section but no 3D switch when the muscles can't be drawn", async () => {
    state.entry = { ...glute, main: ["zygomaticus"], helpers: [] };
    const { container } = await renderPage();
    expect(container.querySelector(".exlib-hero-media")).toBeNull();
    expect(container.querySelector("[data-anatomy]")).not.toBeNull();
  });

  it("leaves metadata and structured data untouched", async () => {
    const params = { params: Promise.resolve({ slug: SLUG }) };
    const before = JSON.stringify(await generateMetadata(params));
    const plain = jsonLd((await renderPage()).container);
    state.entry = glute;
    expect(JSON.stringify(await generateMetadata({ params: Promise.resolve({ slug: SLUG }) }))).toBe(before);
    expect(jsonLd((await renderPage()).container)).toEqual(plain);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/app/exercise-page-anatomy.test.tsx`
Expected: FAIL in the second and third tests (no `.exlib-hero-media` or `[data-anatomy]`). The first and fourth may already pass.

- [ ] **Step 3: Insert into the page**

In `app/exercises/[slug]/page.tsx`, add these three imports directly after the line `import { EmbedExerciseButton } from "@/components/exercise-library/embed-exercise-button";`:

```tsx
import { ExerciseAnatomySection } from "@/components/exercise-library/exercise-anatomy-section";
import { ExerciseHeroMedia } from "@/components/exercise-library/exercise-hero-media";
import { canShow3D, startView, visibleAnatomy } from "@/lib/exercise-anatomy";
```

Replace:

```tsx
  const { ordinary: ordinaryMistakes, safety: safetyLine } = splitMistakes(
    exercise.mistakes ?? [],
  );
```

with:

```tsx
  const { ordinary: ordinaryMistakes, safety: safetyLine } = splitMistakes(
    exercise.mistakes ?? [],
  );
  // Approved anatomy (or any draft on dev). Without it the page renders as before.
  const anatomy = visibleAnatomy(exercise.slug);
  const heroImage = (
    <ExerciseImage
      exerciseId={exercise.id}
      name={exercise.title}
      pose={exercise.pose}
      size={640}
      className="exlib-detail-hero__image"
      variant="full"
      decorative={false}
    />
  );
```

Replace:

```tsx
        <div className="exlib-detail-hero__media">
          <ExerciseImage
            exerciseId={exercise.id}
            name={exercise.title}
            pose={exercise.pose}
            size={640}
            className="exlib-detail-hero__image"
            variant="full"
            decorative={false}
          />
        </div>
```

with:

```tsx
        <div className="exlib-detail-hero__media">
          {anatomy && canShow3D(anatomy) ? (
            <ExerciseHeroMedia
              slug={exercise.slug}
              title={exercise.title}
              main={anatomy.main}
              helpers={anatomy.helpers}
              view={startView(anatomy)}
            >
              {heroImage}
            </ExerciseHeroMedia>
          ) : (
            heroImage
          )}
        </div>
```

Replace:

```tsx
        </aside>
      </section>

      <section className="page-section stack">
        <ExerciseSafetyNote variant="compact" />
```

with:

```tsx
        </aside>
      </section>

      {anatomy ? <ExerciseAnatomySection anatomy={anatomy} stage={exercise.stage} /> : null}

      <section className="page-section stack">
        <ExerciseSafetyNote variant="compact" />
```

- [ ] **Step 4: Append the styles**

Append to the very end of `app/globals.css`:

```css

/* ──────────────────────────────────────────────────────────────
   Exercise 3D anatomy (exercise detail page)
   .exlib-hero-media  — picture <-> 3D switch in the hero
   .exercise-body-3d  — the 3D viewer, its controls and legend
   .exlib-anatomy     — "What it works and how it helps" section
   Reuses .body-chart-3d__loading/__badge/__credit and
   .body-chart__views/__view-btn from the booking chart unchanged.
   ────────────────────────────────────────────────────────────── */
.exlib-hero-media {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.exlib-hero-media__frame {
  position: relative;
}
.exlib-hero-media__toggle {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0.45rem 0.95rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-navy);
  color: #fff;
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 600;
  box-shadow: 0 6px 18px color-mix(in srgb, var(--color-navy) 28%, transparent);
  cursor: pointer;
}
.exlib-hero-media__toggle:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}
.exlib-hero-media__note {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.exercise-body-3d {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
/* Same square and frame as .exlib-detail-hero__image, so the swap doesn't move anything. */
.exercise-body-3d__stage {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 1px solid color-mix(in srgb, var(--color-primary) 18%, transparent);
  border-radius: 8px;
  background: radial-gradient(ellipse at 50% 40%, #fff 0%, var(--color-surface) 75%);
  overflow: hidden;
}
/* The canvas host fills the stage; loading text, badge and the corner button sit beside it. */
.exercise-body-3d__canvas {
  position: absolute;
  inset: 0;
}
.exercise-body-3d__stage canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: pan-y;
}
.exercise-body-3d__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}
.exercise-body-3d__controls .body-chart__view-btn {
  padding: 0.45rem 0.85rem;
}
.exercise-body-3d__controls .body-chart__view-btn:disabled,
.exercise-body-3d__zoom:disabled {
  cursor: default;
  opacity: 0.6;
}
.exercise-body-3d__zoom {
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 999px;
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 0.4rem 1rem;
  cursor: pointer;
}
.exercise-body-3d__tip {
  margin: 0;
  text-align: center;
  color: var(--color-navy);
  font-size: var(--text-sm);
  font-weight: 600;
}
.exercise-body-3d__legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.exercise-body-3d__legend li {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.exercise-body-3d__swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}
/* Keep in step with ANATOMY_COLOURS in lib/exercise-anatomy/scene.ts. */
.exercise-body-3d__swatch--main {
  background: #0ea5e9;
}
.exercise-body-3d__swatch--helper {
  background: #7dd3fc;
}
.exercise-body-3d__note {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  text-align: center;
}

.exlib-anatomy {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.exlib-anatomy h2,
.exlib-anatomy h3 {
  margin: 0;
}
.exlib-anatomy__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.exlib-anatomy__group > p {
  margin: 0;
}
.exlib-anatomy__muscles {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding-left: 1.2rem;
}
.exlib-anatomy__stages {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
@media (min-width: 720px) {
  .exlib-anatomy__stages {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
.exlib-anatomy__stages li {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.exlib-anatomy__stages li strong {
  color: var(--color-navy);
}
.exlib-anatomy__stages li.is-current {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}
.exlib-anatomy__here {
  align-self: flex-start;
  padding: 0.1rem 0.5rem;
  border-radius: var(--radius-chip);
  background: var(--color-primary-dark);
  color: #fff;
  font-size: var(--text-xs);
  font-weight: 700;
}
```

- [ ] **Step 5: Document the flag**

Append to `.env.example`:

```
# Exercise 3D anatomy: show DRAFT "What it works" content and 3D views (dev only).
# Put NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS=1 in .env.development; never in .env.production.
NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS=
```

- [ ] **Step 6: Run the page tests**

Run: `npx vitest run tests/app/exercise-page-anatomy.test.tsx tests/app/exercise-page.test.tsx`
Expected: all PASS. The existing page test is unchanged.

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "app/exercises|exercise-anatomy|exercise-library/exercise-(hero|body|anatomy)" || echo "no type errors in my files"`
Expected: `no type errors in my files`.

- [ ] **Step 7: Commit**

```bash
git branch --show-current
git add 'app/exercises/[slug]/page.tsx' app/globals.css .env.example tests/app/exercise-page-anatomy.test.tsx
git commit -m "feat(exercise-anatomy): add the 3D switch and anatomy section to exercise pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Content tasks (10–15): drafting entries

All six content tasks follow the same pattern. Each one writes one batch file, registers it in `lib/exercise-anatomy/index.ts`, and keeps `tests/lib/exercise-anatomy/` green.

**How to draft an entry**

1. **Read the exercise first.** Find it in `lib/exercises.ts` by `slug` and read its `description`, `setup`, `steps`, `cues`, `mistakes`, `helpsWith`, `stage` and `bodyPart`. The entry must agree with them.
2. **`main`:** 1–3 dictionary keys. These are the muscles or tissues the exercise mainly loads, moves or trains. Pick the specific muscle where the dictionary has one: `gluteus-medius`, not `gluteus-maximus`, for a clam. For a nerve glide, use the nerve key (`median-nerve`, `sciatic-nerve`). For a disc-focused exercise, use the disc key.
3. **`helpers`:** 0–4 keys that clearly work too. Never repeat a main key.
4. **`howItHelps`:** 2–3 sentences, at most 60 words. Say what the exercise does to the tissue, and what that helps with in daily life.
   - Write in UK English, in the second person ("your"), in plain words.
   - Don't use abbreviations with full stops (no "e.g.", "i.e.", "approx."), because they break the sentence count.
   - Never use "cure", "guarantee", "will heal" or "will fix", and give no timelines.
5. **`tissue`:** the track the exercise mainly serves: `muscle-tendon`, `joint-ligament`, `post-surgery`, `nerve-brain` or `pelvic-floor`. Leave it out for general fitness, falls-prevention balance and pain-education or pacing exercises.
6. **`view`:** set it only when the first main muscle's dictionary `view` isn't the best side for this exercise.
7. **`status: "draft"`** always. Never set `hide3D` in drafts; that is Shivaliba's call.

**When the dictionary lacks a muscle**

- Add a group to `lib/exercise-anatomy/muscles.ts` in the matching section, with the same shape.
- If the muscle is in the model, give it `source: "base"` (or `"addon"`) and patterns that match the model part names. To list base part names, run `node -e 'const m=require("./public/models/body-chart/manifest.json");console.log([...new Set(m.parts.map(p=>p.name))].join("\n"))'`.
- If it isn't in the model, give it `source: "none"` and `parts: []`. Add a `standIn` (the nearest base parts, with a note written like the existing ones) when there is an honest nearest structure. For skin, scar or brain targets, add no stand-in, so the page shows text only.
- `npx vitest run tests/lib/exercise-anatomy/muscles.test.ts` must stay green.

**Worked example** (`clam-shell`, Task 10):

```ts
  "clam-shell": {
    main: ["gluteus-medius"],
    helpers: ["gluteus-minimus", "deep-hip-rotators"],
    howItHelps:
      "Clams wake up and strengthen the muscles on the side of your hip without loading a sore knee or back. Stronger hip muscles keep your knee in line and your pelvis level when you walk, climb stairs or stand on one leg.",
    tissue: "muscle-tendon",
    status: "draft",
  },
```

**Batch file shape** (replace `LOWER_LIMB` and the comment for each batch):

```ts
// lib/exercise-anatomy/entries/lower-limb.ts
// Draft anatomy for knee, hip, ankle, hamstring and lower-limb exercises.
// Drafts show on dev only until Shivaliba approves them (status "approved").

import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

export const LOWER_LIMB: Record<string, ExerciseAnatomy> = {
  // one entry per slug in the task's list, in that order
};
```

**Registering a batch** in `lib/exercise-anatomy/index.ts`:
- Add the import after the existing imports, e.g. `import { LOWER_LIMB } from "@/lib/exercise-anatomy/entries/lower-limb";`.
- Add the constant to the array, e.g. `export const ANATOMY_BATCHES: readonly Readonly<Record<string, ExerciseAnatomy>>[] = [LOWER_LIMB];`. Later batches append to the same array.

**Steps for each content task**

- [ ] Step 1: Draft every listed slug into the batch file, following the rules above.
- [ ] Step 2: Register the batch in `lib/exercise-anatomy/index.ts`.
- [ ] Step 3: Run `npx vitest run tests/lib/exercise-anatomy/`. Expected: all PASS. Fix any `entryProblems` failure by rewriting the entry, not by changing the rules.
- [ ] Step 4: Print the batch's slug count and check it equals the task's count, e.g. `npx tsx -e 'import("./lib/exercise-anatomy/entries/lower-limb.ts").then((m) => console.log(Object.keys(m.LOWER_LIMB).length))'` (swap in the task's file and export name).
- [ ] Step 5: Commit the batch file, `index.ts` and `muscles.ts` if it changed: `git add lib/exercise-anatomy/entries/<file>.ts lib/exercise-anatomy/index.ts [lib/exercise-anatomy/muscles.ts]`, then commit with `feat(exercise-anatomy): draft anatomy for <area> exercises` and the trailer.

**What the reviewer checks** (instead of code style):
- Clinical anatomy accuracy against the exercise text.
- Main and helper choice.
- Plain wording, and no promises or timelines.
- Tissue track choice.
- Any new dictionary groups and stand-ins.

### Task 10: Lower limb (34)

**Files:** Create `lib/exercise-anatomy/entries/lower-limb.ts` (`LOWER_LIMB`). Modify `lib/exercise-anatomy/index.ts`, and `lib/exercise-anatomy/muscles.ts` only if needed.

**Slugs:**
- **Knee:** straight-leg-raise, heel-slide, mini-squat, stationary-bike, terminal-knee-extension-band, step-up, wall-squat-hold, split-squat, box-step-down, spanish-squat, reverse-nordic
- **Hip:** hip-bridge, clam-shell, side-lying-hip-abduction, standing-hip-flexor-stretch, deep-squat-mobility, lateral-band-walk, hip-hitch, banded-hip-external-rotation, copenhagen-adductor, single-leg-glute-bridge, standing-banded-hip-abduction
- **Ankle:** heel-raises, ankle-pump, ankle-alphabet, resisted-ankle-eversion, single-leg-balance-on-foam, calf-stretch-gastrocnemius, eccentric-heel-drop, heavy-slow-calf-raise, seated-calf-raise
- **Hamstring:** nordic-hamstring-curl-assisted, standing-hamstring-stretch
- **Lower limb:** sit-to-stand-control

Use the worked example above for `clam-shell`. Spanish squat targets the quadriceps and the patellar tendon (use `patellar-tendon`, which lights the kneecap as a stand-in).

### Task 11: Upper limb (26)

**Files:** Create `lib/exercise-anatomy/entries/upper-limb.ts` (`UPPER_LIMB`). Register it after `LOWER_LIMB`.

**Slugs:**
- **Shoulder:** scapular-setting, shoulder-flexion, pendulum-swing, shoulder-external-rotation-band, shoulder-internal-rotation-band, wall-slide, sleeper-stretch, prone-y-t-w-raises, scapular-retraction-band-row, overhead-press-progression, pendulum-with-light-weight, cross-body-stretch, push-up-plus-wall-or-floor
- **Wrist:** wrist-extensor-stretch, eccentric-wrist-extension, wrist-flexor-stretch, median-nerve-glide, weight-bearing-through-extended-wrist, eccentric-wrist-flexion, resisted-wrist-flexion, forearm-pronation-supination, wrist-extension-isotonic
- **Elbow:** elbow-flexion-extension, tyler-twist-flexbar
- **Hand:** grip-strengthening, tendon-glide-exercises

### Task 12: Spine and core (24)

**Files:** Create `lib/exercise-anatomy/entries/spine.ts` (`SPINE`). Register it after `UPPER_LIMB`.

**Slugs:**
- **Lumbar spine:** bridge-progression, bird-dog, mckenzie-press-up, standing-extension, prone-cobra, side-plank-modified, segmental-rolling, pelvic-tilt, quadruped-arm-leg-reach, lumbar-flexion-in-lying, sciatic-nerve-glide, functional-lifting-pattern
- **Cervical spine:** neck-rotation-range, neck-side-flexion-stretch, isometric-neck-hold, standing-chin-retraction, levator-scapulae-stretch, deep-neck-flexor-hold, prone-neck-extension
- **Neck:** chin-tuck
- **Thoracic spine:** cat-cow-stretch, thoracic-rotation-open-book, wall-angels
- **Core:** dead-bug

Chin tuck and deep-neck-flexor-hold use `deep-neck-flexors` (add-on). McKenzie press-up is about the lower back discs (`lumbar-discs`) and joints.

### Task 13: Pelvic health, face and paediatric (32)

**Files:** Create `lib/exercise-anatomy/entries/pelvic-face-paediatric.ts` (`PELVIC_FACE_PAEDIATRIC`). Register it after `SPINE`.

**Slugs:**
- **Pelvic health:** pelvic-floor-activation-basic, pelvic-floor-endurance-hold, fast-twitch-pelvic-floor-the-knack, deep-core-and-pelvic-floor-co-activation, diastasis-safe-curl-up, pelvic-floor-relaxation-drop, diaphragmatic-breathing-for-pelvic-floor, bridge-with-pelvic-floor-engagement, squat-with-pelvic-floor-control, standing-pelvic-tilt-pregnancy, side-lying-hip-abduction-pregnancy-safe, return-to-running-pelvic-floor-check, bowel-emptying-positioning, reverse-kegel-pelvic-floor-lengthening
- **Face** (text only, no 3D): smile-mouth-raise, eyebrow-raise, gentle-eye-close, cheek-puff, brow-furrow, big-smile, open-eyes-wide, lip-pucker. Use the face keys and the `nerve-brain` tissue track.
- **Paediatric:** animal-walk-circuit, balance-beam-walk-tape-line, ball-catch-and-throw, obstacle-course-crawl-through, toe-walking-heel-walking-game, trampette-bouncing-supervised, prone-extension-play-superman, scooter-board-propulsion, single-leg-hop-game, sensory-motor-circuit-multi-station

For paediatric entries, write `howItHelps` to the parent ("helps your child…").

### Task 14: Post-op and general (24)

**Files:** Create `lib/exercise-anatomy/entries/post-op-general.ts` (`POST_OP_GENERAL`). Register it after `PELVIC_FACE_PAEDIATRIC`.

**Slugs:**
- **Post-op:** ankle-pumps-post-surgery, quad-sets, assisted-knee-flexion, hip-abduction-in-lying-post-op, supported-standing-post-hip, shoulder-pendulum-post-rotator-cuff, passive-shoulder-flexion-assisted, incision-site-scar-mobilisation, graduated-weight-bearing, core-bracing-post-abdominal-surgery, post-op-walking-programme, resisted-knee-extension-post-acl, proprioception-board-post-ankle-surgery, return-to-function-strength-circuit, breathing-exercises-post-thoracic-surgery, graduated-return-to-driving-readiness
- **General:** general-mobility-warm-up, graded-walking-programme, full-body-stretch-routine, basic-bodyweight-circuit, pain-pacing-activity-plan, graded-exposure-to-feared-movement, return-to-sport-readiness-circuit, relaxation-and-breathing-for-pain-management

Notes for this batch:
- Scar mobilisation needs a new text-only group, e.g. `"scar-tissue"` (`source: "none"`, no stand-in).
- Breathing exercises use `diaphragm` (add-on) and `intercostals`.
- For pacing and graded-exposure plans, pick the muscles the planned activity mostly uses. If there is no honest choice, use a text-only group.

### Task 15: Balance and neuro (34) + completeness check

**Files:**
- Create `lib/exercise-anatomy/entries/balance-neuro.ts` (`BALANCE_NEURO`) and register it last.
- Modify `tests/lib/exercise-anatomy/entries.test.ts`.

**Slugs:**
- **Balance:** tandem-balance-hold, single-leg-balance, static-standing-balance-eyes-open, static-standing-balance-eyes-closed, weight-shifting, sideways-walking, heel-to-toe-walking-tandem-gait, marching-on-the-spot, backward-walking, sit-to-stand-repetitions, obstacle-stepping, stair-negotiation-practice, single-leg-stance-with-arm-reach, treadmill-or-level-ground-gait-practice, standing-on-one-leg-hand-support, turning-practice, dual-task-walking, uneven-surface-walking
- **Neuro:** bed-mobility-rolling, bridging-for-transfers, sit-to-stand-with-support, weight-bearing-through-affected-leg, reaching-tasks-affected-arm, parkinsons-big-movements-lsvt-style, rhythmic-stepping-to-a-beat, multiple-sclerosis-fatigue-paced-circuit, coordination-drills-finger-to-nose, heel-shin-slide-coordination, standing-balance-with-visual-feedback, functional-grasp-and-release, gait-re-education-with-cueing, trunk-rotation-in-sitting, standing-frame-or-supported-standing, dual-task-cognitive-motor-training

Neuro exercises usually take the `nerve-brain` track. Falls-prevention balance has no track. Balance after an ankle or knee injury takes `joint-ligament`.

Add this test inside the `describe` in `tests/lib/exercise-anatomy/entries.test.ts`:

```ts
  it("has an entry for every exercise in the library", () => {
    const missing = exercises.filter((e) => !e.retired && !EXERCISE_ANATOMY[e.slug]).map((e) => e.slug);
    expect(missing).toEqual([]);
  });
```

Run `npx vitest run tests/lib/exercise-anatomy/`. Expected: all PASS, with 174 entries.

---

### Task 16: Whole-branch verification, dev deploy and browser check (controller)

The controller runs this task, not a subagent, because it deploys and drives the browser.

- [ ] **Step 1: Full checks**

```bash
npm run test:run
npm run lint
npx tsc --noEmit -p tsconfig.json
```

Expected: the suite is all green (1716 plus the new tests), lint shows 0 errors, and tsc shows no new errors compared with master. Compare any pre-existing failure against master before calling it pre-existing.

- [ ] **Step 2: Prod-mode HTML is unchanged for pages with nothing approved**

1. Build master in a scratch worktree:
   - Create a detached worktree at `origin/master`: `<scratchpad>/html-master`.
   - Clone node_modules with `cp -cR node_modules <dir>/node_modules`, never a symlink.
   - Copy `.env.production` from `/Users/iamkjn/Documents/Playground` without printing it.
   - Run `npm run build` there.
2. Build this branch the same way with the drafts flag unset. Copy `.env.production` into this worktree, run `npm run build`, then delete `.env.production` from this worktree.
3. For `clam-shell`, `chin-tuck` and `spanish-squat`, diff `.next/server/app/exercises/<slug>.html` between the two builds. Before diffing, normalise build hashes (`sed -E 's/[a-f0-9]{16,}/H/g; s#/_next/static/[^"]+#/_next/static/X#g'`).
4. Expected: no differences outside script and chunk references.
5. Remove the scratch worktree when done.

- [ ] **Step 3: Deploy to dev only**

```bash
cp /Users/iamkjn/Documents/Playground/.env.development .env.development   # never print it
grep -q '^NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS=1$' .env.development || printf '\nNEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS=1\n' >> .env.development
grep -q '^NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS=1$' /Users/iamkjn/Documents/Playground/.env.development || printf '\nNEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS=1\n' >> /Users/iamkjn/Documents/Playground/.env.development
git branch --show-current
npm run deploy:dev
```

Expected: the build and the `verify-opennext-build` check both pass, and a new dev Worker version is printed. Record its id.

- [ ] **Step 4: Browser check on https://dev.physioonclick.co.uk**

Check at desktop width and at phone width (375 px):
- `/exercises/clam-shell` (hip, close-up from the side)
- `/exercises/spanish-squat` (stand-in note)
- `/exercises/chin-tuck` (add-on deep neck flexors)
- `/exercises/pelvic-floor-activation-basic` (add-on pelvic floor)
- `/exercises/bird-dog` (multifidus stand-in)
- `/exercises/smile-mouth-raise` (section only, no switch)

Pass criteria on each page:
- The switch opens the 3D view in the picture's square.
- Front/Back/Left/Right work, and "Whole body" / "Close-up" work.
- Tapping a lit muscle names it.
- "Back to picture" restores the illustration.
- On a phone, a vertical swipe over the 3D view scrolls the page.
- The section's text and stage strip read correctly.
- No console errors from the app.
- `/models/exercise-anatomy/manifest.json` returns 200 with `x-robots-tag: noindex`.

Take screenshots as proof.

- [ ] **Step 5: Prod is untouched**

Run `npx wrangler deployments list` for the prod Worker. Expected: the latest prod deployment is still `1be2be15…`, unless another session has deployed since, in which case note it. Nothing in this plan deploys prod.

---

### Task 17: Top-20 review sheet for Shivaliba

**Files:**
- Create: `docs/exercises-review/anatomy-batch-1-top-20.md`

- [ ] **Step 1: Re-pull the top 20.**
  - Use the Search Console kit in `~/.config/claude-seo/indexing-check/gsc.mjs` (jose JWT auth; see the GSC memory notes) to query page-level clicks and impressions for `/exercises/*` over the last 90 days.
  - Start from the 20 slugs in `lib/exercise-search-titles.ts`: spanish-squat, quad-sets, wall-squat-hold, wall-slide, isometric-neck-hold, elbow-flexion-extension, ankle-pumps-post-surgery, hip-hitch, chin-tuck, mckenzie-press-up, box-step-down, resisted-wrist-flexion, tyler-twist-flexbar, single-leg-balance, median-nerve-glide, nordic-hamstring-curl-assisted, prone-neck-extension, seated-calf-raise, terminal-knee-extension-band, scapular-retraction-band-row.
  - Replace the lowest-impression ones with any exercise page that now has more impressions. If the API is unavailable, keep this list and say so in the sheet.
- [ ] **Step 2: Write the sheet.**
  - Follow the existing files in `docs/exercises-review/`.
  - Start with a short intro, and say the 3D body is an adult male model (see the spec's "Known limitations").
  - Then add one block per exercise. Each block has:
    - the title and dev link `https://dev.physioonclick.co.uk/exercises/<slug>`;
    - Main focus and Also working (label + plain words);
    - How this helps (verbatim) and the tissue line;
    - any stand-in note;
    - `- [ ] Approve` / `- [ ] Change:` lines.
  - End with a "Shared copy" block: the four stage captions, five tissue lines and the closing line, with the same approve/change lines.
- [ ] **Step 3: Commit.** Run `git add docs/exercises-review/anatomy-batch-1-top-20.md`, then commit with `docs(exercise-anatomy): batch-1 review sheet for the top 20 exercise pages` and the trailer.

Approving batch 1 later is a separate change, made after Shivaliba replies: apply her edits and set `status: "approved"` on those entries and on `HEALING_COPY_STATUS`. Then deploy to prod only on the owner's go: from `origin/master`, in a fresh worktree, with the deploy guard.
