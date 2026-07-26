"use client";

// Camera-gated entry point for "Check your motion" on a patient's exercise
// card. Renders nothing unless BOTH a motion target exists for this exercise
// AND the browser reports a video input device — so exercises with no target
// (e.g. balance holds) and devices/browsers with no camera never show a
// dead-end button. The heavy camera + detection component is loaded lazily so
// it never lands in the SSR bundle.
//
// Two flavours share this one button: BODY exercises (ex-*) resolve a joint
// MotionTarget and open the pose check; FACIAL exercises (face-*) resolve a
// FaceTarget and open the facial symmetry check for palsy/stroke/older
// patients. The kind is decided by which target resolves for the id.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getMotionTarget, getFaceMotionTarget } from "@/lib/motion";
import type { MotionTarget } from "@/lib/motion-targets";
import type { FaceTarget } from "@/lib/face-targets";

const MotionCheck = dynamic(() => import("@/components/motion-check"), { ssr: false });
const FaceMotionCheck = dynamic(() => import("@/components/face-motion-check"), { ssr: false });

type Exercise = { id: string; title: string; bodyPart: string };

interface Props {
  exerciseId: string;
  exercise: Exercise;
  uid: string;
  personId: string;
}

// face-* exercise ids are graded by the facial camera engine, not body pose.
const isFacial = (id: string) => id.startsWith("face-");

export function MotionCheckButton({ exerciseId, exercise, uid, personId }: Props) {
  const facial = isFacial(exerciseId);
  const [bodyTarget, setBodyTarget] = useState<MotionTarget | null>(null);
  const [faceTarget, setFaceTarget] = useState<FaceTarget | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resolve = facial
      ? getFaceMotionTarget(exerciseId).then((t) => {
          if (!cancelled) setFaceTarget(t);
        })
      : getMotionTarget(exerciseId).then((t) => {
          if (!cancelled) setBodyTarget(t);
        });
    resolve.catch(() => {
      if (!cancelled) {
        setFaceTarget(null);
        setBodyTarget(null);
      }
    });

    // enumerateDevices is undefined in SSR/older browsers and in non-secure
    // contexts — guard with optional chaining and never throw.
    const enumerate = navigator.mediaDevices?.enumerateDevices;
    if (typeof enumerate === "function") {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          if (!cancelled) setHasCamera(devices.some((d) => d.kind === "videoinput"));
        })
        .catch(() => {
          if (!cancelled) setHasCamera(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [exerciseId, facial]);

  const target = facial ? faceTarget : bodyTarget;
  if (!target || !hasCamera) return null;

  const label = facial ? "Check your facial motion" : `Check your ${(target as MotionTarget).bodyPart} motion`;

  return (
    <>
      <button type="button" className="motion-check-trigger" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && facial && faceTarget && (
        <FaceMotionCheck
          exercise={exercise}
          target={faceTarget}
          uid={uid}
          personId={personId}
          onClose={() => setOpen(false)}
        />
      )}
      {open && !facial && bodyTarget && (
        <MotionCheck
          exercise={exercise}
          target={bodyTarget}
          uid={uid}
          personId={personId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export default MotionCheckButton;
