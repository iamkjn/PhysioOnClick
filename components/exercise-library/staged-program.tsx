// The stage-by-stage programme on a condition hub: one <section> per stage,
// each with a stage pill, a Fraunces stage name, its blurb, and a grid of
// exercise cards. Server component.

import { ExerciseCard } from "@/components/exercise-library/exercise-card";
import type { ConditionStage, Exercise } from "@/lib/exercise-library";

export function StagedProgram({
  program,
}: {
  program: { stage: ConditionStage; exercises: Exercise[] }[];
}) {
  return (
    <div className="exlib-program">
      {program.map(({ stage, exercises }, index) => (
        <section key={`${index}-${stage.stage}`} className="exlib-stage">
          <div className="exlib-stage__head">
            <span className="exlib-stage__pill">Stage {index + 1}</span>
            <h3 className="exlib-stage__name">{stage.stage}</h3>
          </div>
          <p className="exlib-stage__blurb">{stage.blurb}</p>
          <div className="exlib-ex-grid">
            {exercises.map((exercise) => (
              <ExerciseCard key={exercise.slug} exercise={exercise} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
