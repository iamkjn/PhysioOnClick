// components/exercise-library/exercise-anatomy-section.tsx
// "What it works and how it helps": the exercise's main muscles and helpers in
// plain words, how it helps recovery, and where it sits in the four recovery
// stages. Server-rendered text, so it reads without the 3D view or JavaScript.

import { Reveal } from "@/components/reveal";
import { HEALING_CLOSING, HEALING_STAGES, TISSUE_LINES, healingCopyVisible } from "@/lib/exercise-anatomy/healing";
import { MUSCLES, type MuscleKey } from "@/lib/exercise-anatomy/muscles";
import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

function MuscleList({ keys }: { keys: readonly MuscleKey[] }) {
  return (
    <ul className="exlib-anatomy__muscles">
      {keys.map((key) => (
        <li key={key}>
          <strong>{MUSCLES[key].label}</strong> ({MUSCLES[key].plain})
        </li>
      ))}
    </ul>
  );
}

export function ExerciseAnatomySection({ anatomy, stage }: { anatomy: ExerciseAnatomy; stage: string }) {
  const current = HEALING_STAGES.findIndex((s) => s.stage === stage);
  return (
    <section className="page-section" data-anatomy aria-labelledby="exlib-anatomy-heading">
      <Reveal direction="up">
        <article className="simple-service-card exlib-anatomy">
          <h2 id="exlib-anatomy-heading">What it works and how it helps</h2>
          <div className="exlib-anatomy__group">
            <h3>Main focus</h3>
            <MuscleList keys={anatomy.main} />
          </div>
          {anatomy.helpers.length ? (
            <div className="exlib-anatomy__group">
              <h3>Also working</h3>
              <MuscleList keys={anatomy.helpers} />
            </div>
          ) : null}
          <div className="exlib-anatomy__group">
            <h3>How this helps your recovery</h3>
            <p>{anatomy.howItHelps}</p>
          </div>
          {healingCopyVisible() ? (
            <div className="exlib-anatomy__group" data-healing>
              <h3>Where it fits in recovery</h3>
              {current >= 0 ? (
                <ol className="exlib-anatomy__stages">
                  {HEALING_STAGES.map((s, i) => (
                    <li key={s.stage} aria-current={i === current ? "step" : undefined} className={i === current ? "is-current" : undefined}>
                      <strong>{s.label}</strong>
                      {i === current ? <span className="exlib-anatomy__here">This exercise</span> : null}
                      <span>{s.caption}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
              {anatomy.tissue ? <p data-tissue>{TISSUE_LINES[anatomy.tissue]}</p> : null}
              <p className="muted">{HEALING_CLOSING}</p>
            </div>
          ) : null}
        </article>
      </Reveal>
    </section>
  );
}
