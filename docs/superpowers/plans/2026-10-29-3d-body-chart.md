# 3D Body Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat body chart on the assessment "Your concern" step with a rotatable 3D muscles-and-skeleton body that saves exactly the same 31 area keys. The flat chart stays as an automatic fallback.

**Architecture:** A build script converts the pinned open-source Human Atlas packaging of BodyParts3D into a compact, quantised model in `public/models/body-chart/`, with one body-chart area baked into every vertex. A client viewer loads three.js on demand and toggles areas by raycast. A picker chooses 3D or the existing flat `BodyChart`. The booking flow prefetches the model.

**Tech Stack:** Next.js 16 (App Router, webpack), React 19, TypeScript, three.js, meshoptimizer (build only), Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-10-29-3d-body-chart-design.md`

## Global Constraints

- **Workspace:** `/Users/iamkjn/Documents/Playground/.claude/worktrees/3d-body-chart`, branch `feat/3d-body-chart`.
  - Run every command from there.
  - `node_modules` there is a real copy. Never symlink it.
- **Saved data unchanged:** the chart's value is `string[]` of `BODY_REGIONS` keys from `lib/body-chart.ts`, plus `"somewhere-else"`.
- **Model source:** Human Atlas commit `1c38bf35c254a891200d3cedecfd57abebe83d8d` via `raw.githubusercontent.com`. Never Astra's CDN.
- **Model size:** gzipped total ≤ 6,000,000 bytes (target ≤ 5 MB; measured ≈ 3.5 MB).
- **Credit line text, exact:** `Anatomy: BodyParts3D © DBCLS, CC BY 4.0`, with "CC BY 4.0" linking to `https://creativecommons.org/licenses/by/4.0/`.
- **three.js imports:** only via `await import("three")` / `await import("three/examples/jsm/controls/OrbitControls.js")` inside an effect. `import type` is fine anywhere.
- **Admin:** `components/admin-assessment-review.tsx` keeps the flat `BodyChart`. Do not touch it.
- **Styling:** existing Clarity tokens only (`--color-*`, `--space-*`, `--text-*`, `--radius-*`).
- **Git:**
  - Before every commit, run `git branch --show-current` and confirm it is `feat/3d-body-chart`.
  - Stage explicit paths only. Never `git add -A` or `git add .`.
  - Never push.
  - End every commit message with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Deploy:**
  - Dev only, via `npm run deploy:dev`.
  - Never `npm run deploy`.
  - Never a bare `opennextjs-cloudflare deploy` without `-e dev`.
- **Tests:** run one file with `npx vitest run <path>` and everything with `npm run test:run`.

## File map

| File | Status | Responsibility |
|---|---|---|
| `lib/body-chart-3d-regions.ts` | create | Part-name rules + height bands → area key per vertex (build-time) |
| `lib/body-model-format.ts` | create | Binary chunk layout, read/write, face→part lookup, vertex colour helpers |
| `scripts/build-body-model.ts` | create | Download pinned source, simplify, quantise, bake areas, write model + mapping doc |
| `public/models/body-chart/*` | generated | `manifest.json`, `chunk-N.bin.gz`, `ATTRIBUTION.md` |
| `docs/body-chart-3d-mapping.md` | generated | Part → area table for spot-checking |
| `lib/body-model-loader.ts` | create | Memoised fetch/decode, progress, prefetch, `canUse3D()` |
| `lib/body-chart.ts` | modify | Add `toggleRegion()` |
| `components/body-chart-selection.tsx` | create | Shared "somewhere else" button + chips |
| `components/body-chart.tsx` | modify | Use `toggleRegion` + `BodyChartSelection` (behaviour unchanged) |
| `components/body-chart-3d.tsx` | create | three.js viewer |
| `components/body-chart-picker.tsx` | create | 3D-or-flat chooser with fallbacks |
| `components/assessment-wizard.tsx` | modify | Use `BodyChartPicker` |
| `components/booking-flow.tsx` | modify | Prefetch the model on mount |
| `app/globals.css` | modify | 3D chart + picker styles |
| `tests/setup.ts` | modify | Silence jsdom's unimplemented canvas `getContext` |
| `package.json`, `package-lock.json`, `.gitignore` | modify | `three`, `@types/three`, `meshoptimizer`, `build:body-model` script, `/.cache/` |

---

### Task 1: Area-mapping rules

**Files:**
- Create: `lib/body-chart-3d-regions.ts`
- Test: `tests/lib/body-chart-3d-regions.test.ts`

**Interfaces:**
- Consumes: `BODY_REGIONS` from `lib/body-chart.ts` (tests only).
- Produces:
  - `type Side = "left" | "right"`
  - `type Segment = "arm" | "leg" | "trunk"`
  - `type PartRule = { kind: "exclude" } | { kind: "fixed"; base: string } | { kind: "segment"; segment: Segment }`
  - `type KeptRule = Exclude<PartRule, { kind: "exclude" }>`
  - `sideOf(name: string): Side | null`
  - `ruleForPart(name: string): PartRule`
  - `segmentBase(segment: Segment, x: number, y: number, z: number): string`
  - `regionKeyForVertex(rule: KeptRule, side: Side | null, x: number, y: number, z: number): string`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/body-chart-3d-regions.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { BODY_REGIONS } from "@/lib/body-chart";
import {
  regionKeyForVertex,
  ruleForPart,
  segmentBase,
  sideOf,
  type KeptRule,
  type Segment,
} from "@/lib/body-chart-3d-regions";

const KEYS = new Set(BODY_REGIONS.map((r) => r.key));
const arm = { kind: "segment", segment: "arm" };
const leg = { kind: "segment", segment: "leg" };
const trunk = { kind: "segment", segment: "trunk" };

describe("sideOf", () => {
  it("reads the side from the part name", () => {
    expect(sideOf("Left femur")).toBe("left");
    expect(sideOf("Proximal phalanx of right index finger")).toBe("right");
    expect(sideOf("Sacrum")).toBeNull();
  });
});

describe("ruleForPart", () => {
  it.each([
    "Upper central secondary incisor tooth",
    "Gingiva of lower jaw",
    "Diaphragm",
    "Intervertebral disk of fifth lumbar vertebra",
    "Left superior rectus",
    "Thyroid cartilage",
    "Left genioglossus",
    "Anterior papillary muscle of ventricle",
    "Left internal intercostal muscle",
    "Left longus capitis",
  ])("drops %s", (name) => {
    expect(ruleForPart(name)).toEqual({ kind: "exclude" });
  });

  it.each([
    ["Frontal bone", { kind: "fixed", base: "head-jaw" }],
    ["Mandible", { kind: "fixed", base: "head-jaw" }],
    ["Left zygomatic bone", { kind: "fixed", base: "head-jaw" }],
    ["Hyoid bone", { kind: "fixed", base: "neck" }],
    ["Left supraspinatus", { kind: "fixed", base: "shoulder" }],
    ["Right teres major", { kind: "fixed", base: "shoulder" }],
    ["Left humerus", arm],
    ["Left extensor digitorum", arm],
    ["Oblique head of left adductor pollicis", arm],
    ["Left scaphoid", arm],
    ["Left clavicle", arm],
    ["Left femur", leg],
    ["Left extensor digitorum longus", leg],
    ["Long head of left biceps femoris", leg],
    ["Left rectus femoris", leg],
    ["Left calcaneal tendon", leg],
    ["Left iliacus", leg],
    ["Left hip bone", leg],
    ["Fifth lumbar vertebra", trunk],
    ["Left psoas major", trunk],
    ["Left scapula", trunk],
    ["Sternocostal part of left pectoralis major", trunk],
    ["Left external oblique", trunk],
  ])("classifies %s", (name, rule) => {
    expect(ruleForPart(name)).toEqual(rule);
  });
});

describe("segmentBase", () => {
  it.each([
    ["arm", 0.2, 1.35, 0, "shoulder"],
    ["arm", 0.2, 1.2, 0, "upper-arm"],
    ["arm", 0.25, 1.1, 0, "elbow"],
    ["arm", 0.25, 1.0, 0, "forearm"],
    ["arm", 0.28, 0.8, 0, "hand"],
    ["leg", 0.08, 0.9, -0.09, "buttock"],
    ["leg", 0.12, 0.9, 0.02, "hip"],
    ["leg", 0.09, 0.7, 0, "thigh"],
    ["leg", 0.08, 0.45, 0, "knee"],
    ["leg", 0.09, 0.2, 0, "lower-leg"],
    ["leg", 0.07, 0.05, 0, "foot"],
    ["trunk", 0, 1.5, 0, "neck"],
    ["trunk", 0.05, 1.35, -0.08, "upper-back"],
    ["trunk", 0.05, 1.2, -0.08, "mid-back"],
    ["trunk", 0.05, 1.05, -0.08, "lower-back"],
    ["trunk", 0.12, 1.1, 0.02, "side"],
    ["trunk", 0.05, 1.25, 0.08, "chest"],
    ["trunk", 0.05, 1.05, 0.08, "abdomen"],
  ] as const)("%s at (%s, %s, %s) is %s", (segment, x, y, z, base) => {
    expect(segmentBase(segment, x, y, z)).toBe(base);
  });
});

describe("regionKeyForVertex", () => {
  it("appends the part's side to sided areas, even across the midline", () => {
    expect(regionKeyForVertex({ kind: "segment", segment: "leg" }, "right", 0.01, 0.45, 0)).toBe("knee-right");
    expect(regionKeyForVertex({ kind: "fixed", base: "shoulder" }, "left", 0.2, 1.4, 0)).toBe("shoulder-left");
  });

  it("uses the vertex x sign when the part has no side (+x is the patient's left)", () => {
    expect(regionKeyForVertex({ kind: "segment", segment: "trunk" }, null, 0.12, 1.1, 0.02)).toBe("side-left");
    expect(regionKeyForVertex({ kind: "segment", segment: "trunk" }, null, -0.12, 1.1, 0.02)).toBe("side-right");
  });

  it("leaves midline areas unsided", () => {
    expect(regionKeyForVertex({ kind: "segment", segment: "trunk" }, "left", 0.1, 1.25, 0.08)).toBe("chest");
    expect(regionKeyForVertex({ kind: "fixed", base: "head-jaw" }, null, 0, 1.6, 0)).toBe("head-jaw");
  });

  it("only ever returns BODY_REGIONS keys, and can reach all of them", () => {
    const seen = new Set<string>();
    const unknown = new Set<string>();
    const rules: KeptRule[] = [
      ...(["arm", "leg", "trunk"] as Segment[]).map((segment) => ({ kind: "segment" as const, segment })),
      { kind: "fixed", base: "head-jaw" },
    ];
    for (const rule of rules) {
      for (let x = -0.3; x <= 0.3; x += 0.03) {
        for (let y = 0; y <= 1.75; y += 0.025) {
          for (let z = -0.15; z <= 0.15; z += 0.03) {
            for (const side of ["left", "right", null] as const) {
              const key = regionKeyForVertex(rule, side, x, y, z);
              if (!KEYS.has(key)) unknown.add(key);
              seen.add(key);
            }
          }
        }
      }
    }
    expect([...unknown]).toEqual([]);
    expect([...KEYS].filter((k) => !seen.has(k))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/lib/body-chart-3d-regions.test.ts`
Expected: FAIL, "Failed to resolve import "@/lib/body-chart-3d-regions"".

- [ ] **Step 3: Write the implementation**

Create `lib/body-chart-3d-regions.ts`:

```ts
// lib/body-chart-3d-regions.ts
// Maps the 3D body model (BodyParts3D via Human Atlas) onto the 31
// patient-facing areas in lib/body-chart.ts. Used at build time by
// scripts/build-body-model.ts, which stores one area per vertex, so the
// browser never runs these rules.
//
// Each part gets a rule from its name: dropped (deep or irrelevant structures
// nobody can tap), one fixed area (skull -> head-jaw), or a body segment (arm,
// leg, trunk) whose vertices are split into areas by height. Splitting per
// vertex rather than per part means a joint area like "Left knee" covers the
// ends of the femur and tibia as well as the patella, so the area lights up
// where the patient tapped.
//
// Coordinates: metres, Y up, +X = the patient's left, +Z = the front.

export type Side = "left" | "right";
export type Segment = "arm" | "leg" | "trunk";
export type PartRule =
  | { kind: "exclude" }
  | { kind: "fixed"; base: string }
  | { kind: "segment"; segment: Segment };
export type KeptRule = Exclude<PartRule, { kind: "exclude" }>;

// Area bases that exist as "-left" / "-right" keys in BODY_REGIONS.
const SIDED_BASES: ReadonlySet<string> = new Set([
  "shoulder", "upper-arm", "elbow", "forearm", "hand",
  "hip", "buttock", "thigh", "knee", "lower-leg", "foot", "side",
]);

// Internal or irrelevant structures: not tappable from outside the body.
const EXCLUDE: RegExp[] = [
  /\btooth\b/, /gingiva/, /papillary muscle/, /\bdiaphragm\b/,
  /arytenoid|cricoid|crico-|thyroid cartilage|thyro-|epiglott|vocal|conus elasticus|corniculate|cuneiform cartilage|thyrohyoid membrane|cricothyroid/,
  /glossus|veli palatini|uvular|raphe/,
  /^(superior|inferior|lateral|medial) rectus$/, /^(superior|inferior) oblique$/,
  /levator palpebrae|trochlea of superior oblique|check ligament/,
  /coccygeus|levator ani|anal sphincter|perineal|puborectalis/,
  /longus colli|longus capitis|rectus capitis (anterior|lateralis)/,
  /transversus thoracis|innermost intercostal|internal intercostal/,
  /intervertebral disk/, /interosseous membrane/, /intermediate tendon/,
];

const HEAD = /^(frontal|parietal|occipital|temporal|sphenoid|nasal|zygomatic|palatine) bone$|^(ethmoid|maxilla|mandible|vomer|major alar cartilage)$/;
const SHOULDER = /supraspinatus|infraspinatus|teres (major|minor)|subscapularis/;

const ARM = new RegExp(
  [
    "humerus", "\\bradius\\b", "\\bulna\\b", "clavicle", "deltoid", "biceps brachii", "triceps brachii",
    "brachialis", "coracobrachialis", "anconeus", "brachioradialis", "pronator", "supinator", "palmaris",
    "carpi", "pollicis", "extensor digitorum$", "extensor digiti minimi$", "extensor indicis",
    "flexor digitorum (superficialis|profundus)", "of hand", "finger", "thumb", "metacarpal", "scaphoid",
    "lunate", "triquetral", "pisiform", "trapezium", "trapezoid", "capitate", "hamate",
  ].join("|")
);

const LEG = new RegExp(
  [
    "femur", "patella", "tibia", "fibula", "hip bone", "gluteus", "piriformis", "gemellus", "obturator",
    "quadratus femoris", "tensor fasciae latae", "iliotibial", "sartorius", "rectus femoris", "vastus",
    "adductor (brevis|longus|magnus|minimus)", "gracilis", "pectineus", "biceps femoris", "semitendinosus",
    "semimembranosus", "popliteus", "gastrocnemius", "soleus", "plantaris", "fibularis",
    "extensor digitorum longus", "hallucis", "flexor digitorum (longus|brevis)", "flexor accessorius",
    "of foot", "toe", "talus", "calcaneus", "calcaneal", "cuboid", "cuneiform bone", "metatarsal",
    "plantar", "iliacus",
  ].join("|")
);

function stripSide(name: string): string {
  return name.toLowerCase().replace(/\b(left|right)\b ?/g, "").trim();
}

export function sideOf(name: string): Side | null {
  if (/\bleft\b/i.test(name)) return "left";
  if (/\bright\b/i.test(name)) return "right";
  return null;
}

export function ruleForPart(name: string): PartRule {
  const n = stripSide(name);
  if (EXCLUDE.some((r) => r.test(n))) return { kind: "exclude" };
  if (HEAD.test(n)) return { kind: "fixed", base: "head-jaw" };
  if (n === "hyoid bone") return { kind: "fixed", base: "neck" };
  if (SHOULDER.test(n)) return { kind: "fixed", base: "shoulder" };
  if (ARM.test(n)) return { kind: "segment", segment: "arm" };
  if (LEG.test(n)) return { kind: "segment", segment: "leg" };
  return { kind: "segment", segment: "trunk" };
}

// Height landmarks (metres), measured from the model's bones: C7 tops out at
// 1.47, the humerus spans 1.11-1.42, the radius ends at 0.884 (wrist), the
// hip bone spans 0.83-1.04, the patella 0.44-0.48 and the calcaneus sits below 0.06.
const Y = {
  neck: 1.45, upperBack: 1.3, midBack: 1.13, chest: 1.17,
  shoulder: 1.3, upperArm: 1.14, elbow: 1.06, forearm: 0.885,
  hip: 0.8, thigh: 0.5, knee: 0.4, lowerLeg: 0.09,
} as const;
const Z_BACK = -0.045; // trunk: behind this is "back" (the vertebral bodies sit around -0.04)
const Z_BUTTOCK = -0.055; // pelvis: behind this is "buttock"
const SIDE_X = 0.105; // trunk below the shoulders: lateral to this is "side"

export function segmentBase(segment: Segment, x: number, y: number, z: number): string {
  if (segment === "arm") {
    if (y >= Y.shoulder) return "shoulder";
    if (y >= Y.upperArm) return "upper-arm";
    if (y >= Y.elbow) return "elbow";
    if (y >= Y.forearm) return "forearm";
    return "hand";
  }
  if (segment === "leg") {
    if (y >= Y.hip) return z < Z_BUTTOCK ? "buttock" : "hip";
    if (y >= Y.thigh) return "thigh";
    if (y >= Y.knee) return "knee";
    if (y >= Y.lowerLeg) return "lower-leg";
    return "foot";
  }
  if (y >= Y.neck) return "neck";
  if (z < Z_BACK) {
    if (y >= Y.upperBack) return "upper-back";
    if (y >= Y.midBack) return "mid-back";
    return "lower-back";
  }
  if (Math.abs(x) >= SIDE_X && y < Y.upperBack) return "side";
  return y >= Y.chest ? "chest" : "abdomen";
}

export function regionKeyForVertex(rule: KeptRule, side: Side | null, x: number, y: number, z: number): string {
  const base = rule.kind === "fixed" ? rule.base : segmentBase(rule.segment, x, y, z);
  if (!SIDED_BASES.has(base)) return base;
  return `${base}-${side ?? (x >= 0 ? "left" : "right")}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/lib/body-chart-3d-regions.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git branch --show-current   # must print feat/3d-body-chart
git add lib/body-chart-3d-regions.ts tests/lib/body-chart-3d-regions.test.ts
git commit -m "feat(body-chart-3d): area mapping rules for the 3D model

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Model binary format and colour helpers

**Files:**
- Create: `lib/body-model-format.ts`
- Test: `tests/lib/body-model-format.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `BODY_MODEL_DIR = "/models/body-chart"`
  - `POSITION_SCALE = 2`
  - `NO_REGION = 255`
  - `MAX_CHUNK_VERTICES = 65_535`
  - `MODEL_SYSTEMS = ["skeletal","muscular","connective"] as const`
  - `type ModelSystem`
  - `interface ModelPart { name; system: number; chunk; firstVertex; vertexCount; firstIndex; indexCount }`
  - `interface ModelChunk { file; bytes; gzipBytes; vertexCount; indexCount }`
  - `interface BodyModelManifest { version: 1; source; triangles; regions: string[]; systems: ModelSystem[]; parts: ModelPart[]; chunks: ModelChunk[] }`
  - `interface ChunkArrays { positions: Int16Array; normals: Int8Array; regions: Uint8Array; indices: Uint16Array }`
  - `chunkLayout(vertexCount, indexCount)`
  - `readChunk(chunk: ModelChunk, buffer: ArrayBuffer): ChunkArrays`
  - `writeChunk(a: ChunkArrays): Uint8Array`
  - `partForFace(parts: readonly ModelPart[], faceIndex: number): ModelPart | undefined`
  - `PALETTE`
  - `linearBytes(hex): [number, number, number]`
  - `baseColors(parts, systems, vertexCount): Uint8Array`
  - `HOVER_MIX`
  - `paintColors(out: Uint8Array, base: Uint8Array, regions: Uint8Array, selected: ReadonlySet<number>, hover: number | null): void`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/body-model-format.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  NO_REGION,
  baseColors,
  chunkLayout,
  linearBytes,
  paintColors,
  partForFace,
  readChunk,
  writeChunk,
  type ChunkArrays,
  type ModelPart,
} from "@/lib/body-model-format";

function sample(): ChunkArrays {
  return {
    positions: new Int16Array([0, 1, 2, -3, -4, -5, 32767, -32767, 7]),
    normals: new Int8Array([127, 0, 0, 0, -127, 0, 0, 0, 1]),
    regions: new Uint8Array([3, 4, NO_REGION]),
    indices: new Uint16Array([0, 1, 2, 2, 1, 0]),
  };
}

describe("chunk layout", () => {
  it("4-byte aligns every block", () => {
    const l = chunkLayout(3, 6);
    expect(l).toEqual({ positions: 0, normals: 20, regions: 32, indices: 36, bytes: 48 });
  });

  it("round-trips through writeChunk/readChunk", () => {
    const a = sample();
    const bytes = writeChunk(a);
    const b = readChunk(
      { file: "chunk-0.bin.gz", bytes: bytes.length, gzipBytes: 1, vertexCount: 3, indexCount: 6 },
      bytes.slice().buffer
    );
    expect([...b.positions]).toEqual([...a.positions]);
    expect([...b.normals]).toEqual([...a.normals]);
    expect([...b.regions]).toEqual([...a.regions]);
    expect([...b.indices]).toEqual([...a.indices]);
  });

  it("rejects a buffer of the wrong size", () => {
    expect(() =>
      readChunk({ file: "chunk-0.bin.gz", bytes: 48, gzipBytes: 1, vertexCount: 3, indexCount: 6 }, new ArrayBuffer(40))
    ).toThrow(/expected 48/);
  });
});

describe("partForFace", () => {
  const parts: ModelPart[] = [
    { name: "A", system: 0, chunk: 0, firstVertex: 0, vertexCount: 3, firstIndex: 0, indexCount: 6 },
    { name: "B", system: 1, chunk: 0, firstVertex: 3, vertexCount: 3, firstIndex: 6, indexCount: 3 },
  ];
  it("finds the part that owns a triangle", () => {
    expect(partForFace(parts, 0)?.name).toBe("A");
    expect(partForFace(parts, 1)?.name).toBe("A");
    expect(partForFace(parts, 2)?.name).toBe("B");
    expect(partForFace(parts, 3)).toBeUndefined();
  });
});

describe("colours", () => {
  it("converts sRGB hex to linear bytes", () => {
    expect(linearBytes("#FFFFFF")).toEqual([255, 255, 255]);
    expect(linearBytes("#000000")).toEqual([0, 0, 0]);
    expect(linearBytes("#0EA5E9")).toEqual([1, 96, 208]);
  });

  it("paints selected areas in the accent, the hovered area part-way, the rest in the base colour", () => {
    const parts: ModelPart[] = [
      { name: "bone", system: 0, chunk: 0, firstVertex: 0, vertexCount: 2, firstIndex: 0, indexCount: 3 },
      { name: "muscle", system: 1, chunk: 0, firstVertex: 2, vertexCount: 1, firstIndex: 3, indexCount: 3 },
    ];
    const base = baseColors(parts, ["skeletal", "muscular", "connective"], 3);
    expect([...base.slice(0, 3)]).toEqual(linearBytes("#E8DFC6"));
    expect([...base.slice(6, 9)]).toEqual(linearBytes("#C48C7C"));

    const out = new Uint8Array(9);
    paintColors(out, base, new Uint8Array([5, 6, 7]), new Set([5]), 6);
    expect([...out.slice(0, 3)]).toEqual([1, 96, 208]);
    const hovered = [...out.slice(3, 6)];
    expect(hovered).not.toEqual([...base.slice(3, 6)]);
    expect(hovered).not.toEqual([1, 96, 208]);
    expect([...out.slice(6, 9)]).toEqual([...base.slice(6, 9)]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/lib/body-model-format.test.ts`
Expected: FAIL, "Failed to resolve import "@/lib/body-model-format"".

- [ ] **Step 3: Write the implementation**

Create `lib/body-model-format.ts`:

```ts
// lib/body-model-format.ts
// Binary layout of the 3D body-chart model in public/models/body-chart/,
// shared by scripts/build-body-model.ts (writer) and lib/body-model-loader.ts
// (reader), plus the pure colouring helpers the viewer uses.
//
// One chunk = one merged mesh of at most 65,535 vertices, so indices fit in
// Uint16. Layout of a chunk (each block 4-byte aligned):
//   positions  Int16 x3  normalised; x POSITION_SCALE = metres
//   normals    Int8  x3  normalised
//   regions    Uint8 x1  index into manifest.regions (NO_REGION if none)
//   indices    Uint16

export const BODY_MODEL_DIR = "/models/body-chart";
export const POSITION_SCALE = 2;
export const NO_REGION = 255;
export const MAX_CHUNK_VERTICES = 65_535;
export const MODEL_SYSTEMS = ["skeletal", "muscular", "connective"] as const;
export type ModelSystem = (typeof MODEL_SYSTEMS)[number];

export interface ModelPart {
  name: string;
  system: number; // index into manifest.systems
  chunk: number;
  firstVertex: number; // within the chunk
  vertexCount: number;
  firstIndex: number; // within the chunk's index array
  indexCount: number;
}

export interface ModelChunk {
  file: string;
  bytes: number; // uncompressed
  gzipBytes: number;
  vertexCount: number;
  indexCount: number;
}

export interface BodyModelManifest {
  version: 1;
  source: string;
  triangles: number;
  regions: string[]; // BODY_REGIONS keys, in order
  systems: ModelSystem[];
  parts: ModelPart[];
  chunks: ModelChunk[];
}

export interface ChunkArrays {
  positions: Int16Array;
  normals: Int8Array;
  regions: Uint8Array;
  indices: Uint16Array;
}

const align4 = (n: number) => (n + 3) & ~3;

export function chunkLayout(vertexCount: number, indexCount: number) {
  const positions = 0;
  const normals = align4(positions + vertexCount * 6);
  const regions = align4(normals + vertexCount * 3);
  const indices = align4(regions + vertexCount);
  return { positions, normals, regions, indices, bytes: indices + indexCount * 2 };
}

export function readChunk(chunk: ModelChunk, buffer: ArrayBuffer): ChunkArrays {
  const l = chunkLayout(chunk.vertexCount, chunk.indexCount);
  if (buffer.byteLength !== l.bytes) {
    throw new Error(`Body model chunk ${chunk.file} has ${buffer.byteLength} bytes, expected ${l.bytes}`);
  }
  return {
    positions: new Int16Array(buffer, l.positions, chunk.vertexCount * 3),
    normals: new Int8Array(buffer, l.normals, chunk.vertexCount * 3),
    regions: new Uint8Array(buffer, l.regions, chunk.vertexCount),
    indices: new Uint16Array(buffer, l.indices, chunk.indexCount),
  };
}

export function writeChunk(a: ChunkArrays): Uint8Array {
  const l = chunkLayout(a.regions.length, a.indices.length);
  const out = new Uint8Array(l.bytes);
  out.set(new Uint8Array(a.positions.buffer, a.positions.byteOffset, a.positions.byteLength), l.positions);
  out.set(new Uint8Array(a.normals.buffer, a.normals.byteOffset, a.normals.byteLength), l.normals);
  out.set(a.regions, l.regions);
  out.set(new Uint8Array(a.indices.buffer, a.indices.byteOffset, a.indices.byteLength), l.indices);
  return out;
}

/** The part that owns triangle `faceIndex`; `parts` are one chunk's parts in index order. */
export function partForFace(parts: readonly ModelPart[], faceIndex: number): ModelPart | undefined {
  const index = faceIndex * 3;
  let lo = 0;
  let hi = parts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const part = parts[mid];
    if (index < part.firstIndex) hi = mid - 1;
    else if (index >= part.firstIndex + part.indexCount) lo = mid + 1;
    else return part;
  }
  return undefined;
}

export const PALETTE: Record<ModelSystem | "selected", string> = {
  skeletal: "#E8DFC6",
  muscular: "#C48C7C",
  connective: "#CDD6CE",
  selected: "#0EA5E9", // --book-accent
};

/** sRGB hex -> linear RGB bytes (three.js treats vertex colours as linear). */
export function linearBytes(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  const lin = (c: number) => {
    const s = c / 255;
    const l = s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    return Math.round(l * 255);
  };
  return [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)];
}

export function baseColors(parts: readonly ModelPart[], systems: readonly ModelSystem[], vertexCount: number): Uint8Array {
  const out = new Uint8Array(vertexCount * 3);
  for (const part of parts) {
    const rgb = linearBytes(PALETTE[systems[part.system]]);
    for (let v = part.firstVertex; v < part.firstVertex + part.vertexCount; v++) out.set(rgb, v * 3);
  }
  return out;
}

export const HOVER_MIX = 0.45;

export function paintColors(
  out: Uint8Array,
  base: Uint8Array,
  regions: Uint8Array,
  selected: ReadonlySet<number>,
  hover: number | null
): void {
  const accent = linearBytes(PALETTE.selected);
  for (let v = 0; v < regions.length; v++) {
    const region = regions[v];
    const o = v * 3;
    if (selected.has(region)) {
      out[o] = accent[0];
      out[o + 1] = accent[1];
      out[o + 2] = accent[2];
    } else if (region === hover) {
      for (let k = 0; k < 3; k++) out[o + k] = Math.round(base[o + k] + (accent[k] - base[o + k]) * HOVER_MIX);
    } else {
      out[o] = base[o];
      out[o + 1] = base[o + 1];
      out[o + 2] = base[o + 2];
    }
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/lib/body-model-format.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git branch --show-current   # must print feat/3d-body-chart
git add lib/body-model-format.ts tests/lib/body-model-format.test.ts
git commit -m "feat(body-chart-3d): binary model format and colour helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Build the model files

**Files:**
- Create: `scripts/build-body-model.ts`
- Generated: `public/models/body-chart/manifest.json`, `public/models/body-chart/chunk-*.bin.gz`, `public/models/body-chart/ATTRIBUTION.md`, `docs/body-chart-3d-mapping.md`
- Modify: `package.json` (devDependency `meshoptimizer`, script `build:body-model`), `package-lock.json`, `.gitignore`
- Test: `tests/lib/body-chart-3d-manifest.test.ts`

**Interfaces:**
- Consumes:
  - From Task 1: `ruleForPart`, `sideOf`, `regionKeyForVertex`.
  - From Task 2: `writeChunk`, `MAX_CHUNK_VERTICES`, `MODEL_SYSTEMS`, `NO_REGION`, `POSITION_SCALE`, `readChunk`, types.
  - `BODY_REGIONS` from `lib/body-chart.ts`.
- Produces: the committed model files. The manifest's `regions` equal `BODY_REGIONS.map(r => r.key)`.

- [ ] **Step 1: Add the dependency, script and cache ignore**

```bash
npm install --save-dev --no-audit --no-fund meshoptimizer@^1.2.0
npm pkg set scripts.build:body-model="tsx scripts/build-body-model.ts"
printf '\n# Downloaded build inputs (scripts/build-body-model.ts)\n/.cache/\n' >> .gitignore
```

- [ ] **Step 2: Write the failing manifest test**

Create `tests/lib/body-chart-3d-manifest.test.ts`:

```ts
// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, it, expect } from "vitest";
import { BODY_REGIONS } from "@/lib/body-chart";
import { NO_REGION, readChunk, type BodyModelManifest } from "@/lib/body-model-format";

const DIR = path.join(process.cwd(), "public", "models", "body-chart");
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8")) as BodyModelManifest;

describe("committed 3D body model", () => {
  it("uses exactly the BODY_REGIONS keys, in order", () => {
    expect(manifest.regions).toEqual(BODY_REGIONS.map((r) => r.key));
  });

  it("stays within the 6 MB download cap", () => {
    const gz = manifest.chunks.reduce((n, c) => n + fs.statSync(path.join(DIR, c.file)).size, 0);
    expect(gz).toBe(manifest.chunks.reduce((n, c) => n + c.gzipBytes, 0));
    expect(gz).toBeLessThanOrEqual(6_000_000);
  });

  it("gives every vertex an area, and covers all 31 areas", () => {
    const seen = new Set<number>();
    let unassigned = 0;
    for (const c of manifest.chunks) {
      const raw = gunzipSync(fs.readFileSync(path.join(DIR, c.file)));
      const arrays = readChunk(c, raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length));
      for (const r of arrays.regions) {
        if (r === NO_REGION) unassigned++;
        else seen.add(r);
      }
      let maxIndex = 0;
      for (const i of arrays.indices) if (i > maxIndex) maxIndex = i;
      expect(maxIndex).toBeLessThan(c.vertexCount);
    }
    expect(unassigned).toBe(0);
    expect(seen.size).toBe(BODY_REGIONS.length);
  });

  it("lists parts that tile each chunk's index range", () => {
    manifest.chunks.forEach((c, i) => {
      const parts = manifest.parts.filter((p) => p.chunk === i);
      expect(parts.reduce((n, p) => n + p.indexCount, 0)).toBe(c.indexCount);
      expect(parts.reduce((n, p) => n + p.vertexCount, 0)).toBe(c.vertexCount);
    });
  });

  it("ships the CC BY 4.0 and MIT attribution", () => {
    const text = fs.readFileSync(path.join(DIR, "ATTRIBUTION.md"), "utf8");
    expect(text).toMatch(/BodyParts3D/);
    expect(text).toMatch(/CC BY 4\.0|Creative Commons Attribution 4\.0/);
    expect(text).toMatch(/MIT License/);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/lib/body-chart-3d-manifest.test.ts`
Expected: FAIL with `ENOENT` for `public/models/body-chart/manifest.json`.

- [ ] **Step 4: Write the build script**

Create `scripts/build-body-model.ts`:

```ts
// scripts/build-body-model.ts
// Builds the 3D body-chart model in public/models/body-chart/ from the Human
// Atlas packaging (MIT) of BodyParts3D 4.0 (CC BY 4.0), pinned to one commit.
// Keeps muscles, bones and connective tissue, drops parts nobody can tap,
// simplifies to a download budget, quantises, and bakes one body-chart area
// into every vertex (lib/body-chart-3d-regions.ts). Also writes a part -> area
// table to docs/body-chart-3d-mapping.md for spot-checking.
//
// Run from the repo root: npm run build:body-model  (downloads ~33 MB to .cache/ once)

import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { MeshoptSimplifier } from "meshoptimizer";
import { BODY_REGIONS } from "../lib/body-chart";
import { regionKeyForVertex, ruleForPart, sideOf, type KeptRule } from "../lib/body-chart-3d-regions";
import {
  MAX_CHUNK_VERTICES,
  MODEL_SYSTEMS,
  POSITION_SCALE,
  writeChunk,
  type BodyModelManifest,
  type ModelChunk,
  type ModelPart,
  type ModelSystem,
} from "../lib/body-model-format";

const COMMIT = "1c38bf35c254a891200d3cedecfd57abebe83d8d";
const RAW = `https://raw.githubusercontent.com/ashemag/human-atlas/${COMMIT}/public/models`;
const ROOT = process.cwd();
const CACHE = path.join(ROOT, ".cache", "human-atlas", COMMIT.slice(0, 12));
const OUT = path.join(ROOT, "public", "models", "body-chart");
const MAPPING_DOC = path.join(ROOT, "docs", "body-chart-3d-mapping.md");

const TRIANGLE_BUDGET = 200_000;
const MAX_ERROR = 0.02; // meshoptimizer relative error limit per part
const MIN_TRIANGLES = 48;
const MAX_GZIP_BYTES = 6_000_000;

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
interface MappingRow {
  name: string;
  system: ModelSystem;
  areas: Map<string, number>;
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

function mappingDoc(rows: MappingRow[]): string {
  const lines = rows
    .map((r) => {
      const total = [...r.areas.values()].reduce((a, b) => a + b, 0);
      const sorted = [...r.areas.entries()].sort((a, b) => b[1] - a[1]);
      const areas = sorted.map(([k, n]) => `${k} ${Math.round((n / total) * 100)}%`).join(", ");
      return { first: sorted[0][0], line: `| ${r.name} | ${r.system} | ${areas} |` };
    })
    .sort((a, b) => a.first.localeCompare(b.first) || a.line.localeCompare(b.line))
    .map((r) => r.line);
  return [
    "# 3D body chart: part → area mapping",
    "",
    "Generated by `npm run build:body-model` (scripts/build-body-model.ts). Do not edit by hand.",
    "Each row is one anatomical part and the share of its surface assigned to each body-chart area.",
    "",
    "| Part | System | Areas |",
    "|---|---|---|",
    ...lines,
    "",
  ].join("\n");
}

const ATTRIBUTION = `# 3D body chart attribution

## Anatomy data

BodyParts3D, © The Database Center for Life Science, licensed under Creative Commons
Attribution 4.0 International (CC BY 4.0).

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical
  concepts. https://doi.org/10.1093/nar/gkn613

Adaptations by PhysioOnClick: kept skeletal, muscular and connective-tissue structures only;
removed internal structures (teeth, larynx, eye, tongue, pelvic floor, deep neck muscles,
intervertebral disks, diaphragm); simplified with meshoptimizer; quantised positions and
normals; merged into chunks; assigned each vertex to a patient-facing body area.

## Packaging

Converted geometry taken from Human Atlas (https://github.com/ashemag/human-atlas) at commit
${COMMIT}.

MIT License

Copyright (c) 2026 ashemag

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

async function main() {
  await MeshoptSimplifier.ready;
  const atlas = JSON.parse((await download("atlas.json")).toString("utf8")) as SourceAtlas;
  const sources = await Promise.all(
    atlas.chunks.map(async (c) => {
      const raw = gunzipSync(await download(path.basename(c.gzip)));
      if (raw.length !== c.bytes) throw new Error(`${c.gzip} unpacked to ${raw.length} bytes, expected ${c.bytes}`);
      return raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length); // own buffer, offset 0 (aligned views)
    })
  );

  const systems: ModelSystem[] = [...MODEL_SYSTEMS];
  const regionIndex = new Map(BODY_REGIONS.map((r, i) => [r.key, i]));
  const kept: { p: SourcePart; system: number; rule: KeptRule }[] = [];
  for (const p of atlas.parts) {
    const system = systems.indexOf(p.system as ModelSystem);
    if (system < 0) continue;
    const rule = ruleForPart(p.name);
    if (rule.kind !== "exclude") kept.push({ p, system, rule });
  }
  const sourceTriangles = kept.reduce((n, k) => n + k.p.indexCount / 3, 0);
  const ratio = Math.min(1, TRIANGLE_BUDGET / sourceTriangles);

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const parts: ModelPart[] = [];
  const chunks: ModelChunk[] = [];
  const mapping: MappingRow[] = [];
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

  for (const { p, system, rule } of kept) {
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
    const regions = new Uint8Array(vertexCount);
    const side = sideOf(p.name);
    const areas = new Map<string, number>();
    for (let old = 0; old < remap.length; old++) {
      const v = remap[old];
      if (v === 0xffffffff) continue;
      const x = pos[old * 3];
      const y = pos[old * 3 + 1];
      const z = pos[old * 3 + 2];
      positions[v * 3] = Math.round((x / POSITION_SCALE) * 32767);
      positions[v * 3 + 1] = Math.round((y / POSITION_SCALE) * 32767);
      positions[v * 3 + 2] = Math.round((z / POSITION_SCALE) * 32767);
      for (let k = 0; k < 3; k++) normals[v * 3 + k] = Math.round((nrm[old * 3 + k] / 32767) * 127);
      const key = regionKeyForVertex(rule, side, x, y, z);
      const ri = regionIndex.get(key);
      if (ri === undefined) throw new Error(`${p.name}: area "${key}" is not in BODY_REGIONS`);
      regions[v] = ri;
      areas.set(key, (areas.get(key) ?? 0) + 1);
    }
    const indices = new Uint16Array(simplified.length);
    for (let i = 0; i < simplified.length; i++) indices[i] = simplified[i] + pending.vertexCount;

    parts.push({
      name: p.name,
      system,
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
    mapping.push({ name: p.name, system: systems[system], areas });
  }
  flush();

  const triangles = parts.reduce((n, p) => n + p.indexCount / 3, 0);
  const manifest: BodyModelManifest = {
    version: 1,
    source: `BodyParts3D 4.0 via Human Atlas ${COMMIT.slice(0, 12)}`,
    triangles,
    regions: BODY_REGIONS.map((r) => r.key),
    systems,
    parts,
    chunks,
  };
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest));
  fs.writeFileSync(path.join(OUT, "ATTRIBUTION.md"), ATTRIBUTION);
  fs.writeFileSync(MAPPING_DOC, mappingDoc(mapping));

  const gzipTotal = chunks.reduce((n, c) => n + c.gzipBytes, 0);
  console.log(
    `parts ${parts.length}, triangles ${triangles}, chunks ${chunks.length}, download ${(gzipTotal / 1e6).toFixed(2)} MB`
  );
  if (gzipTotal > MAX_GZIP_BYTES) {
    throw new Error(`Model is ${(gzipTotal / 1e6).toFixed(2)} MB; the cap is ${MAX_GZIP_BYTES / 1e6} MB. Lower TRIANGLE_BUDGET.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 5: Run the build**

Run: `npm run build:body-model`
Expected: it prints something like `parts 569, triangles ~300000, chunks 6-7, download ~3.5 MB` and exits 0. `ls public/models/body-chart` shows `manifest.json`, `ATTRIBUTION.md` and `chunk-0.bin.gz` … `chunk-N.bin.gz`.

- [ ] **Step 6: Run the manifest test to verify it passes**

Run: `npx vitest run tests/lib/body-chart-3d-manifest.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 7: Spot-check the mapping**

Run: `grep -E '^\| (Left|Right) (femur|patella|humerus|calcaneus) ' docs/body-chart-3d-mapping.md`
Expected:
- The femur rows are mostly `thigh-<side>`, with some `knee-<side>` and `hip-<side>`.
- The patella rows are `knee-<side>`.
- The humerus rows are mostly `upper-arm-<side>`.
- The calcaneus rows are `foot-<side>`.
- Each side matches the part's name.

- [ ] **Step 8: Commit**

```bash
git branch --show-current   # must print feat/3d-body-chart
git add scripts/build-body-model.ts tests/lib/body-chart-3d-manifest.test.ts public/models/body-chart docs/body-chart-3d-mapping.md package.json package-lock.json .gitignore
git commit -m "feat(body-chart-3d): build the 3D body model from BodyParts3D

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Model loader and 3D support check

**Files:**
- Create: `lib/body-model-loader.ts`
- Modify: `tests/setup.ts`
- Test: `tests/lib/body-model-loader.test.ts` (node env), `tests/lib/body-model-support.test.ts` (jsdom)

**Interfaces:**
- Consumes (from Task 2): `BODY_MODEL_DIR`, `readChunk`, `writeChunk` (tests), `BodyModelManifest`, `ChunkArrays`.
- Produces:
  - `interface BodyModel { manifest: BodyModelManifest; chunks: ChunkArrays[] }`
  - `loadBodyModel(): Promise<BodyModel>` (memoised; a failed load is retried on the next call)
  - `onBodyModelProgress(listener: (loadedBytes: number, totalBytes: number) => void): () => void`
  - `canUse3D(): boolean` (cached)
  - `prefetchBodyModel(): void`
  - `resetBodyModelForTests(): void`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/body-model-loader.test.ts`:

```ts
// @vitest-environment node
import { gzipSync } from "node:zlib";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { writeChunk, type BodyModelManifest } from "@/lib/body-model-format";
import { loadBodyModel, onBodyModelProgress, resetBodyModelForTests } from "@/lib/body-model-loader";

const chunkBytes = writeChunk({
  positions: new Int16Array([0, 0, 0, 100, 0, 0, 0, 100, 0]),
  normals: new Int8Array([0, 0, 127, 0, 0, 127, 0, 0, 127]),
  regions: new Uint8Array([0, 1, 2]),
  indices: new Uint16Array([0, 1, 2]),
});
const gz = gzipSync(chunkBytes);
const manifest: BodyModelManifest = {
  version: 1,
  source: "test",
  triangles: 1,
  regions: ["head-jaw", "neck", "upper-back"],
  systems: ["skeletal", "muscular", "connective"],
  parts: [{ name: "Test", system: 0, chunk: 0, firstVertex: 0, vertexCount: 3, firstIndex: 0, indexCount: 3 }],
  chunks: [{ file: "chunk-0.bin.gz", bytes: chunkBytes.length, gzipBytes: gz.length, vertexCount: 3, indexCount: 3 }],
};

function mockFetch(fail = false) {
  return vi.fn(async (url: string) => {
    if (fail) return new Response("nope", { status: 500 });
    if (url.endsWith("/manifest.json")) return new Response(JSON.stringify(manifest));
    if (url.endsWith("/chunk-0.bin.gz")) return new Response(new Uint8Array(gz));
    return new Response("missing", { status: 404 });
  });
}

beforeEach(() => resetBodyModelForTests());
afterEach(() => vi.unstubAllGlobals());

describe("loadBodyModel", () => {
  it("downloads, gunzips and decodes the model", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const model = await loadBodyModel();
    expect(model.manifest.regions).toEqual(["head-jaw", "neck", "upper-back"]);
    expect([...model.chunks[0].regions]).toEqual([0, 1, 2]);
    expect([...model.chunks[0].indices]).toEqual([0, 1, 2]);
  });

  it("downloads once however many times it is asked", async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);
    await Promise.all([loadBodyModel(), loadBodyModel()]);
    await loadBodyModel();
    expect(fetchMock).toHaveBeenCalledTimes(2); // manifest + one chunk
  });

  it("retries after a failed download", async () => {
    vi.stubGlobal("fetch", mockFetch(true));
    await expect(loadBodyModel()).rejects.toThrow();
    vi.stubGlobal("fetch", mockFetch());
    await expect(loadBodyModel()).resolves.toBeTruthy();
  });

  it("reports progress in compressed bytes", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const progress = vi.fn();
    const off = onBodyModelProgress(progress);
    await loadBodyModel();
    off();
    expect(progress).toHaveBeenLastCalledWith(gz.length, gz.length);
  });
});
```

Create `tests/lib/body-model-support.test.ts`:

```ts
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { canUse3D, resetBodyModelForTests } from "@/lib/body-model-loader";

beforeEach(() => {
  resetBodyModelForTests();
  vi.stubGlobal("DecompressionStream", class {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("canUse3D", () => {
  it("is false without WebGL", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null as never);
    expect(canUse3D()).toBe(false);
  });

  it("is true with WebGL", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as never);
    expect(canUse3D()).toBe(true);
  });

  it("is false when the browser asks to save data", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as never);
    vi.stubGlobal("navigator", { connection: { saveData: true } });
    expect(canUse3D()).toBe(false);
  });

  it("is false without DecompressionStream", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as never);
    vi.stubGlobal("DecompressionStream", undefined);
    expect(canUse3D()).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/lib/body-model-loader.test.ts tests/lib/body-model-support.test.ts`
Expected: FAIL, "Failed to resolve import "@/lib/body-model-loader"".

- [ ] **Step 3: Write the implementation**

Create `lib/body-model-loader.ts`:

```ts
// lib/body-model-loader.ts
// Downloads and decodes the 3D body-chart model once per page load and shares
// it. The booking flow prefetches it on the service step, so the assessment's
// 3D chart usually opens instantly. Also decides whether this browser should
// get the 3D chart at all.

import { BODY_MODEL_DIR, readChunk, type BodyModelManifest, type ChunkArrays } from "@/lib/body-model-format";

export interface BodyModel {
  manifest: BodyModelManifest;
  chunks: ChunkArrays[];
}
type ProgressListener = (loadedBytes: number, totalBytes: number) => void;

let pending: Promise<BodyModel> | null = null;
let loadedBytes = 0;
let totalBytes = 0;
const listeners = new Set<ProgressListener>();
let support: boolean | null = null;

// Static hosts may serve .gz with or without Content-Encoding; fetch already
// decodes the former, so check the gzip magic bytes rather than decode twice.
async function readFile(response: Response, expectedBytes: number): Promise<ArrayBuffer> {
  if (!response.ok) throw new Error(`Body model request failed (${response.status})`);
  const payload = await response.arrayBuffer();
  const head = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
  const gzipped = head[0] === 0x1f && head[1] === 0x8b;
  const buffer = gzipped
    ? await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer()
    : payload;
  if (buffer.byteLength !== expectedBytes) throw new Error("Body model file was incomplete");
  return buffer;
}

export function loadBodyModel(): Promise<BodyModel> {
  pending ??= (async () => {
    const res = await fetch(`${BODY_MODEL_DIR}/manifest.json`);
    if (!res.ok) throw new Error(`Body model manifest failed (${res.status})`);
    const manifest = (await res.json()) as BodyModelManifest;
    totalBytes = manifest.chunks.reduce((n, c) => n + c.gzipBytes, 0);
    const chunks = await Promise.all(
      manifest.chunks.map(async (chunk) => {
        const buffer = await readFile(await fetch(`${BODY_MODEL_DIR}/${chunk.file}`), chunk.bytes);
        loadedBytes += chunk.gzipBytes;
        listeners.forEach((listener) => listener(loadedBytes, totalBytes));
        return readChunk(chunk, buffer);
      })
    );
    return { manifest, chunks };
  })().catch((error: unknown) => {
    pending = null;
    loadedBytes = 0;
    totalBytes = 0;
    throw error;
  });
  return pending;
}

export function onBodyModelProgress(listener: ProgressListener): () => void {
  listeners.add(listener);
  if (totalBytes) listener(loadedBytes, totalBytes);
  return () => {
    listeners.delete(listener);
  };
}

function detect(): boolean {
  if (typeof window === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return false;
  if (typeof DecompressionStream === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Whether this browser should get the 3D chart. Cached; stable for useSyncExternalStore. */
export function canUse3D(): boolean {
  support ??= detect();
  return support;
}

/** Start downloading the model at idle time, if this browser will use it. */
export function prefetchBodyModel(): void {
  if (typeof window === "undefined" || !canUse3D()) return;
  const start = () => {
    loadBodyModel().catch(() => {});
  };
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(start, { timeout: 4000 });
  else window.setTimeout(start, 1500);
}

/** Test-only: forget the cached model, listeners and support check. */
export function resetBodyModelForTests(): void {
  pending = null;
  loadedBytes = 0;
  totalBytes = 0;
  listeners.clear();
  support = null;
}
```

- [ ] **Step 4: Silence jsdom's unimplemented canvas in the shared test setup**

In `tests/setup.ts`, inside the existing `if (typeof window !== 'undefined') {` block, after the `window.matchMedia = ...` statement and before the block's closing `}`, add:

```ts
// jsdom has no canvas: getContext() logs "Not implemented" and returns null.
// Return null quietly; components then fall back to their non-WebGL paths.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/lib/body-model-loader.test.ts tests/lib/body-model-support.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 6: Commit**

```bash
git branch --show-current   # must print feat/3d-body-chart
git add lib/body-model-loader.ts tests/lib/body-model-loader.test.ts tests/lib/body-model-support.test.ts tests/setup.ts
git commit -m "feat(body-chart-3d): memoised model loader, prefetch and 3D support check

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Shared toggle rule and selection footer

**Files:**
- Modify: `lib/body-chart.ts` (add `toggleRegion`)
- Create: `components/body-chart-selection.tsx`
- Modify: `components/body-chart.tsx`
- Test: `tests/lib/body-chart.test.ts` (append), `tests/components/body-chart.test.tsx` (must still pass unchanged)

**Interfaces:**
- Consumes: `SOMEWHERE_ELSE`, `regionLabel` from `lib/body-chart.ts`.
- Produces:
  - `toggleRegion(value: string[], key: string): string[]`
  - `BodyChartSelection({ value, onToggle, readOnly? }: { value: string[]; onToggle: (key: string) => void; readOnly?: boolean })`

- [ ] **Step 1: Write the failing test**

Append to `tests/lib/body-chart.test.ts`. Add `toggleRegion` to that file's existing import from `@/lib/body-chart`, then add this `describe` block at the end of the file:

```ts
describe("toggleRegion", () => {
  it("adds and removes an area", () => {
    expect(toggleRegion([], "neck")).toEqual(["neck"]);
    expect(toggleRegion(["neck", "knee-left"], "neck")).toEqual(["knee-left"]);
  });

  it("'somewhere-else' replaces every area, and any area replaces 'somewhere-else'", () => {
    expect(toggleRegion(["neck"], "somewhere-else")).toEqual(["somewhere-else"]);
    expect(toggleRegion(["somewhere-else"], "somewhere-else")).toEqual([]);
    expect(toggleRegion(["somewhere-else"], "neck")).toEqual(["neck"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/lib/body-chart.test.ts`
Expected: FAIL, `toggleRegion is not a function` (or an import error).

- [ ] **Step 3: Implement `toggleRegion`**

In `lib/body-chart.ts`, add directly after the `regionClinical` function:

```ts
/** The chart's toggle rule: "somewhere-else" is exclusive with every real area. */
export function toggleRegion(value: string[], key: string): string[] {
  if (key === SOMEWHERE_ELSE) return value.includes(SOMEWHERE_ELSE) ? [] : [SOMEWHERE_ELSE];
  const next = new Set(value.filter((k) => k !== SOMEWHERE_ELSE));
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return [...next];
}
```

- [ ] **Step 4: Create the shared footer**

Create `components/body-chart-selection.tsx`:

```tsx
// components/body-chart-selection.tsx
// The "somewhere else" toggle and the selected-area chips, shared by the flat
// (components/body-chart.tsx) and 3D (components/body-chart-3d.tsx) charts.

import { SOMEWHERE_ELSE, regionLabel } from "@/lib/body-chart";

interface Props {
  value: string[];
  onToggle: (key: string) => void;
  readOnly?: boolean;
}

export function BodyChartSelection({ value, onToggle, readOnly = false }: Props) {
  return (
    <>
      {!readOnly && (
        <button
          type="button"
          className="body-chart__elsewhere"
          aria-pressed={value.includes(SOMEWHERE_ELSE)}
          onClick={() => onToggle(SOMEWHERE_ELSE)}
        >
          Somewhere else / not sure
        </button>
      )}

      {value.length > 0 && (
        <ul className="body-chart__chips" aria-label="Selected areas">
          {value.map((key) => {
            const label = regionLabel(key);
            return (
              <li key={key} className="body-chart__chip">
                {label}
                {!readOnly && (
                  <button type="button" aria-label={`Remove ${label}`} onClick={() => onToggle(key)}>
                    ×
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
```

- [ ] **Step 5: Use both in the flat chart**

In `components/body-chart.tsx`:

1. Change the import from `@/lib/body-chart` to:

```ts
import {
  BODY_REGIONS,
  REGION_MUSCLES,
  regionClinical,
  regionLabel,
  toggleRegion,
  type ChartView,
} from "@/lib/body-chart";
import { BodyChartSelection } from "@/components/body-chart-selection";
```

2. Replace the whole `toggle` function with:

```ts
  function toggle(key: string) {
    if (readOnly || !onChange) return;
    onChange(toggleRegion(value, key));
  }
```

3. Delete the line `const chips = value.map((k) => ({ key: k, label: regionLabel(k) }));`

4. Replace everything from `{!readOnly && (` that opens the `body-chart__elsewhere` button, through the closing `)}` of the `body-chart__chips` list, with:

```tsx
      <BodyChartSelection value={value} readOnly={readOnly} onToggle={toggle} />
```

The `selected` memo stays: the SVG regions still use it.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/lib/body-chart.test.ts tests/components/body-chart.test.tsx tests/components/admin-assessment-review.test.tsx`
Expected: PASS (the flat chart tests are unchanged and still green).

- [ ] **Step 7: Commit**

```bash
git branch --show-current   # must print feat/3d-body-chart
git add lib/body-chart.ts components/body-chart-selection.tsx components/body-chart.tsx tests/lib/body-chart.test.ts
git commit -m "refactor(body-chart): share the toggle rule and selection footer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 3D viewer component

**Files:**
- Create: `components/body-chart-3d.tsx`
- Modify: `package.json`, `package-lock.json` (add `three`, `@types/three`)
- Modify: `app/globals.css`

**Interfaces:**
- Consumes:
  - From Task 2: `NO_REGION`, `POSITION_SCALE`, `baseColors`, `paintColors`, `partForFace`, `ModelPart`.
  - From Task 4: `loadBodyModel`, `onBodyModelProgress`, `BodyModel`.
  - From Task 5: `toggleRegion`, `BodyChartSelection`.
  - `regionLabel`.
- Produces: `BodyChart3D({ value, onChange, onReady?, onError? }: { value: string[]; onChange: (next: string[]) => void; onReady?: () => void; onError?: () => void })`

This task has no jsdom unit test: WebGL can't run in jsdom. Its behaviour is checked in Task 9's browser verification. Its fallback paths are covered by Task 7's picker tests.

- [ ] **Step 1: Add three.js**

Run: `npm install --no-audit --no-fund three && npm install --no-audit --no-fund --save-dev @types/three`
Expected: `three` appears under `dependencies` and `@types/three` under `devDependencies` in `package.json`.

- [ ] **Step 2: Write the component**

Create `components/body-chart-3d.tsx`:

```tsx
"use client";

// components/body-chart-3d.tsx
// Rotatable 3D body (BodyParts3D muscles over skeleton) for marking where it
// hurts. Every vertex carries one of the 31 areas from lib/body-chart.ts
// (baked in by scripts/build-body-model.ts), so a tap selects the area under
// the finger and the whole area is tinted — same saved keys as the flat chart.
// three.js is imported inside the effect so it only downloads on this step.
// Fallback and the accessible route live in components/body-chart-picker.tsx.

import { useEffect, useRef, useState } from "react";
import type { BufferAttribute, Mesh } from "three";
import type { OrbitControls as OrbitControlsType } from "three/examples/jsm/controls/OrbitControls.js";
import { BodyChartSelection } from "@/components/body-chart-selection";
import { regionLabel, toggleRegion } from "@/lib/body-chart";
import { loadBodyModel, onBodyModelProgress, type BodyModel } from "@/lib/body-model-loader";
import {
  NO_REGION,
  POSITION_SCALE,
  baseColors,
  paintColors,
  partForFace,
  type ModelPart,
} from "@/lib/body-model-format";

type Three = typeof import("three");
type View = "front" | "back" | "left" | "right";

// Azimuths: the body faces +Z and its left side is +X.
const VIEWS: { id: View; label: string; aria: string; azimuth: number }[] = [
  { id: "front", label: "Front", aria: "Front view", azimuth: 0 },
  { id: "back", label: "Back", aria: "Back view", azimuth: Math.PI },
  { id: "left", label: "Left", aria: "Your left side", azimuth: Math.PI / 2 },
  { id: "right", label: "Right", aria: "Your right side", azimuth: -Math.PI / 2 },
];
const TARGET_Y = 0.87; // metres, about mid-height
const FRAME_HEIGHT = 1.85; // metres: body plus headroom
const FRAME_WIDTH = 0.9; // metres: arms at rest
const FOV = 30;
const TAP_SLOP_PX = 8;
const HOVER_THROTTLE_MS = 80;

interface Hit {
  region: number;
  part: ModelPart | undefined;
}

interface Stage {
  setView(view: View): void;
  paint(selected: ReadonlySet<number>, hover: number | null): void;
  dispose(): void;
}

interface Handlers {
  onTap(hit: Hit): void;
  onHover(hit: Hit | null): void;
  onContextLost(): void;
}

function displayName(part: ModelPart | undefined): string {
  if (!part) return "";
  const name = part.name.replace(/\b(left|right)\b ?/gi, "").trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function createStage(
  THREE: Three,
  OrbitControls: typeof OrbitControlsType,
  host: HTMLDivElement,
  model: BodyModel,
  handlers: Handlers
): Stage {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 20);
  camera.position.set(0, TARGET_Y, 4);
  scene.add(camera);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b2a6, 1.3));
  // Key light rides with the camera, so every view is lit the same way.
  const key = new THREE.DirectionalLight(0xfffaf4, 1.8);
  key.position.set(-1.5, 2.5, 1);
  camera.add(key);

  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.04 });
  const partsByChunk = model.manifest.chunks.map((_, i) => model.manifest.parts.filter((p) => p.chunk === i));
  const meshes: Mesh[] = [];
  const colourData: { attr: BufferAttribute; colors: Uint8Array; base: Uint8Array; regions: Uint8Array }[] = [];
  model.chunks.forEach((chunk, i) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(chunk.positions, 3, true));
    geometry.setAttribute("normal", new THREE.BufferAttribute(chunk.normals, 3, true));
    const base = baseColors(partsByChunk[i], model.manifest.systems, chunk.regions.length);
    const colors = base.slice();
    const attr = new THREE.BufferAttribute(colors, 3, true);
    geometry.setAttribute("color", attr);
    geometry.setIndex(new THREE.BufferAttribute(chunk.indices, 1));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(POSITION_SCALE);
    mesh.userData.chunk = i;
    scene.add(mesh);
    meshes.push(mesh);
    colourData.push({ attr, colors, base, regions: chunk.regions });
  });

  let frame = 0;
  const render = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      renderer.render(scene, camera);
    });
  };

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, TARGET_Y, 0);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = Math.PI * 0.42;
  controls.maxPolarAngle = Math.PI * 0.58;
  controls.rotateSpeed = 0.7;
  controls.addEventListener("change", render);
  // Vertical swipes keep scrolling the page; sideways drags turn the body.
  canvas.style.touchAction = "pan-y";

  let distance = 4;
  const fit = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    distance = Math.max(FRAME_HEIGHT / 2 / tanHalf, FRAME_WIDTH / 2 / (tanHalf * camera.aspect));
    const dir = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(dir, distance);
    camera.updateProjectionMatrix();
    controls.update();
    render();
  };
  const observer = new ResizeObserver(fit);
  observer.observe(host);
  fit();

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (clientX: number, clientY: number): Hit | null => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (!hit?.face || hit.faceIndex == null) return null;
    const i = hit.object.userData.chunk as number;
    const region = colourData[i].regions[hit.face.a];
    if (region === NO_REGION) return null;
    return { region, part: partForFace(partsByChunk[i], hit.faceIndex) };
  };

  let down: { x: number; y: number; id: number } | null = null;
  let hoverTimer = 0;
  const onPointerDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!down || down.id !== e.pointerId) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > TAP_SLOP_PX) return;
    const hit = pick(e.clientX, e.clientY);
    if (hit) handlers.onTap(hit);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || e.buttons || hoverTimer) return;
    hoverTimer = window.setTimeout(() => {
      hoverTimer = 0;
    }, HOVER_THROTTLE_MS);
    handlers.onHover(pick(e.clientX, e.clientY));
  };
  const onPointerLeave = () => handlers.onHover(null);
  const onContextLost = (e: Event) => {
    e.preventDefault();
    handlers.onContextLost();
  };
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("webglcontextlost", onContextLost);

  return {
    setView(view) {
      const azimuth = VIEWS.find((v) => v.id === view)?.azimuth ?? 0;
      camera.position.set(
        controls.target.x + Math.sin(azimuth) * distance,
        controls.target.y,
        controls.target.z + Math.cos(azimuth) * distance
      );
      controls.update();
      render();
    },
    paint(selected, hover) {
      for (const d of colourData) {
        paintColors(d.colors, d.base, d.regions, selected, hover);
        d.attr.needsUpdate = true;
      }
      render();
    },
    dispose() {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(hoverTimer);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      controls.dispose();
      meshes.forEach((m) => m.geometry.dispose());
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  onReady?: () => void;
  onError?: () => void;
}

export function BodyChart3D({ value, onChange, onReady, onError }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Stage | null>(null);
  const latest = useRef({ value, onChange, onReady, onError });
  const [regions, setRegions] = useState<string[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [view, setView] = useState<View>("front");
  const [hover, setHover] = useState<Hit | null>(null);
  const [tip, setTip] = useState<Hit | null>(null);
  const [announce, setAnnounce] = useState("");

  useEffect(() => {
    latest.current = { value, onChange, onReady, onError };
  });

  useEffect(() => onBodyModelProgress((loaded, total) => setProgress(total ? loaded / total : 0)), []);

  useEffect(() => {
    let disposed = false;
    let stage: Stage | null = null;
    (async () => {
      try {
        const [THREE, { OrbitControls }, model] = await Promise.all([
          import("three"),
          import("three/examples/jsm/controls/OrbitControls.js"),
          loadBodyModel(),
        ]);
        const host = stageRef.current;
        if (disposed || !host) return;
        stage = createStage(THREE, OrbitControls, host, model, {
          onTap(hit) {
            const key = model.manifest.regions[hit.region];
            const next = toggleRegion(latest.current.value, key);
            latest.current.onChange(next);
            setTip(hit);
            setAnnounce(`${regionLabel(key)} ${next.includes(key) ? "selected" : "removed"}`);
          },
          onHover(hit) {
            setHover((prev) => (prev?.region === hit?.region && prev?.part === hit?.part ? prev : hit));
          },
          onContextLost() {
            latest.current.onError?.();
          },
        });
        apiRef.current = stage;
        setRegions(model.manifest.regions);
        latest.current.onReady?.();
      } catch (error) {
        console.error("3D body chart failed to load", error);
        if (!disposed) latest.current.onError?.();
      }
    })();
    return () => {
      disposed = true;
      stage?.dispose();
      apiRef.current = null;
    };
  }, []);

  const hoverRegion = hover?.region ?? null;
  useEffect(() => {
    if (!regions) return;
    const index = new Map(regions.map((k, i) => [k, i]));
    const selected = new Set(value.map((k) => index.get(k)).filter((i): i is number => i !== undefined));
    apiRef.current?.paint(selected, hoverRegion);
  }, [regions, value, hoverRegion]);

  useEffect(() => {
    if (regions) apiRef.current?.setView(view);
  }, [regions, view]);

  const shown = hover ?? tip;

  return (
    <div className="body-chart body-chart-3d">
      <div className="body-chart__toolbar">
        <div className="body-chart__views" role="group" aria-label="Body view">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className="body-chart__view-btn"
              aria-pressed={view === v.id}
              aria-label={v.aria}
              disabled={!regions}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={stageRef}
        className="body-chart-3d__stage"
        role="img"
        aria-label="3D body. Drag sideways to turn it, and tap where you feel it."
      >
        {!regions && (
          <div className="body-chart-3d__loading">
            <span>Loading the 3D body…</span>
            <progress max={1} value={progress} />
          </div>
        )}
      </div>

      <p className="body-chart-3d__hint">Drag sideways to turn the body. Tap where you feel it.</p>

      {shown && regions ? (
        <div className="body-chart__tooltip" role="status">
          <strong>{regionLabel(regions[shown.region])}</strong>
          {shown.part ? <span>{displayName(shown.part)}</span> : null}
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <BodyChartSelection value={value} onToggle={(key) => onChange(toggleRegion(value, key))} />

      <p className="body-chart-3d__credit">
        Anatomy: BodyParts3D © DBCLS,{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY 4.0
        </a>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Add the styles**

In `app/globals.css`, find the end of the body chart section: run `grep -n '^\.body-chart' app/globals.css | tail -1` and locate that rule's closing `}`. Insert this block directly after it:

```css
/* ── 3D body chart (components/body-chart-3d.tsx, body-chart-picker.tsx) ── */
.body-chart-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
}
.body-chart-picker__simple {
  align-self: flex-end;
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-decoration: underline;
  cursor: pointer;
}
.body-chart-3d .body-chart__view-btn {
  padding: 0.45rem 0.95rem;
}
.body-chart-3d .body-chart__view-btn:disabled {
  cursor: default;
  opacity: 0.6;
}
.body-chart-3d__stage {
  position: relative;
  width: 100%;
  max-width: 380px;
  aspect-ratio: 3 / 4;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: radial-gradient(ellipse at 50% 38%, #fff 0%, var(--color-surface) 72%);
  overflow: hidden;
}
.body-chart-3d__stage canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: pointer;
  touch-action: pan-y;
}
.body-chart-3d__loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.body-chart-3d__loading progress {
  width: 160px;
  accent-color: var(--color-primary);
}
.body-chart-3d__hint {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  text-align: center;
}
.body-chart-3d__credit {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.68rem;
}
.body-chart-3d__credit a {
  color: inherit;
}
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint`
Expected:
- `tsc` exits 0.
- `npm run lint` reports no errors in `components/body-chart-3d.tsx`. Warnings elsewhere that already existed on master are fine.
- If `three/examples/jsm/controls/OrbitControls.js` fails to resolve types, switch both the type import and the dynamic import to `three/addons/controls/OrbitControls.js`.

- [ ] **Step 5: Commit**

```bash
git branch --show-current   # must print feat/3d-body-chart
git add components/body-chart-3d.tsx app/globals.css package.json package-lock.json
git commit -m "feat(body-chart-3d): three.js body chart viewer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 3D-or-flat picker

**Files:**
- Create: `components/body-chart-picker.tsx`
- Test: `tests/components/body-chart-picker.test.tsx`

**Interfaces:**
- Consumes:
  - From Task 6: `BodyChart3D`.
  - From Task 4: `canUse3D`.
  - `BodyChart` from `components/body-chart.tsx`.
- Produces:
  - `BodyChartPicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void })`
  - `LOAD_TIMEOUT_MS = 10_000`

- [ ] **Step 1: Write the failing test**

Create `tests/components/body-chart-picker.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

vi.mock("@/lib/body-model-loader", () => ({ canUse3D: vi.fn(() => true) }));
vi.mock("@/components/body-chart-3d", () => ({
  BodyChart3D: ({ onReady, onError }: { onReady?: () => void; onError?: () => void }) => (
    <div data-testid="chart-3d">
      <button type="button" onClick={() => onReady?.()}>
        stub ready
      </button>
      <button type="button" onClick={() => onError?.()}>
        stub error
      </button>
    </div>
  ),
}));

import { canUse3D } from "@/lib/body-model-loader";
import { BodyChartPicker, LOAD_TIMEOUT_MS } from "@/components/body-chart-picker";

const flatChart = () => screen.queryByRole("group", { name: /body chart, front view/i });

beforeEach(() => {
  vi.mocked(canUse3D).mockReturnValue(true);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("BodyChartPicker", () => {
  it("shows the flat chart when 3D isn't supported", () => {
    vi.mocked(canUse3D).mockReturnValue(false);
    render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    expect(flatChart()).toBeInTheDocument();
    expect(screen.queryByTestId("chart-3d")).not.toBeInTheDocument();
  });

  it("shows the 3D chart when supported", () => {
    render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    expect(screen.getByTestId("chart-3d")).toBeInTheDocument();
    expect(flatChart()).not.toBeInTheDocument();
  });

  it("falls back to the flat chart if the 3D chart fails", () => {
    render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "stub error" }));
    expect(flatChart()).toBeInTheDocument();
  });

  it("falls back to the flat chart if 3D isn't ready in time", () => {
    vi.useFakeTimers();
    render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    act(() => {
      vi.advanceTimersByTime(LOAD_TIMEOUT_MS);
    });
    expect(flatChart()).toBeInTheDocument();
  });

  it("keeps the 3D chart once it is ready, even after the timeout", () => {
    vi.useFakeTimers();
    render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "stub ready" }));
    act(() => {
      vi.advanceTimersByTime(LOAD_TIMEOUT_MS * 2);
    });
    expect(screen.getByTestId("chart-3d")).toBeInTheDocument();
  });

  it("switches to the simple chart on request and stays there", () => {
    render(<BodyChartPicker value={["neck"]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /use simple chart instead/i }));
    expect(flatChart()).toBeInTheDocument();
    expect(screen.queryByTestId("chart-3d")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /use simple chart instead/i })).not.toBeInTheDocument();
  });

  it("passes selections through from the flat chart", () => {
    vi.mocked(canUse3D).mockReturnValue(false);
    const onChange = vi.fn();
    render(<BodyChartPicker value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Neck" }));
    expect(onChange).toHaveBeenCalledWith(["neck"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/body-chart-picker.test.tsx`
Expected: FAIL, "Failed to resolve import "@/components/body-chart-picker"".

- [ ] **Step 3: Write the implementation**

Create `components/body-chart-picker.tsx`:

```tsx
"use client";

// components/body-chart-picker.tsx
// Shows the 3D body chart, falling back silently to the flat BodyChart when
// 3D can't run here (no WebGL, data saver on), the model fails to load, or it
// isn't ready within LOAD_TIMEOUT_MS. The "simple chart" link is also the
// keyboard and screen-reader route. Once on the flat chart a patient is never
// switched back mid-task. Both charts save the same area keys.

import { useEffect, useState, useSyncExternalStore } from "react";
import { BodyChart } from "@/components/body-chart";
import { BodyChart3D } from "@/components/body-chart-3d";
import { canUse3D } from "@/lib/body-model-loader";

export const LOAD_TIMEOUT_MS = 10_000;

const noSubscribe = () => () => {};
const unknownOnServer = () => null;

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export function BodyChartPicker({ value, onChange }: Props) {
  // null while server-rendering/hydrating; the browser check runs client-side only.
  const supported = useSyncExternalStore<boolean | null>(noSubscribe, canUse3D, unknownOnServer);
  const [flat, setFlat] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supported || flat || ready) return;
    const timer = window.setTimeout(() => setFlat(true), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [supported, flat, ready]);

  if (supported === false || flat) return <BodyChart value={value} onChange={onChange} />;

  return (
    <div className="body-chart-picker">
      <button type="button" className="body-chart-picker__simple" onClick={() => setFlat(true)}>
        Use simple chart instead
      </button>
      {supported ? (
        <BodyChart3D value={value} onChange={onChange} onReady={() => setReady(true)} onError={() => setFlat(true)} />
      ) : (
        <div className="body-chart-3d__stage" aria-hidden="true" />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/components/body-chart-picker.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git branch --show-current   # must print feat/3d-body-chart
git add components/body-chart-picker.tsx tests/components/body-chart-picker.test.tsx
git commit -m "feat(body-chart-3d): picker with silent flat-chart fallback

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Wire into the assessment and prefetch in the booking flow

**Files:**
- Modify: `components/assessment-wizard.tsx` (the `BodyChart` import on line 12 and its usage at about line 675)
- Modify: `components/booking-flow.tsx` (imports + one effect)

**Interfaces:**
- Consumes:
  - From Task 7: `BodyChartPicker`.
  - From Task 4: `prefetchBodyModel`.
- Produces: nothing new.

- [ ] **Step 1: Swap the chart in the wizard**

In `components/assessment-wizard.tsx`:

1. Replace `import { BodyChart } from "@/components/body-chart";` with `import { BodyChartPicker } from "@/components/body-chart-picker";`.
2. Replace `<BodyChart value={state.regions} onChange={(regions) => patch({ regions })} />` with `<BodyChartPicker value={state.regions} onChange={(regions) => patch({ regions })} />`.
3. Confirm the file has no other references: `grep -n "BodyChart\b" components/assessment-wizard.tsx` should print nothing.

- [ ] **Step 2: Prefetch on the booking flow's first step**

In `components/booking-flow.tsx`, add the import next to the other `@/lib/` imports:

```ts
import { prefetchBodyModel } from "@/lib/body-model-loader";
```

Then add this effect directly after the `useEffect` that reads `?service=` / `?visit=` from `window.location.search` (it starts with `if (typeof window === "undefined") return;`):

```ts
  // Warm the 3D body chart the assessment shows on the next step.
  useEffect(() => {
    prefetchBodyModel();
  }, []);
```

- [ ] **Step 3: Run the whole suite, type-check and lint**

Run: `npm run test:run`
Expected: all tests pass. jsdom has no WebGL, so the wizard and booking tests get the flat chart, as before.

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint`
Expected: exit 0, with no new lint errors.

- [ ] **Step 4: Production build smoke**

The build needs the gitignored env files. Copy them into the worktree first, if they aren't there yet:

```bash
cp -n /Users/iamkjn/Documents/Playground/.env.development /Users/iamkjn/Documents/Playground/.env.production .
```

Run: `rm -rf .next && npm run build`
Expected:
- The build succeeds.
- `three` is not in the shared first-load chunks. Check with `grep -l "WebGLRenderer" .next/static/chunks/*.js | head`: it should list only async chunks (numeric or hashed names), not `main-*`, `framework-*` or `app/layout-*`.

- [ ] **Step 5: Commit**

```bash
git branch --show-current   # must print feat/3d-body-chart
git add components/assessment-wizard.tsx components/booking-flow.tsx
git commit -m "feat(assessment): use the 3D body chart, prefetched from the booking flow

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Verify in the local preview (controller, not a subagent)

The controller does this task directly with the Browser pane tools. It needs real WebGL and judgement about how it looks.

- [ ] **Step 1: Prepare env files**

Copy the gitignored env files into the worktree:

```bash
cp /Users/iamkjn/Documents/Playground/.env.development /Users/iamkjn/Documents/Playground/.env.production /Users/iamkjn/Documents/Playground/.claude/worktrees/3d-body-chart/
```

- [ ] **Step 2: Start the dev server**

Start the worktree's dev server: `preview_start` with name `Next.js (web)`. The worktree has its own `.claude/launch.json`. Confirm in `preview_logs` that it is serving from the worktree path.

- [ ] **Step 3: Check the model files**

Fetch `/models/body-chart/manifest.json` with `javascript_tool`. Check it's JSON with 31 `regions`, and that `chunk-0.bin.gz` returns 200.

- [ ] **Step 4: Reach the body chart**

1. Open `/book` and choose "Initial assessment".
2. On the time step, pick any slot and fill details using the test account `krunalnayak49@gmail.com`.
3. Continue until the assessment wizard's "Where do you feel it?" section shows.
4. Do **not** submit the booking and do **not** pay.

- [ ] **Step 5: Check behaviour**

Check each of these with screenshots:
- The 3D body loads; the loading bar then the model appears.
- Tapping the left knee, right shoulder, lower back (Back view), left foot, right hand, neck, the trunk's left side, and the right buttock (Back view) each adds the correct chip. Left and right must match the patient's own sides.
- The selected area tints sky-blue.
- The tooltip shows the plain area name and the anatomical name.
- "Somewhere else / not sure" clears the areas, and chip × removes one.
- The Front / Back / Left / Right buttons turn the body.
- Drag rotates the body.
- At mobile size (`resize_window` preset mobile, then reload), a vertical swipe on the body scrolls the page and a sideways drag turns it.
- "Use simple chart instead" shows the flat chart.
- `read_console_messages` with `onlyErrors` shows nothing new.

- [ ] **Step 6: Tune if needed**

- If an area boundary is visibly wrong, adjust the constants in `lib/body-chart-3d-regions.ts` (`Y`, `Z_BACK`, `Z_BUTTOCK`, `SIDE_X`) or the name lists, then:
  - re-run `npm run build:body-model`;
  - re-run `npx vitest run tests/lib/body-chart-3d-regions.test.ts tests/lib/body-chart-3d-manifest.test.ts`;
  - reload the preview.
- If colours or lighting look off, adjust `PALETTE` in `lib/body-model-format.ts` (update its test expectations) or the lights in `createStage`.

Commit any tuning:

```bash
git branch --show-current   # must print feat/3d-body-chart
git add lib/body-chart-3d-regions.ts lib/body-model-format.ts components/body-chart-3d.tsx public/models/body-chart docs/body-chart-3d-mapping.md tests/lib
git commit -m "fix(body-chart-3d): tune areas and look after browser check

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Clean up**

Reset the viewport (`resize_window` preset desktop), stop the preview server, then run `rm -rf .next`. That stops a dev build cache feeding the deploy build.

---

### Task 10: Deploy to the DEV site only (controller)

- [ ] **Step 1: Pre-flight**

```bash
cd /Users/iamkjn/Documents/Playground/.claude/worktrees/3d-body-chart
git branch --show-current                      # feat/3d-body-chart
git status --short                             # clean (env files are gitignored)
test ! -L node_modules && echo real-node_modules
grep -q '^NEXT_PUBLIC_FIREBASE_PROJECT_ID=physioonclick-dev$' .env.development && echo dev-env-ok
git fetch -q origin && git log --oneline -1 origin/master && git merge-base --is-ancestor origin/master HEAD && echo based-on-latest-master
```

If `based-on-latest-master` doesn't print, master moved. Stop and ask the owner before rebasing.

- [ ] **Step 2: Check what dev currently serves**

Another session may have deployed dev from a branch with work that isn't on master:

```bash
npx wrangler deployments list --env dev 2>&1 | tail -15
```

- Use `ListAgents` to see other active sessions.
- If the latest dev deployment is under 24 hours old and came from someone else, stop and ask the owner before overwriting it.

- [ ] **Step 3: Deploy to dev**

```bash
rm -rf .next .open-next
npm run deploy:dev
```

Expected:
- The output shows `firebase project : physioonclick-dev` and `site url : https://dev.physioonclick.co.uk`.
- `verify-opennext-build` passes.
- The deploy target is `physioonclick-dev`.
- Record the new dev version ID.

**Never** run `npm run deploy`.

- [ ] **Step 4: Smoke-test dev**

```bash
for p in / /book /models/body-chart/manifest.json /models/body-chart/chunk-0.bin.gz /pricing; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "https://dev.physioonclick.co.uk$p")" "$p"; done
```

Expected: every line starts with `200`. Then, in the Browser pane, open `https://dev.physioonclick.co.uk/book` and reach the body chart as in Task 9 Step 4. Confirm the 3D body loads and a tap adds a chip. Screenshot it for the owner.

- [ ] **Step 5: Confirm prod is untouched**

```bash
npx wrangler deployments list 2>&1 | tail -6
```

The newest prod deployment must be the same one as before this task. If anything changed, stop and tell the owner immediately.

- [ ] **Step 6: Rollback reference**

Note the previous dev version ID from Step 2. To roll back: `npx wrangler rollback <previousId> --env dev`.
