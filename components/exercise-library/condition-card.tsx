// A linked condition-hub tile for the library index and body-area pages.
// Server component.

import Link from "next/link";

import type { Condition } from "@/lib/exercise-library";

export function ConditionCard({
  condition,
  exerciseCount,
}: {
  condition: Condition;
  exerciseCount: number;
}) {
  return (
    <Link href={`/exercises/for/${condition.slug}`} className="exlib-cond-card">
      <span className="exlib-cond-card__area">{condition.bodyArea}</span>
      <span className="exlib-cond-card__name">{condition.name} exercises</span>
      <p className="exlib-cond-card__desc">{condition.seoDescription}</p>
      <span className="exlib-cond-card__count">{exerciseCount} exercises</span>
    </Link>
  );
}
