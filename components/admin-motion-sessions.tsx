// components/admin-motion-sessions.tsx
"use client";

import { useEffect, useState } from "react";
import { getMotionSessions, type MotionSession } from "@/lib/motion";
import { exercises as allExercises } from "@/lib/site-data";
import { SkeletonTable } from "@/components/skeleton";

interface Props {
  patientUid: string;
  personId: string;
}

const exerciseTitles = new Map(allExercises.map((e) => [e.id, e.title]));

// Read-only review of a patient's recent "Check your motion" attempts, for
// the physio to sanity-check against what they see in clinic. No video is
// ever stored — only the derived rep/ROM/quality numbers saved by
// components/motion-check.tsx.
export function AdminMotionSessions({ patientUid, personId }: Props) {
  const [sessions, setSessions] = useState<MotionSession[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    getMotionSessions(patientUid, personId).then((s) => {
      if (cancelled) return;
      setSessions(s);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [patientUid, personId]);

  if (!loaded) {
    return (
      <div className="panel stack">
        <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Motion check sessions</h2>
        <SkeletonTable rows={3} columns={6} />
      </div>
    );
  }

  return (
    <div className="panel stack">
      <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Motion check sessions</h2>
      {sessions.length === 0 && <p className="muted">No motion check sessions yet.</p>}
      {sessions.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table className="dashboard-table">
            <caption className="sr-only">Recent &quot;Check your motion&quot; sessions for this patient</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Exercise</th>
                <th scope="col">Reps</th>
                <th scope="col">ROM achieved</th>
                <th scope="col">Quality</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={`${s.exerciseId}-${s.date}-${i}`}>
                  <td>{s.date}</td>
                  <td>{exerciseTitles.get(s.exerciseId) ?? s.bodyPart}</td>
                  <td>{s.reps} / {s.repTarget}</td>
                  <td>
                    {s.romMin}&deg;&ndash;{s.romMax}&deg;{" "}
                    <span className="muted">(target {s.targetRomMin}&deg;&ndash;{s.targetRomMax}&deg;)</span>
                  </td>
                  <td>{Math.round(s.avgQuality)}%</td>
                  <td>
                    <span className={`dashboard-status-pill ${s.passed ? "status-confirmed" : "status-cancelled"}`}>
                      {s.passed ? "Passed" : "Needs work"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminMotionSessions;
