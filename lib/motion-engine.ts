export type Landmark = { x: number; y: number; z?: number; visibility?: number };

export const POSE = {
  NOSE: 0,
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW: 13, R_ELBOW: 14,
  L_WRIST: 15, R_WRIST: 16,
  L_HIP: 23, R_HIP: 24,
  L_KNEE: 25, R_KNEE: 26,
  L_ANKLE: 27, R_ANKLE: 28,
} as const;

// Interior angle (degrees, 0–180) at `vertex` formed by vertex→a and vertex→b.
export function computeAngle(a: Landmark, vertex: Landmark, b: Landmark): number {
  const v1x = a.x - vertex.x, v1y = a.y - vertex.y;
  const v2x = b.x - vertex.x, v2y = b.y - vertex.y;
  const dot = v1x * v2x + v1y * v2y;
  const m1 = Math.hypot(v1x, v1y), m2 = Math.hypot(v2x, v2y);
  if (m1 === 0 || m2 === 0) return 0;
  const cos = Math.min(1, Math.max(-1, dot / (m1 * m2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

import type { MotionTarget } from '@/lib/motion-targets';

export type FrameResult = { angle: number; reps: number; romMin: number; romMax: number; phase: 'down' | 'up'; cue: string };
export type SessionSummary = { reps: number; romMin: number; romMax: number; avgQuality: number; passed: boolean };

export class MotionJudge {
  private t: MotionTarget;
  private phase: 'down' | 'up' = 'down';
  private reps = 0;
  private romMin = Infinity;
  private romMax = -Infinity;
  private peakThisRep = -Infinity;
  private qualities: number[] = [];

  constructor(target: MotionTarget) { this.t = target; }

  update(landmarks: Landmark[]): FrameResult {
    const j = this.t.joint;
    const a = landmarks[j.a], v = landmarks[j.vertex], b = landmarks[j.b];
    const angle = a && v && b ? computeAngle(a, v, b) : 0;
    this.romMin = Math.min(this.romMin, angle);
    this.romMax = Math.max(this.romMax, angle);

    let cue = 'Keep going';
    if ((this.t.direction ?? 'extend') === 'flex') {
      // Effort DECREASES the angle (bend/lift): enter below repEnterAngle,
      // complete a rep once the joint returns above repExitAngle, and grade on
      // how deep the trough got toward targetRomMin.
      if (this.phase === 'down' && angle <= this.t.repEnterAngle) {
        this.phase = 'up'; this.peakThisRep = angle; // peakThisRep holds the trough here
      } else if (this.phase === 'up') {
        this.peakThisRep = Math.min(this.peakThisRep, angle);
        if (angle >= this.t.repExitAngle) {
          this.phase = 'down';
          this.reps += 1;
          const range = this.t.targetRomMax - this.t.targetRomMin || 1;
          const q = Math.max(0, Math.min(100, Math.round(((this.t.targetRomMax - this.peakThisRep) / range) * 100)));
          this.qualities.push(q);
          cue = q >= 90 ? 'Good rep' : 'Try for more range';
          this.peakThisRep = Infinity;
        }
      }
      if (this.phase === 'up' && angle > this.t.targetRomMin + 15) cue = 'Bend further';
    } else {
      // Effort INCREASES the angle (extend/raise): the original behaviour.
      if (this.phase === 'down' && angle >= this.t.repEnterAngle) {
        this.phase = 'up'; this.peakThisRep = angle;
      } else if (this.phase === 'up') {
        this.peakThisRep = Math.max(this.peakThisRep, angle);
        if (angle <= this.t.repExitAngle) {
          this.phase = 'down';
          this.reps += 1;
          const q = Math.min(100, Math.round((this.peakThisRep / this.t.targetRomMax) * 100));
          this.qualities.push(q);
          cue = q >= 90 ? 'Good rep' : 'Try for more range';
          this.peakThisRep = -Infinity;
        }
      }
      if (this.phase === 'up' && angle < this.t.targetRomMax - 15) cue = 'Go further';
    }
    return { angle: Math.round(angle), reps: this.reps, romMin: Math.round(this.romMin), romMax: Math.round(this.romMax), phase: this.phase, cue };
  }

  summary(): SessionSummary {
    const avgQuality = this.qualities.length
      ? Math.round(this.qualities.reduce((s, q) => s + q, 0) / this.qualities.length) : 0;
    return {
      reps: this.reps,
      romMin: this.romMin === Infinity ? 0 : Math.round(this.romMin),
      romMax: this.romMax === -Infinity ? 0 : Math.round(this.romMax),
      avgQuality,
      passed: this.reps >= this.t.repTarget && avgQuality >= 60,
    };
  }
}
