// Stick-figure exercise diagram — a React/SVG port of the mobile app's
// ExerciseFigure (mobile_app/lib/src/core/widgets/exercise_figure.dart): the
// same 64×56 viewBox, 2.4px round-capped strokes, and pose specs, on a rounded
// accent-soft tile. Pose is inferred from the exercise name; unknown → standing.

type Pose = "legRaise" | "kneeExt" | "heelSlide" | "balance" | "bike" | "squat" | "pendulum" | "standing";

type Spec = {
  circles: [number, number, number][]; // cx, cy, r
  segments: [number, number, number, number][]; // x1, y1, x2, y2
};

// Exact coordinates ported from the mobile _specs map (64×56 viewBox).
const SPECS: Record<Pose, Spec> = {
  legRaise: {
    circles: [[13, 41, 4.5]],
    segments: [[17, 43, 34, 44], [34, 44, 49, 45], [34, 44, 53, 28], [53, 28, 56, 30], [9, 48, 55, 48]],
  },
  kneeExt: {
    circles: [[22, 16, 4.5]],
    segments: [[18, 47, 18, 21], [18, 40, 33, 40], [22, 20, 22, 36], [22, 36, 33, 37], [33, 37, 51, 30], [51, 30, 54, 32], [22, 25, 30, 34]],
  },
  heelSlide: {
    circles: [[13, 41, 4.5]],
    segments: [[17, 43, 33, 44], [33, 44, 39, 33], [39, 33, 48, 45], [33, 44, 51, 45], [9, 48, 55, 48]],
  },
  balance: {
    circles: [[32, 11, 5]],
    segments: [[32, 16, 32, 33], [32, 21, 20, 23], [32, 21, 44, 23], [32, 33, 30, 48], [32, 33, 42, 39], [42, 39, 39, 47], [24, 49, 36, 49]],
  },
  bike: {
    circles: [[17, 43, 8], [49, 43, 8], [35, 15, 4.5]],
    segments: [[17, 43, 33, 43], [33, 43, 30, 27], [33, 43, 47, 31], [27, 26, 35, 26], [44, 30, 50, 30], [35, 19, 39, 31], [35, 22, 47, 30], [39, 31, 42, 41]],
  },
  squat: {
    circles: [[28, 12, 5]],
    segments: [[28, 17, 33, 30], [33, 30, 46, 30], [46, 30, 46, 46], [33, 30, 29, 46], [29, 21, 41, 25], [52, 8, 52, 48], [22, 48, 52, 48]],
  },
  pendulum: {
    circles: [[28, 13, 5]],
    segments: [[28, 18, 40, 30], [34, 23, 47, 30], [45, 30, 60, 30], [48, 30, 48, 46], [58, 30, 58, 46], [36, 26, 35, 42]],
  },
  standing: {
    circles: [[32, 12, 5]],
    segments: [[32, 17, 32, 34], [32, 22, 22, 30], [32, 22, 42, 30], [32, 34, 24, 48], [32, 34, 40, 48]],
  },
};

// Mirrors the mobile _poseFor keyword inference, with two extra keys for the
// web catalogue's names (sit-to-stand ≈ squat, scapular ≈ shoulder/pendulum).
function poseForName(name: string): Pose {
  const n = name.toLowerCase();
  if (n.includes("leg raise") || n.includes("straight leg")) return "legRaise";
  if (n.includes("knee ext")) return "kneeExt";
  if (n.includes("heel slide")) return "heelSlide";
  if (n.includes("balance")) return "balance";
  if (n.includes("bike") || n.includes("cycl")) return "bike";
  if (n.includes("squat") || n.includes("sit to stand")) return "squat";
  if (n.includes("pendulum") || n.includes("flexion") || n.includes("shoulder") || n.includes("scapular")) return "pendulum";
  return "standing";
}

export function ExerciseFigure({ name, size = 56 }: { name: string; size?: number }) {
  const spec = SPECS[poseForName(name)];
  return (
    <span className="exercise-figure-tile" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 56" width="78%" height="78%" fill="none" stroke="var(--primary)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        {spec.circles.map(([cx, cy, r], i) => (
          <circle key={`c${i}`} cx={cx} cy={cy} r={r} />
        ))}
        {spec.segments.map(([x1, y1, x2, y2], i) => (
          <line key={`s${i}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </svg>
    </span>
  );
}
