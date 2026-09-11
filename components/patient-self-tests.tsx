// components/patient-self-tests.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getAssignedExercises, type AssignedExercise } from "@/lib/recovery";
import { exercises } from "@/lib/exercises";
import { selfTestsForExercises, type SelfTest } from "@/lib/exercise-library";
import { SelfTestSteps } from "@/components/exercise-library/self-test-steps";
import { SelfTestResults } from "@/components/exercise-library/self-test-results";
import { SkeletonRow } from "@/components/skeleton";

interface Props {
  uid: string;
  personId: string;
}

// Same wording as the public self-test page's disclaimer
// (app/exercises/tests/[slug]/page.tsx) — informational triage, not diagnosis.
const DISCLAIMER =
  "This is a guide, not a diagnosis. It cannot rule a problem in or out - a physiotherapist can. If your symptoms are severe, spreading, or you feel unwell, see a doctor.";

// "Check your progress" — self-tests relevant to the exercises the physio has
// assigned, derived from the condition hub(s) those exercises belong to (no
// separate admin assignment step). Renders nothing when there is no match.
export function PatientSelfTests({ uid, personId }: Props) {
  const [assigned, setAssigned] = useState<AssignedExercise[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setAssigned(null);
    getAssignedExercises(uid, personId)
      .then((a) => {
        if (!cancelled) setAssigned(a);
      })
      .catch(() => {
        if (!cancelled) setAssigned([]);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, personId]);

  const exerciseIdToSlug = useMemo(
    () => new Map(exercises.map((e) => [e.id, e.slug])),
    []
  );

  const tests: SelfTest[] = useMemo(() => {
    if (!assigned) return [];
    const slugs = assigned
      .map((ae) => exerciseIdToSlug.get(ae.exerciseId))
      .filter((s): s is string => Boolean(s));
    return selfTestsForExercises(slugs);
  }, [assigned, exerciseIdToSlug]);

  function toggleExpanded(slug: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  if (assigned === null) {
    return (
      <section className="page-section">
        <div className="panel stack">
          <h3>Check your progress</h3>
          <SkeletonRow count={2} />
        </div>
      </section>
    );
  }

  if (tests.length === 0) return null;

  return (
    <section className="page-section">
      <div className="panel stack">
      <h3 style={{ margin: 0 }}>Check your progress</h3>
      <p className="muted" style={{ margin: "var(--space-1) 0 0" }}>
        Quick self-checks related to what you&apos;re working on.
      </p>

      <div className="exercise-card-list">
        {tests.map((test) => (
          <div key={test.slug} className="exercise-card">
            <div className="exercise-card-head">
              <div className="exercise-card-body">
                <strong>{test.name}</strong>
                <span>{test.assesses}</span>
              </div>
            </div>

            <div className="exercise-card-actions">
              <a href={`/exercises/tests/${test.slug}`} className="exercise-video-watch">
                Full guide ↗
              </a>
              <button
                type="button"
                className="exercise-howto-toggle"
                aria-expanded={expanded.has(test.slug)}
                aria-controls={`selftest-${test.slug}`}
                onClick={() => toggleExpanded(test.slug)}
              >
                {expanded.has(test.slug) ? "Hide steps ▴" : "How to check ▾"}
              </button>
            </div>

            {expanded.has(test.slug) && (
              <div className="exercise-howto" id={`selftest-${test.slug}`}>
                <SelfTestSteps steps={test.steps} testName={test.name} />
                <SelfTestResults
                  negative={test.negativeResult}
                  positive={test.positiveResult}
                  tips={test.tips}
                  idPrefix={`selftest-${test.slug}`}
                />
              </div>
            )}

            <p className="exercise-howto-foot muted">{DISCLAIMER}</p>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
