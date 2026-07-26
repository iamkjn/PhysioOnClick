'use client';

// Live camera "Check your facial motion" component for facial-palsy / stroke /
// older patients. Sibling of `components/motion-check.tsx` (body joints); it
// shares the same consent → request → run → save lifecycle and the same strict
// "no video ever leaves the device" guarantee, but runs FaceLandmarker instead
// of the pose model and grades left/right SYMMETRY plus gentle reps.
//
// Movement feedback only — never a diagnostic tool. Only the derived numbers
// (reps, symmetry, per-side range) are saved; the camera frames are not.

import { useEffect, useRef, useState } from 'react';
import { createFaceDetector, type FaceDetector } from '@/lib/face-detector';
import { FaceJudge, type FaceFrameResult, type FaceLandmark } from '@/lib/face-engine';
import type { FaceTarget } from '@/lib/face-targets';
import { saveMotionSession } from '@/lib/motion';
import { todayKey } from '@/lib/recovery';

type Exercise = { id: string; title: string; bodyPart: string };

type FaceMotionCheckProps = {
  exercise: Exercise;
  target: FaceTarget;
  uid: string;
  personId: string;
  onClose: () => void;
};

type Phase = 'consent' | 'requesting' | 'denied' | 'no-track' | 'running' | 'saving';

const CONTACT_HREF = '/contact';
const NO_TRACK_TIMEOUT_MS = 3000;
const READY_DELAY_MS = 2500;

function TroubleLink({ overlay = false }: { overlay?: boolean }) {
  return (
    <p className={`motion-check-trouble-link${overlay ? ' motion-check-trouble-link--overlay' : ''}`}>
      Having trouble recording your movement?{' '}
      <a href={CONTACT_HREF} target="_blank" rel="noopener noreferrer">
        Contact your physio
      </a>
    </p>
  );
}

const EMPTY_FRAME: FaceFrameResult = {
  ratio: 0,
  reps: 0,
  symmetry: 100,
  leftPct: 0,
  rightPct: 0,
  phase: 'rest',
  cue: 'Get your face into frame',
};

export function FaceMotionCheck({ exercise, target, uid, personId, onClose }: FaceMotionCheckProps) {
  const [phase, setPhase] = useState<Phase>('consent');
  const [consentGiven, setConsentGiven] = useState(false);
  const [frame, setFrame] = useState<FaceFrameResult>(EMPTY_FRAME);
  const [attempt, setAttempt] = useState(0);
  const [trackingReady, setTrackingReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<FaceDetector | null>(null);
  const judgeRef = useRef<FaceJudge | null>(null);
  const rafRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const phaseRef = useRef<Phase>('consent');
  const lastSeenAtRef = useRef(0);
  const startedAtRef = useRef(0);
  const readyStartRef = useRef<number | null>(null);
  const trackingReadyRef = useRef(false);
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

  useEffect(() => {
    // Per-invocation guard (not a shared ref) so StrictMode's double-mount
    // tears down its OWN stream/detector — see motion-check.tsx for the full
    // rationale; the mechanics here are identical.
    if (!consentGiven) return;
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
      const detector = detectorRef.current;
      const judge = judgeRef.current;

      if (video && detector && judge && video.readyState >= 2) {
        const landmarks: FaceLandmark[] = detector.detect(video, now);

        if (landmarks.length > 0) {
          lastSeenAtRef.current = now;
          if (phaseRef.current === 'no-track') {
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
          /* autoplay may reject until a gesture; stream still renders once allowed */
        }
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        return;
      }

      let detector: FaceDetector;
      try {
        detector = await createFaceDetector();
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
      judgeRef.current = new FaceJudge(target);
      lastSeenAtRef.current = performance.now();
      startedAtRef.current = performance.now();
      readyStartRef.current = null;
      trackingReadyRef.current = false;
      setTrackingReady(false);
      setFrame(EMPTY_FRAME);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- exercise/target/uid/personId are stable for the modal's life; only attempt (Retry) and consentGiven (initial Allow) re-run setup
  }, [attempt, consentGiven]);

  async function handleFinish() {
    if (savingRef.current) return;
    savingRef.current = true;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPhase('saving');

    const summary = judgeRef.current?.summary() ?? {
      reps: 0,
      symmetryAvg: 0,
      weakerSide: 'even' as const,
      leftRangePct: 0,
      rightRangePct: 0,
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
        // Body ROM fields don't apply to a facial session; keep them zeroed and
        // carry the facial signals in the kind-specific fields below.
        romMin: 0,
        romMax: 0,
        targetRomMin: 0,
        targetRomMax: 0,
        avgQuality: summary.avgQuality,
        passed: summary.passed,
        durationSec,
        kind: 'face',
        symmetryAvg: summary.symmetryAvg,
        weakerSide: summary.weakerSide,
        leftRangePct: summary.leftRangePct,
        rightRangePct: summary.rightRangePct,
      });
    } catch (err) {
      console.error('Failed to save facial motion session', err);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleClose closes over phase; re-registering per phase change keeps it current
  }, [phase]);

  const showCamera = phase === 'running' || phase === 'no-track' || phase === 'saving';
  const symmetryTone =
    frame.symmetry >= 75 ? 'var(--color-primary, #0EA5E9)' : frame.symmetry >= 50 ? '#E2A03F' : '#D97757';

  return (
    <div
      className="motion-check-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Check your facial motion: ${exercise.title}`}
    >
      <div className="motion-check-modal">
        <header className="motion-check-header">
          <div className="motion-check-heading">
            <h2 className="motion-check-title">Face &middot; {exercise.title}</h2>
            <p className="motion-check-subtitle">
              Target {target.repTarget} gentle reps &middot; match both sides
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="motion-check-close"
            onClick={handleClose}
            disabled={phase === 'saving'}
            aria-label="Close facial motion check"
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
            />

            {showCamera && phase !== 'saving' && (
              <>
                {trackingReady && (
                  <div className="motion-check-hud">
                    <div className="motion-check-rep-counter">
                      <span className="motion-check-rep-count">{frame.reps}</span>
                      <span className="motion-check-rep-label">/ {target.repTarget} reps</span>
                    </div>

                    <div className="face-check-symmetry" aria-label={`Symmetry ${frame.symmetry} percent`}>
                      <span className="face-check-symmetry-value" style={{ color: symmetryTone }}>
                        {frame.symmetry}%
                      </span>
                      <span className="face-check-symmetry-label">symmetry</span>
                    </div>

                    <div className="face-check-sides" aria-hidden="true">
                      <div className="face-check-side">
                        <div className="face-check-side-track">
                          <div
                            className="face-check-side-fill"
                            style={{ height: `${frame.leftPct}%`, background: symmetryTone }}
                          />
                        </div>
                        <span className="face-check-side-label">Left</span>
                      </div>
                      <div className="face-check-side">
                        <div className="face-check-side-track">
                          <div
                            className="face-check-side-fill"
                            style={{ height: `${frame.rightPct}%`, background: symmetryTone }}
                          />
                        </div>
                        <span className="face-check-side-label">Right</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="motion-check-bottom-stack">
                  <div
                    className={`motion-check-cue-banner${phase === 'no-track' ? ' motion-check-cue-banner--warning' : ''}`}
                    aria-live="polite"
                  >
                    {phase === 'no-track' ? 'Move so we can see your face' : frame.cue}
                  </div>
                  {phase === 'no-track' && <TroubleLink overlay />}
                </div>
              </>
            )}

            {phase === 'consent' && (
              <div className="motion-check-status-panel motion-check-consent">
                <p className="motion-check-status-title">Camera facial-movement check</p>
                <p className="motion-check-status-sub motion-check-consent-body">
                  This uses your camera to measure how evenly the two sides of your face move. All
                  processing happens on your device &mdash; your video is never recorded, uploaded, or
                  stored. Only your movement scores (reps and symmetry) are saved.
                </p>
                <div className="motion-check-status-actions">
                  <button type="button" className="motion-check-btn motion-check-btn--secondary" onClick={handleClose}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="motion-check-btn motion-check-btn--primary"
                    onClick={() => setConsentGiven(true)}
                  >
                    Allow camera &amp; continue
                  </button>
                </div>
                <TroubleLink />
              </div>
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
                <TroubleLink />
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

export default FaceMotionCheck;
