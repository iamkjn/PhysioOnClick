// Stick-figure exercise diagram — a React/SVG port of the mobile app's
// ExerciseFigure (mobile_app/lib/src/core/widgets/exercise_figure.dart): the
// same 64×56 viewBox, 2.4px round-capped strokes, and pose specs, on a rounded
// accent-soft tile. Pose is inferred from the exercise name; unknown → standing.
//
// Pose coordinates live in lib/exercise-poses.ts so the exercise-plan PDF
// builder renders the exact same figures.

import {
  POSE_SPECS,
  POSE_VIEWBOX,
  resolvePose,
  type Pose,
} from "@/lib/exercise-poses";

export type PoseName = Pose;
export { POSE_NAMES } from "@/lib/exercise-poses";

export function ExerciseFigure({ name, size = 56, pose }: { name: string; size?: number; pose?: string | null }) {
  const spec = POSE_SPECS[resolvePose(pose, name)];
  return (
    <span className="exercise-figure-tile" style={{ width: size, height: size }} aria-hidden="true">
      <svg
        viewBox={`0 0 ${POSE_VIEWBOX.w} ${POSE_VIEWBOX.h}`}
        width="78%"
        height="78%"
        fill="none"
        stroke="var(--primary)"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
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
