// Single source of truth for the stick-figure exercise diagrams.
//
// Both the web component (components/exercise-figure.tsx) and the exercise-plan
// PDF builder (lib/exercise-plan-pdf.ts) render these — the component as SVG,
// the PDF as pdf-lib vector strokes — so the coordinates live here, not in
// either renderer. 64×56 viewBox, y increasing downward (SVG convention); the
// PDF renderer flips y itself.
//
// The first 15 poses are ported verbatim from the mobile app's `_specs` map
// (mobile_app/lib/src/core/widgets/exercise_figure.dart). The rest were added
// for the web catalogue's ankle / shoulder / neck exercises.

export type Pose =
  | "legRaise"
  | "kneeExt"
  | "heelSlide"
  | "balance"
  | "bike"
  | "squat"
  | "pendulum"
  | "standing"
  | "neckTurn"
  | "hipStretch"
  | "anklePump"
  | "pelvicTilt"
  | "overheadReach"
  | "catCow"
  | "gripSqueeze"
  | "heelRaise"
  | "calfStretch"
  | "chinTuck"
  | "scapularSet"
  | "bandRotation"
  | "wallSlide"
  | "pushUpPlus";

export type PoseSpec = {
  circles: [number, number, number][]; // cx, cy, r
  segments: [number, number, number, number][]; // x1, y1, x2, y2
};

export const POSE_VIEWBOX = { w: 64, h: 56 } as const;

export const POSE_SPECS: Record<Pose, PoseSpec> = {
  legRaise: {
    circles: [[13, 41, 4.5]],
    segments: [
      [17, 43, 34, 44],
      [34, 44, 49, 45],
      [34, 44, 53, 28],
      [53, 28, 56, 30],
      [9, 48, 55, 48],
    ],
  },
  kneeExt: {
    circles: [[22, 16, 4.5]],
    segments: [
      [18, 47, 18, 21],
      [18, 40, 33, 40],
      [22, 20, 22, 36],
      [22, 36, 33, 37],
      [33, 37, 51, 30],
      [51, 30, 54, 32],
      [22, 25, 30, 34],
    ],
  },
  heelSlide: {
    circles: [[13, 41, 4.5]],
    segments: [
      [17, 43, 33, 44],
      [33, 44, 39, 33],
      [39, 33, 48, 45],
      [33, 44, 51, 45],
      [9, 48, 55, 48],
    ],
  },
  balance: {
    circles: [[32, 11, 5]],
    segments: [
      [32, 16, 32, 33],
      [32, 21, 20, 23],
      [32, 21, 44, 23],
      [32, 33, 30, 48],
      [32, 33, 42, 39],
      [42, 39, 39, 47],
      [24, 49, 36, 49],
    ],
  },
  bike: {
    circles: [
      [17, 43, 8],
      [49, 43, 8],
      [35, 15, 4.5],
    ],
    segments: [
      [17, 43, 33, 43],
      [33, 43, 30, 27],
      [33, 43, 47, 31],
      [27, 26, 35, 26],
      [44, 30, 50, 30],
      [35, 19, 39, 31],
      [35, 22, 47, 30],
      [39, 31, 42, 41],
    ],
  },
  squat: {
    circles: [[28, 12, 5]],
    segments: [
      [28, 17, 33, 30],
      [33, 30, 46, 30],
      [46, 30, 46, 46],
      [33, 30, 29, 46],
      [29, 21, 41, 25],
      [52, 8, 52, 48],
      [22, 48, 52, 48],
    ],
  },
  pendulum: {
    circles: [[28, 13, 5]],
    segments: [
      [28, 18, 40, 30],
      [34, 23, 47, 30],
      [45, 30, 60, 30],
      [48, 30, 48, 46],
      [58, 30, 58, 46],
      [36, 26, 35, 42],
    ],
  },
  standing: {
    circles: [[32, 12, 5]],
    segments: [
      [32, 17, 32, 34],
      [32, 22, 22, 30],
      [32, 22, 42, 30],
      [32, 34, 24, 48],
      [32, 34, 40, 48],
    ],
  },
  neckTurn: {
    circles: [[32, 11, 5]],
    segments: [
      [32, 16, 32, 34],
      [32, 21, 22, 29],
      [32, 21, 42, 29],
      [32, 34, 24, 48],
      [32, 34, 40, 48],
      [28, 9, 36, 13],
    ],
  },
  hipStretch: {
    circles: [[24, 13, 5]],
    segments: [
      [24, 18, 30, 33],
      [30, 33, 44, 30],
      [44, 30, 48, 46],
      [30, 33, 22, 46],
      [16, 40, 30, 33],
      [20, 48, 52, 48],
    ],
  },
  anklePump: {
    circles: [[18, 40, 4.5]],
    segments: [
      [18, 40, 34, 41],
      [34, 41, 34, 46],
      [34, 46, 48, 44],
      [12, 48, 54, 48],
    ],
  },
  pelvicTilt: {
    circles: [[32, 12, 5]],
    segments: [
      [32, 17, 30, 33],
      [30, 33, 22, 48],
      [30, 33, 38, 48],
      [24, 32, 38, 34],
    ],
  },
  overheadReach: {
    circles: [[32, 10, 5]],
    segments: [
      [32, 15, 32, 33],
      [32, 18, 20, 6],
      [32, 18, 44, 6],
      [32, 33, 24, 48],
      [32, 33, 40, 48],
    ],
  },
  catCow: {
    circles: [[16, 30, 4]],
    segments: [
      [16, 34, 32, 26],
      [32, 26, 50, 32],
      [16, 34, 12, 46],
      [50, 32, 54, 46],
      [24, 20, 40, 22],
    ],
  },
  gripSqueeze: {
    circles: [[30, 30, 6]],
    segments: [
      [24, 30, 20, 24],
      [36, 30, 40, 24],
      [24, 32, 20, 38],
      [36, 32, 40, 38],
    ],
  },

  // ── added for the web ankle / shoulder / neck catalogue ────────────────
  heelRaise: {
    // standing, risen onto the toes, with an up-arrow
    circles: [[30, 11, 5]],
    segments: [
      [30, 16, 30, 34],
      [30, 20, 22, 27],
      [30, 20, 38, 27],
      [30, 34, 25, 45],
      [30, 34, 35, 45],
      [23, 45, 27, 48],
      [33, 45, 37, 48],
      [12, 49, 44, 49],
      [50, 45, 50, 30],
      [47, 34, 50, 30],
      [53, 34, 50, 30],
    ],
  },
  calfStretch: {
    // hands on a wall, front knee bent, back leg straight to the heel
    circles: [[32, 14, 5]],
    segments: [
      [12, 6, 12, 50],
      [32, 19, 40, 30],
      [30, 21, 14, 16],
      [34, 25, 14, 26],
      [40, 30, 37, 42],
      [37, 42, 33, 49],
      [40, 30, 52, 47],
      [52, 47, 56, 49],
      [12, 50, 58, 50],
    ],
  },
  chinTuck: {
    // upright seated profile (nose to the right) with a "draw back" arrow
    circles: [[30, 13, 5.5]],
    segments: [
      [30, 18, 30, 40],
      [21, 24, 39, 24],
      [21, 24, 19, 34],
      [39, 24, 41, 34],
      [30, 40, 25, 52],
      [30, 40, 35, 52],
      [35, 13, 37, 13],
      [52, 11, 44, 11],
      [47, 8, 44, 11],
      [47, 14, 44, 11],
    ],
  },
  scapularSet: {
    // back view, forearms drawing in with squeeze arrows toward the spine
    circles: [[32, 11, 5]],
    segments: [
      [32, 16, 32, 40],
      [22, 21, 42, 21],
      [22, 21, 20, 31],
      [20, 31, 26, 33],
      [42, 21, 44, 31],
      [44, 31, 38, 33],
      [32, 40, 27, 52],
      [32, 40, 37, 52],
      [14, 24, 22, 24],
      [18, 21, 22, 24],
      [18, 27, 22, 24],
      [50, 24, 42, 24],
      [46, 21, 42, 24],
      [46, 27, 42, 24],
    ],
  },
  bandRotation: {
    // elbow pinned at the side, forearm rotating out against a band to an anchor
    circles: [[26, 12, 5]],
    segments: [
      [26, 17, 26, 38],
      [26, 23, 26, 31],
      [26, 31, 42, 27],
      [42, 27, 52, 29],
      [52, 25, 52, 33],
      [26, 38, 21, 50],
      [26, 38, 31, 50],
      [12, 50, 46, 50],
      [40, 34, 44, 31],
      [44, 31, 43, 36],
    ],
  },
  wallSlide: {
    // side-on to a wall, both arms raised sliding up its face
    circles: [[26, 13, 5]],
    segments: [
      [50, 6, 50, 52],
      [26, 18, 26, 36],
      [26, 22, 38, 14],
      [38, 14, 46, 10],
      [26, 24, 40, 22],
      [40, 22, 47, 20],
      [26, 36, 21, 50],
      [26, 36, 32, 50],
      [12, 50, 46, 50],
    ],
  },
  pushUpPlus: {
    // plank on the hands with an up-arrow for the extra push at the top
    circles: [[13, 24, 4]],
    segments: [
      [17, 26, 45, 32],
      [45, 32, 55, 44],
      [20, 27, 20, 44],
      [32, 29, 32, 44],
      [12, 44, 58, 44],
      [34, 18, 34, 9],
      [31, 13, 34, 9],
      [37, 13, 34, 9],
    ],
  },
};

export const POSE_NAMES = Object.keys(POSE_SPECS) as Pose[];

/** Infer a pose from an exercise name. Unknown → "standing". Keyword order
 * matters: the most specific phrases are tested first. */
export function poseForName(name: string): Pose {
  const n = name.toLowerCase();
  if (n.includes("heel raise") || n.includes("calf raise") || n.includes("heel drop")) return "heelRaise";
  if (n.includes("calf stretch") || n.includes("gastrocnemius") || n.includes("soleus stretch")) return "calfStretch";
  if (n.includes("chin tuck") || n.includes("deep neck")) return "chinTuck";
  if (n.includes("scapular") || n.includes("shoulder blade") || n.includes("scapula")) return "scapularSet";
  if (n.includes("external rotation") || n.includes("internal rotation")) return "bandRotation";
  if (n.includes("ankle eversion") || n.includes("ankle inversion")) return "bandRotation";
  if (n.includes("wall slide") || n.includes("wall angel")) return "wallSlide";
  if (n.includes("push-up") || n.includes("push up") || n.includes("press-up plus")) return "pushUpPlus";
  if (n.includes("leg raise") || n.includes("straight leg")) return "legRaise";
  if (n.includes("knee ext")) return "kneeExt";
  if (n.includes("heel slide")) return "heelSlide";
  if (n.includes("balance") || n.includes("single leg") || n.includes("single-leg")) return "balance";
  if (n.includes("bike") || n.includes("cycl")) return "bike";
  if (n.includes("squat") || n.includes("sit to stand") || n.includes("sit-to-stand")) return "squat";
  if (n.includes("neck") && (n.includes("rotation") || n.includes("turn"))) return "neckTurn";
  if (n.includes("hip flexor") || n.includes("hip stretch") || n.includes("hamstring stretch")) return "hipStretch";
  if (n.includes("ankle pump") || n.includes("ankle alphabet") || n.includes("ankle circle")) return "anklePump";
  if (n.includes("pelvic tilt")) return "pelvicTilt";
  if (
    n.includes("overhead") ||
    n.includes("press-up") ||
    n.includes("press up") ||
    (n.includes("flexion") && n.includes("shoulder"))
  ) {
    return "overheadReach";
  }
  if (n.includes("cat-cow") || n.includes("cat cow") || n.includes("thoracic rotation")) return "catCow";
  if (n.includes("grip") || n.includes("tendon glide")) return "gripSqueeze";
  if (n.includes("pendulum") || n.includes("shoulder")) return "pendulum";
  return "standing";
}

/** Resolve an optional explicit pose string against the known set, falling
 * back to name inference. Shared by both renderers. */
export function resolvePose(explicit: string | null | undefined, name: string): Pose {
  if (explicit && explicit in POSE_SPECS) return explicit as Pose;
  return poseForName(name);
}
