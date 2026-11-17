// components/admin-exercise-done.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  getAssignedExercises,
  getExerciseLogForDate,
  setExerciseCompletionByPhysio,
  todayKey,
  type AssignedExercise,
} from "@/lib/recovery";
import { exercises as allExercises } from "@/lib/site-data";
import { formatDosage, resolveDosage } from "@/lib/exercises";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

interface Props {
  patientUid: string;
  personId: string;
}

// "Exercises done with the physio": when the patient does their exercises in
// a session with the physio, the physio ticks them off here for that day. It
// counts exactly like the patient ticking them in the portal (streak,
// adherence), and is recorded as physio-marked.
export function AdminExerciseDone({ patientUid, personId }: Props) {
  const toast = useToast();
  const [date, setDate] = useState(todayKey());
  const [assigned, setAssigned] = useState<AssignedExercise[] | null>(null);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [physioMarked, setPhysioMarked] = useState<Record<string, boolean>>({});
  const [logLoaded, setLogLoaded] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setAssigned(null);
    getAssignedExercises(patientUid, personId)
      .then((a) => { if (live) setAssigned(a); })
      .catch(() => { if (live) setAssigned([]); });
    return () => { live = false; };
  }, [patientUid, personId]);

  useEffect(() => {
    let live = true;
    setLogLoaded(false);
    getExerciseLogForDate(patientUid, personId, date)
      .then((log) => {
        if (!live) return;
        setCompletions(log.completions);
        setPhysioMarked(log.physioMarked);
        setLogLoaded(true);
      })
      .catch(() => {
        if (!live) return;
        setCompletions({});
        setPhysioMarked({});
        setLogLoaded(true);
      });
    return () => { live = false; };
  }, [patientUid, personId, date]);

  const byId = useMemo(() => new Map(allExercises.map((e) => [e.id, e])), []);
  const rows = (assigned ?? []).map((a) => ({ a, ex: byId.get(a.exerciseId) })).filter((r) => r.ex);
  const doneCount = rows.filter(({ a }) => completions[a.exerciseId]).length;
  const isFuture = date > todayKey();

  async function apply(changes: Record<string, boolean>, key: string) {
    setSaving(key);
    const prevC = completions;
    const prevP = physioMarked;
    setCompletions((c) => ({ ...c, ...changes }));
    setPhysioMarked((p) => ({ ...p, ...changes }));
    try {
      await setExerciseCompletionByPhysio(patientUid, personId, date, changes);
    } catch {
      setCompletions(prevC);
      setPhysioMarked(prevP);
      toast.show("Couldn't save. Try again.", "error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="panel stack admin-exercise-done" aria-labelledby="admin-exercise-done-title">
      <div className="admin-packages__head">
        <div>
          <h2 id="admin-exercise-done-title"><CheckCircle2 aria-hidden="true" /> Exercises done with the physio</h2>
          <p className="muted admin-packages__hint">
            Tick off exercises the patient did with you. It counts the same as the patient ticking them in their portal.
          </p>
        </div>
        <label className="admin-exercise-done__date">
          Day
          <input
            className="input"
            type="date"
            max={todayKey()}
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </label>
      </div>

      {assigned === null || !logLoaded ? (
        <SkeletonRow count={3} />
      ) : rows.length === 0 ? (
        <p className="muted admin-packages__hint">No exercises assigned yet. Assign them in the exercise plan below first.</p>
      ) : (
        <>
          <div className="admin-exercise-done__bar">
            <span><strong>{doneCount}</strong> of {rows.length} done on this day</span>
            <button
              type="button"
              className="button small secondary"
              disabled={isFuture || saving !== null || doneCount === rows.length}
              onClick={() => void apply(Object.fromEntries(rows.map(({ a }) => [a.exerciseId, true])), "all")}
            >
              {saving === "all" ? "Saving…" : "Mark all done"}
            </button>
          </div>
          <ul className="admin-exercise-done__list">
            {rows.map(({ a, ex }) => {
              const done = completions[a.exerciseId] === true;
              const dose = formatDosage(resolveDosage(ex!, a));
              return (
                <li key={a.exerciseId} className={done ? "is-done" : ""}>
                  <label>
                    <input
                      type="checkbox"
                      checked={done}
                      disabled={isFuture || saving !== null}
                      onChange={(e) => void apply({ [a.exerciseId]: e.target.checked }, a.exerciseId)}
                    />
                    <span className="admin-exercise-done__name">
                      {ex!.title}
                      {dose && <small className="muted"> · {dose}</small>}
                    </span>
                    {done && (
                      <small className="admin-exercise-done__by">{physioMarked[a.exerciseId] ? "with physio" : "by patient"}</small>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
