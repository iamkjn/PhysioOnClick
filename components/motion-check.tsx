'use client';

// Live camera "Check your motion" component. Requests the webcam, runs
// client-side pose detection each animation frame, draws a skeleton overlay
// on a canvas above the video, feeds landmarks into a MotionJudge for
// rep/ROM/quality tracking, and saves a session summary on Finish.
//
// Movement feedback only — never a diagnostic tool. No video/image data is
// ever uploaded or persisted; only the derived numbers are saved.

import { useEffect, useRef, useState } from 'react';
import { createPoseDetector, type PoseDetector } from '@/lib/pose-detector';
import { MotionJudge, POSE, type FrameResult, type Landmark } from '@/lib/motion-engine';
import type { MotionTarget } from '@/lib/motion-targets';
import { saveMotionSession } from '@/lib/motion';
import { todayKey } from '@/lib/recovery';

type Exercise = { id: string; title: string; bodyPart: string };

type MotionCheckProps = {
  exercise: Exercise;
  target: MotionTarget;
  uid: string;
  personId: string;
  onClose: () => void;
};

type Phase = 'requesting' | 'denied' | 'no-track' | 'running' | 'saving';

const NO_TRACK_TIMEOUT_MS = 3000;
// How long a person must be continuously visible before rep/ROM tracking
// starts counting — gives the patient a moment to get into frame and settle
// before the first frames of fumbling get judged as a rep.
const READY_DELAY_MS = 2500;
const DEFAULT_ACCENT = '#38BDF8'; // matches --color-primary-glow fallback

// A light BlazePose stick-figure skeleton — just the limbs, no face mesh —
// drawn under the highlighted target-joint segments.
const BASE_CONNECTIONS: [number, number][] = [
  [POSE.L_SHOULDER, POSE.R_SHOULDER],
  [POSE.L_SHOULDER, POSE.L_ELBOW],
  [POSE.L_ELBOW, POSE.L_WRIST],
  [POSE.R_SHOULDER, POSE.R_ELBOW],
  [POSE.R_ELBOW, POSE.R_WRIST],
  [POSE.L_SHOULDER, POSE.L_HIP],
  [POSE.R_SHOULDER, POSE.R_HIP],
  [POSE.L_HIP, POSE.R_HIP],
  [POSE.L_HIP, POSE.L_KNEE],
  [POSE.L_KNEE, POSE.L_ANKLE],
  [POSE.R_HIP, POSE.R_KNEE],
  [POSE.R_KNEE, POSE.R_ANKLE],
];

function isVisible(lm: Landmark | undefined): lm is Landmark {
  return !!lm && (lm.visibility === undefined || lm.visibility >= 0.3);
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  landmarks: Landmark[],
  joint: MotionTarget['joint'],
  accent: string
) {
  ctx.clearRect(0, 0, width, height);
  if (landmarks.length === 0) return;

  const px = (lm: Landmark) => lm.x * width;
  const py = (lm: Landmark) => lm.y * height;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Base skeleton, softly visible.
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = Math.max(2, width * 0.006);
  for (const [i1, i2] of BASE_CONNECTIONS) {
    const l1 = landmarks[i1];
    const l2 = landmarks[i2];
    if (!isVisible(l1) || !isVisible(l2)) continue;
    ctx.beginPath();
    ctx.moveTo(px(l1), py(l1));
    ctx.lineTo(px(l2), py(l2));
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (const lm of landmarks) {
    if (!isVisible(lm)) continue;
    ctx.beginPath();
    ctx.arc(px(lm), py(lm), Math.max(2.5, width * 0.006), 0, Math.PI * 2);
    ctx.fill();
  }

  // Highlighted target joint (the one being measured for this exercise).
  const a = landmarks[joint.a];
  const v = landmarks[joint.vertex];
  const b = landmarks[joint.b];
  if (isVisible(a) && isVisible(v) && isVisible(b)) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(3.5, width * 0.01);
    ctx.beginPath();
    ctx.moveTo(px(a), py(a));
    ctx.lineTo(px(v), py(v));
    ctx.lineTo(px(b), py(b));
    ctx.stroke();

    ctx.fillStyle = accent;
    for (const lm of [a, v, b]) {
      ctx.beginPath();
      ctx.arc(px(lm), py(lm), Math.max(5, width * 0.012), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function MotionCheck({ exercise, target, uid, personId, onClose }: MotionCheckProps) {
  const [phase, setPhase] = useState<Phase>('requesting');
  const [frame, setFrame] = useState<FrameResult>({
    angle: 0,
    reps: 0,
    romMin: 0,
    romMax: 0,
    phase: 'down',
    cue: 'Get into frame',
  });
  const [attempt, setAttempt] = useState(0);
  // Gates rep/ROM tracking: false until a person has been continuously
  // visible for READY_DELAY_MS, so the HUD (rep count / ROM meter) — and the
  // MotionJudge itself — only come alive once the patient is actually set up.
  const [trackingReady, setTrackingReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const judgeRef = useRef<MotionJudge | null>(null);
  const rafRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const phaseRef = useRef<Phase>('requesting');
  const lastSeenAtRef = useRef(0);
  const startedAtRef = useRef(0);
  const readyStartRef = useRef<number | null>(null);
  const trackingReadyRef = useRef(false);
  const accentRef = useRef(DEFAULT_ACCENT);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => {
      previouslyFocusedRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Pull the accent colour from the design tokens so the overlay stays
  // in sync with the Clarity System instead of a hardcoded hex.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary-glow')
      .trim();
    if (value) accentRef.current = value;
  }, []);

  useEffect(() => {
    // `cancelled` is a closure-local guard, own to THIS effect invocation —
    // not a shared ref. Under StrictMode's dev mount->unmount->remount, a
    // shared ref gets reset by the second invocation, so a still-pending
    // getUserMedia()/createPoseDetector() from the first invocation would
    // read the reset flag and wrongly believe it's still current, then
    // overwrite the stream/detector the second invocation created —
    // orphaning the first invocation's tracks (camera stays on after
    // close). With a per-invocation local, a stale invocation always sees
    // its own `cancelled = true` and tears down its OWN resources instead.
    let cancelled = false;

    const stopMedia = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      detectorRef.current?.close();
      detectorRef.current = null;
    };

    function loop(now: number) {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const detector = detectorRef.current;
      const judge = judgeRef.current;

      if (video && canvas && detector && judge && video.readyState >= 2) {
        const landmarks = detector.detect(video, now);
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          drawSkeleton(ctx, canvas.width, canvas.height, landmarks, target.joint, accentRef.current);
        }

        if (landmarks.length > 0) {
          lastSeenAtRef.current = now;
          if (phaseRef.current === 'no-track') {
            // Person re-acquired after dropping out of frame — re-run the
            // ready countdown rather than resume tracking mid-fumble.
            setPhase('running');
            readyStartRef.current = null;
            trackingReadyRef.current = false;
            setTrackingReady(false);
          }

          if (readyStartRef.current === null) readyStartRef.current = now;
          const readyElapsed = now - readyStartRef.current;
          if (readyElapsed < READY_DELAY_MS) {
            const remaining = Math.max(1, Math.ceil((READY_DELAY_MS - readyElapsed) / 1000));
            setFrame((f) => ({ ...f, cue: `Get ready… ${remaining}` }));
          } else {
            if (!trackingReadyRef.current) {
              trackingReadyRef.current = true;
              setTrackingReady(true);
            }
            setFrame(judge.update(landmarks));
          }
        } else if (phaseRef.current === 'running' && now - lastSeenAtRef.current > NO_TRACK_TIMEOUT_MS) {
          setPhase('no-track');
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    async function start() {
      setPhase('requesting');
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      } catch {
        if (!cancelled) setPhase('denied');
        return;
      }
      if (cancelled) {
        // A stale invocation — tear down the stream IT just created; never
        // touch the shared refs, which may already belong to a newer one.
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          // Autoplay can reject in some browsers until a user gesture;
          // the stream is still attached and will render once allowed.
        }
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        return;
      }

      let detector: PoseDetector;
      try {
        detector = await createPoseDetector();
      } catch {
        if (!cancelled) setPhase('denied');
        stopMedia();
        return;
      }
      if (cancelled) {
        detector.close();
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        return;
      }
      detectorRef.current = detector;
      judgeRef.current = new MotionJudge(target);
      lastSeenAtRef.current = performance.now();
      startedAtRef.current = performance.now();
      readyStartRef.current = null;
      trackingReadyRef.current = false;
      setTrackingReady(false);
      setFrame({ angle: 0, reps: 0, romMin: 0, romMax: 0, phase: 'down', cue: 'Get into frame' });
      setPhase('running');
      rafRef.current = requestAnimationFrame(loop);
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      stopMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- exercise/target/uid/personId are stable for the life of the modal; only `attempt` (Retry) should re-run camera/detector setup
  }, [attempt]);

  async function handleFinish() {
    // Guard against a rapid double-tap firing this twice before the
    // re-render that hides the Finish button — a ref (not state) so the
    // check is synchronous and immune to React's batching.
    if (savingRef.current) return;
    savingRef.current = true;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPhase('saving');

    const summary = judgeRef.current?.summary() ?? {
      reps: 0,
      romMin: 0,
      romMax: 0,
      avgQuality: 0,
      passed: false,
    };
    const durationSec = Math.max(0, Math.round((performance.now() - startedAtRef.current) / 1000));

    try {
      await saveMotionSession(uid, personId, {
        exerciseId: exercise.id,
        bodyPart: exercise.bodyPart,
        date: todayKey(),
        reps: summary.reps,
        repTarget: target.repTarget,
        romMin: summary.romMin,
        romMax: summary.romMax,
        targetRomMin: target.targetRomMin,
        targetRomMax: target.targetRomMax,
        avgQuality: summary.avgQuality,
        passed: summary.passed,
        durationSec,
      });
    } catch (err) {
      console.error('Failed to save motion session', err);
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    detectorRef.current?.close();
    detectorRef.current = null;
    onClose();
  }

  function handleClose() {
    if (phase === 'saving') return;
    onClose();
  }

  function handleRetry() {
    setAttempt((a) => a + 1);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleClose closes over `phase`; re-registering per phase change keeps it current without listing the function itself
  }, [phase]);

  const showCamera = phase === 'running' || phase === 'no-track' || phase === 'saving';
  const romPct = Math.max(0, Math.min(100, Math.round((frame.angle / target.targetRomMax) * 100)));
  const romBestPct = Math.max(0, Math.min(100, Math.round((frame.romMax / target.targetRomMax) * 100)));

  return (
    <div className="motion-check-overlay" role="dialog" aria-modal="true" aria-label={`Check your motion: ${exercise.title}`}>
      <div className="motion-check-modal">
        <header className="motion-check-header">
          <div className="motion-check-heading">
            <h2 className="motion-check-title">{exercise.title}</h2>
            <p className="motion-check-subtitle">{exercise.bodyPart} &middot; target {target.repTarget} reps</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="motion-check-close"
            onClick={handleClose}
            disabled={phase === 'saving'}
            aria-label="Close check your motion"
          >
            &times;
          </button>
        </header>

        <div className="motion-check-stage">
          <div className="motion-check-camera">
            <video
              ref={videoRef}
              className="motion-check-video"
              playsInline
              muted
              autoPlay
              onLoadedMetadata={() => {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                if (video && canvas) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                }
              }}
            />
            <canvas className="motion-check-canvas" ref={canvasRef} />

            {showCamera && phase !== 'saving' && (
              <>
                {trackingReady && (
                  <div className="motion-check-hud">
                    <div className="motion-check-rep-counter">
                      <span className="motion-check-rep-count">{frame.reps}</span>
                      <span className="motion-check-rep-label">/ {target.repTarget} reps</span>
                    </div>
                    <div className="motion-check-rom-meter" aria-label="Range of motion">
                      <div className="motion-check-rom-track">
                        <div className="motion-check-rom-fill" style={{ width: `${romPct}%` }} />
                        <div className="motion-check-rom-best" style={{ left: `${romBestPct}%` }} />
                      </div>
                      <span className="motion-check-rom-label">
                        {frame.angle}&deg; / {target.targetRomMax}&deg;
                      </span>
                    </div>
                  </div>
                )}
                <div
                  className={`motion-check-cue-banner${phase === 'no-track' ? ' motion-check-cue-banner--warning' : ''}`}
                  aria-live="polite"
                >
                  {phase === 'no-track' ? 'Step back so we can see you' : frame.cue}
                </div>
              </>
            )}

            {phase === 'requesting' && (
              <div className="motion-check-status-panel">
                <span className="motion-check-spinner" aria-hidden="true" />
                <p>Requesting camera access&hellip;</p>
              </div>
            )}

            {phase === 'denied' && (
              <div className="motion-check-status-panel motion-check-status-panel--error">
                <p className="motion-check-status-title">We couldn&rsquo;t start the camera</p>
                <p className="motion-check-status-sub">
                  Check that this site has camera permission and that no other app is using it, then try again.
                </p>
                <div className="motion-check-status-actions">
                  <button type="button" className="motion-check-btn motion-check-btn--secondary" onClick={onClose}>
                    Close
                  </button>
                  <button type="button" className="motion-check-btn motion-check-btn--primary" onClick={handleRetry}>
                    Retry
                  </button>
                </div>
              </div>
            )}

            {phase === 'saving' && (
              <div className="motion-check-status-panel">
                <span className="motion-check-spinner" aria-hidden="true" />
                <p>Saving your session&hellip;</p>
              </div>
            )}
          </div>
        </div>

        <footer className="motion-check-footer">
          <p className="motion-check-disclaimer">Movement feedback only &mdash; not a medical assessment.</p>
          {(phase === 'running' || phase === 'no-track') && (
            <button
              type="button"
              className="motion-check-btn motion-check-btn--primary motion-check-btn-finish"
              onClick={handleFinish}
              disabled={savingRef.current}
            >
              Finish
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

export default MotionCheck;
