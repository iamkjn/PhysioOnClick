"use client";

import { useEffect, useState } from "react";
import { getRecoveryScoreSeries, computeRecoveryPercent } from "@/lib/recovery";
import { Skeleton } from "@/components/skeleton";

interface Props {
  uid: string;
  personId: string;
}

export function RecoveryPercentCard({ uid, personId }: Props) {
  const [percent, setPercent] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    setPercent(undefined);
    getRecoveryScoreSeries(uid, personId, 9999)
      .then((logs) => setPercent(computeRecoveryPercent(logs)))
      .catch(() => setPercent(null));
  }, [uid, personId]);

  if (percent === undefined) {
    return (
      <div className="panel recovery-percent-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton height="2.5rem" width="80px" />
          <Skeleton height="1rem" width="140px" />
        </div>
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
