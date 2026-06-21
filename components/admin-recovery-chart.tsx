// components/admin-recovery-chart.tsx
"use client";

import { RecoveryChart } from "@/components/recovery-chart";

interface Props {
  patientUid: string;
  personId: string;
}

export function AdminRecoveryChart({ patientUid, personId }: Props) {
  return <RecoveryChart uid={patientUid} personId={personId} />;
}
