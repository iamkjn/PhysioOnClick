"use client";

// Camera-gated entry point for "Check your motion" on a patient's exercise
// card. Renders nothing unless BOTH an admin-configured motion target exists
// for this exercise AND the browser reports a video input device — so
// exercises with no target (e.g. balance holds) and devices/browsers with no
// camera never show a dead-end button. The heavy camera + pose-detection
// component is loaded lazily so it never lands in the SSR bundle.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getMotionTarget } from "@/lib/motion";
import type { MotionTarget } from "@/lib/motion-targets";

const MotionCheck = dynamic(() => import("@/components/motion-check"), { ssr: false });

type Exercise = { id: string; title: string; bodyPart: string };

interface Props {
  exerciseId: string;
  exercise: Exercise;
  uid: string;
  personId: string;
}

export function MotionCheckButton({ exerciseId, exercise, uid, personId }: Props) {
  const [target, setTarget] = useState<MotionTarget | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getMotionTarget(exerciseId)
      .then((t) => {
        if (!cancelled) setTarget(t);
      })
      .catch(() => {
        if (!cancelled) setTarget(null);
      });

    // enumerateDevices is undefined in SSR/older browsers and in
    // non-secure contexts — guard with optional chaining and never throw.
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
  }, [exerciseId]);

  if (!target || !hasCamera) return null;

  return (
    <>
      <button type="button" className="motion-check-trigger" onClick={() => setOpen(true)}>
        Check your motion
      </button>
      {open && (
        <MotionCheck
          exercise={exercise}
          target={target}
          uid={uid}
          personId={personId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export default MotionCheckButton;
