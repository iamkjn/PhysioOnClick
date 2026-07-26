// lib/face-engine.ts
// Facial-motion judging core for palsy / stroke / elderly rehab.
//
// Sibling of `lib/motion-engine.ts` (which judges body joints). This one works
// on MediaPipe FaceLandmarker output (468/478 points) and adds the thing body
// pose can't give you: left-vs-right SYMMETRY, the primary clinical signal for
// facial droop (Bell's palsy, stroke). It still counts reps, reusing the same
// hysteresis idea so the two engines behave predictably alike.
//
// Movement feedback only — never a diagnostic tool. Mirror any behavioural
// change into `mobile_app/lib/src/features/motion/face_engine.dart`.

export type FaceLandmark = { x: number; y: number; z?: number };

// A small, stable subset of the FaceMesh canonical index map. We only need the
// paired points the facial exercises measure, plus two eye-outer points used to
// normalise every distance by inter-ocular width (so scoring is invariant to
// how close the patient sits to the camera).
export const FACE = {
  NOSE_TIP: 1,
  L_EYE_OUTER: 33,
  R_EYE_OUTER: 263,
  L_EYE_UPPER: 159,
  L_EYE_LOWER: 145,
  R_EYE_UPPER: 386,
  R_EYE_LOWER: 374,
  L_BROW: 105,
  R_BROW: 334,
  L_MOUTH_CORNER: 61,
  R_MOUTH_CORNER: 291,
  L_CHEEK: 234,
  R_CHEEK: 454,
} as const;

export function dist(a: FaceLandmark, b: FaceLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Euclidean distance between a landmark pair, normalised by inter-ocular width
// so a "0.42" reading means the same thing regardless of camera distance.
// Returns 0 when a point is missing or the face is degenerate.
export function normalisedSignal(
  landmarks: FaceLandmark[],
  pair: readonly [number, number],
): number {
  const a = landmarks[pair[0]];
  const b = landmarks[pair[1]];
  const eyeL = landmarks[FACE.L_EYE_OUTER];
  const eyeR = landmarks[FACE.R_EYE_OUTER];
  if (!a || !b || !eyeL || !eyeR) return 0;
  const interocular = dist(eyeL, eyeR);
  if (interocular === 0) return 0;
  return dist(a, b) / interocular;
}

// Symmetry between two side signals, 0–100. 100 = perfectly matched sides.
// Uses the relative difference so it stays meaningful across signal scales.
export function symmetryScore(left: number, right: number): number {
  const denom = Math.abs(left) + Math.abs(right);
  if (denom === 0) return 100;
  const asymmetry = Math.abs(left - right) / denom;
  return Math.max(0, Math.min(100, Math.round((1 - asymmetry) * 100)));
}

export type FaceFrameResult = {
  ratio: number; // 0–100 activation of the tracked movement (both sides averaged)
  reps: number;
  symmetry: number; // 0–100, this frame
  leftPct: number; // 0–100 per-side activation
  rightPct: number;
  phase: 'rest' | 'hold';
  cue: string;
};

export type FaceSessionSummary = {
  reps: number;
  symmetryAvg: number; // averaged over held (active) frames
  weakerSide: 'left' | 'right' | 'even';
  leftRangePct: number; // best per-side activation reached
  rightRangePct: number;
  avgQuality: number; // symmetry-weighted rep quality, 0–100
  passed: boolean;
};

// See `lib/face-targets.ts` for the concrete per-exercise instances and the
// (deliberately gentle) default thresholds tuned for paralysed / older patients.
export type FaceTarget = {
  exerciseId: string;
  label: string;
  bodyPart: string; // e.g. "Face" — kept for parity with MotionSession
  leftPair: readonly [number, number];
  rightPair: readonly [number, number];
  // When true the movement CLOSES a gap (eye close): a smaller raw signal means
  // more activation, so we invert around `restSignal`.
  invert?: boolean;
  restSignal: number; // approximate neutral-face reading of the raw signal
  activeSignal: number; // approximate fully-performed reading
  repEnterPct: number; // enter "hold" above this activation %
  repExitPct: number; // count a rep on return below this %
  repTarget: number;
};

// Maps a raw normalised signal to a 0–100 activation percentage for one side,
// clamped. `invert` flips the direction for closing movements.
function activation(target: FaceTarget, raw: number): number {
  const { restSignal, activeSignal, invert } = target;
  const span = activeSignal - restSignal;
  if (span === 0) return 0;
  let pct = ((raw - restSignal) / span) * 100;
  if (invert) pct = -pct;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

// Hysteresis rep counter + running symmetry tracker for one FaceTarget.
// Mirrors MotionJudge's shape so the capture layer treats both the same way.
export class FaceJudge {
  private t: FaceTarget;
  private phase: 'rest' | 'hold' = 'rest';
  private reps = 0;
  private leftMax = 0;
  private rightMax = 0;
  // Symmetry samples taken only while the movement is meaningfully active — a
  // relaxed face is trivially symmetric (both sides ~0), so counting those
  // frames would wash the average up towards 100 and hide real droop.
  private symmetries: number[] = [];
  private repQualities: number[] = [];
  // Symmetry at the frame of PEAK activation within the current rep — the
  // "at full expression" evenness, which is what a rep should be graded on.
  private peakRatioThisRep = 0;
  private symAtPeakThisRep = 0;

  constructor(target: FaceTarget) {
    this.t = target;
  }

  update(landmarks: FaceLandmark[]): FaceFrameResult {
    const rawL = normalisedSignal(landmarks, this.t.leftPair);
    const rawR = normalisedSignal(landmarks, this.t.rightPair);
    const leftPct = activation(this.t, rawL);
    const rightPct = activation(this.t, rawR);
    const ratio = Math.round((leftPct + rightPct) / 2);
    const sym = symmetryScore(leftPct, rightPct);

    this.leftMax = Math.max(this.leftMax, leftPct);
    this.rightMax = Math.max(this.rightMax, rightPct);

    let cue = 'Relax your face';
    if (this.phase === 'rest' && ratio >= this.t.repEnterPct) {
      this.phase = 'hold';
      this.peakRatioThisRep = ratio;
      this.symAtPeakThisRep = sym;
      this.symmetries.push(sym);
      cue = sym >= 75 ? 'Hold — nicely even' : 'Hold — try to match both sides';
    } else if (this.phase === 'hold') {
      // Only sample symmetry while still above the relax threshold.
      if (ratio > this.t.repExitPct) this.symmetries.push(sym);
      if (ratio > this.peakRatioThisRep) {
        this.peakRatioThisRep = ratio;
        this.symAtPeakThisRep = sym;
      }
      cue = sym >= 75 ? 'Good — keep it even' : 'Lift the weaker side to match';
      if (ratio <= this.t.repExitPct) {
        this.phase = 'rest';
        this.reps += 1;
        this.repQualities.push(this.symAtPeakThisRep);
        this.peakRatioThisRep = 0;
        this.symAtPeakThisRep = 0;
        cue = 'Relax your face';
      }
    } else {
      cue = 'Make the movement';
    }

    return { ratio, reps: this.reps, symmetry: sym, leftPct, rightPct, phase: this.phase, cue };
  }

  summary(): FaceSessionSummary {
    const symmetryAvg = this.symmetries.length
      ? Math.round(this.symmetries.reduce((s, v) => s + v, 0) / this.symmetries.length)
      : 0;
    const avgQuality = this.repQualities.length
      ? Math.round(this.repQualities.reduce((s, v) => s + v, 0) / this.repQualities.length)
      : 0;
    const gap = this.leftMax - this.rightMax;
    const weakerSide: FaceSessionSummary['weakerSide'] =
      Math.abs(gap) <= 8 ? 'even' : gap > 0 ? 'right' : 'left';
    return {
      reps: this.reps,
      symmetryAvg,
      weakerSide,
      leftRangePct: this.leftMax,
      rightRangePct: this.rightMax,
      avgQuality,
      passed: this.reps >= this.t.repTarget && symmetryAvg >= 60,
    };
  }
}
