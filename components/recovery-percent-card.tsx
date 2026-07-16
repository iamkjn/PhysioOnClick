"use client";

import { useEffect, useState } from "react";
import { getRecoveryScoreSeries, computeRecoveryPercent, isRecoveryRegressing } from "@/lib/recovery";
import { Skeleton } from "@/components/skeleton";

interface Props {
  uid: string;
  personId: string;
}

export function RecoveryPercentCard({ uid, personId }: Props) {
  const [percent, setPercent] = useState<number | null | undefined>(undefined);
  const [regressing, setRegressing] = useState(false);
  // computeRecoveryPercent(logs) also returns null for a patient with no
  // check-ins yet, so a fetch failure needs its own flag — otherwise a real
  // network error renders the same welcoming "log your first check-in" copy
  // as a brand-new patient, which is misleading.
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    setPercent(undefined);
    setFetchError(false);
    getRecoveryScoreSeries(uid, personId, 9999)
      .then((logs) => {
        setPercent(computeRecoveryPercent(logs));
        setRegressing(isRecoveryRegressing(logs));
      })
      .catch(() => {
        setPercent(null);
        setFetchError(true);
      });
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
        <p className={fetchError ? "field-error" : "muted"}>
          {fetchError
            ? "Could not load your recovery score. Please try again."
            : "Log your first check-in to see your recovery score."}
        </p>
      </div>
    );
  }

  return (
    <div className="panel recovery-percent-card">
      <h3>Recovery score</h3>
      <div
        className="recovery-percent-value"
        style={{ fontFamily: "var(--font-serif)" }}
        aria-live="polite"
      >
        {percent}%
      </div>
      <p className="muted">
        {regressing
          ? "Pain is higher than your first check-in. Mention it at your next session."
          : "Improvement since your first pain check-in."}
      </p>
    </div>
  );
}
