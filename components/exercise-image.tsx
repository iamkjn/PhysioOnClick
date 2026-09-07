"use client";
import { useState } from "react";
import { ExerciseFigure } from "@/components/exercise-figure";
import { exerciseImageUrl } from "@/lib/exercise-images";

export function ExerciseImage({
  exerciseId, name, pose, size = 52,
}: { exerciseId: string; name: string; pose?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <ExerciseFigure name={name} pose={pose} size={size} />;
  return (
    <span className="exercise-figure-tile" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- needs onError fall-through to <ExerciseFigure>; images.unoptimized is on repo-wide */}
      <img
        src={exerciseImageUrl(exerciseId)}
        alt=""
        width={size}
        height={size}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
