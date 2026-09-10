// A linked exercise tile for grids across the public exercise library.
// Server component - the whole <Link> is the tap target; "Full instructions" is
// a visual affordance, not a nested link.

import Link from "next/link";

import { ExerciseImage } from "@/components/exercise-image";
import type { Exercise } from "@/lib/exercise-library";
import { formatDosage, resolveDosage } from "@/lib/exercises";

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link href={`/exercises/${exercise.slug}`} className="exlib-ex-card">
      <ExerciseImage
        exerciseId={exercise.id}
        name={exercise.title}
        pose={exercise.pose}
        size={72}
      />
      <span className="exlib-ex-card__title">{exercise.title}</span>
      <span className="exlib-ex-card__dose">
        {formatDosage(resolveDosage(exercise))}
      </span>
      <span className="exlib-ex-card__more">
        Full instructions <span aria-hidden>&rarr;</span>
      </span>
    </Link>
  );
}
