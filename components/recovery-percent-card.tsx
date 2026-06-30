"use client";

import { useEffect, useState } from "react";
import { getPainLogs, computeRecoveryPercent } from "@/lib/recovery";

interface Props {
  uid: string;
  personId: string;
}

export function RecoveryPercentCard({ uid, personId }: Props) {
  const [percent, setPercent] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    setPercent(undefined);
    getPainLogs(uid, personId, 9999)
      .then((logs) => setPercent(computeRecoveryPercent(logs)))
      .catch(() => setPercent(null));
  }, [uid, personId]);

  if (percent === undefined) {
    return (
      <div className="panel recovery-percent-card">
        <p className="muted">Loading recovery score…</p>
      </div>
    );
  }

  if (percent === null) {
    return (
      <div className="panel recovery-percent-card">
        <h3>Recovery score</h3>
        <p className="muted">Log your first check-in to see your recovery score.</p>
      </div>
    );
  }

  return (
    <div className="panel recovery-percent-card">
      <h3>Recovery score</h3>
      <div className="recovery-percent-value">{percent}%</div>
      <p className="muted">Improvement since your first pain check-in.</p>
    </div>
  );
}
