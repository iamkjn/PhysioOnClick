// lib/body-chart-3d-regions.ts
// Maps the 3D body model (BodyParts3D via Human Atlas) onto the 31
// patient-facing areas in lib/body-chart.ts. Used at build time by
// scripts/build-body-model.ts, which stores one area per vertex, so the
// browser never runs these rules.
//
// Each part gets a rule from its name: dropped (deep or irrelevant structures
// nobody can tap), one fixed area (skull -> head-jaw), or a body segment (arm,
// leg, trunk, or back for the spine and the structures on it) whose vertices
// are split into areas by height. Splitting per
// vertex rather than per part means a joint area like "Left knee" covers the
// ends of the femur and tibia as well as the patella, so the area lights up
// where the patient tapped.
//
// Coordinates: metres, Y up, +X = the patient's left, +Z = the front.

export type Side = "left" | "right";
export type Segment = "arm" | "leg" | "trunk" | "back";
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

// Spine and the structures on it: always a back area, split by height only.
// The vertebral bodies and the scapula's rib-side face sit in front of
// Z_BACK, so the trunk front/back split would wrongly call them chest/abdomen.
const BACK = /vertebra|^sacrum$|^coccyx$|^(atlas|axis)$|^scapula$|rotator|intertransversari|interspinal|spinalis|longissimus|iliocostalis|levatores costarum|rhomboid|serratus posterior|splenius/;

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
  if (BACK.test(n)) return { kind: "segment", segment: "back" };
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
  if (segment === "back") {
    if (y >= Y.neck) return "neck";
    if (y >= Y.upperBack) return "upper-back";
    if (y >= Y.midBack) return "mid-back";
    return "lower-back";
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
