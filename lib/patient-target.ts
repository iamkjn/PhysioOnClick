// lib/patient-target.ts
//
// One place that answers "whose recovery record is this page showing?".
//
// Every recovery path is `patients/{ownerUid}/people/{personId}/...`. Before
// carer access the owner was always the signed-in user, so pages passed
// `user.uid` straight through. Now there are three cases:
//
//   self       — the signed-in user's own record:  owner = me,      person = me
//   dependent  — someone I manage (no login):       owner = me,      person = depId
//   carer      — a patient who listed my email:     owner = patient, person = patient
//
// A carer only ever reaches the patient's OWN record (never the patient's
// dependents) — firestore.rules enforces the same (`isCarerOf` needs
// personId == userId).

export type PatientTargetMode = "self" | "dependent" | "carer";

export interface PatientTarget {
  /** uid of the account whose `patients/{uid}` tree is being read/written. */
  ownerUid: string;
  /** `people/{personId}` within that tree. */
  personId: string;
  mode: PatientTargetMode;
}

export interface PersonSelection {
  /** Active dependent of the signed-in account, or null for self. */
  personId: string | null;
  /** Patient being cared for, or null when not in carer mode. */
  careForUid: string | null;
  /**
   * The signed-in uid that chose `careForUid`. A carer selection persisted in
   * localStorage by a different account on the same browser is ignored.
   */
  careForViewerUid?: string | null;
}

export function resolvePatientTarget(authUid: string, selection: PersonSelection | null | undefined): PatientTarget {
  const careForUid = selection?.careForUid ?? null;
  const viewer = selection?.careForViewerUid ?? null;
  if (careForUid && careForUid !== authUid && (viewer === null || viewer === authUid)) {
    return { ownerUid: careForUid, personId: careForUid, mode: "carer" };
  }
  const personId = selection?.personId ?? null;
  if (personId && personId !== authUid) {
    return { ownerUid: authUid, personId, mode: "dependent" };
  }
  return { ownerUid: authUid, personId: authUid, mode: "self" };
}

/** Value used for a "Caring for" option in the person switcher's <select>. */
export const CARER_OPTION_PREFIX = "carer:";

export function carerOptionValue(patientUid: string): string {
  return `${CARER_OPTION_PREFIX}${patientUid}`;
}

export function parseCarerOptionValue(value: string): string | null {
  if (!value.startsWith(CARER_OPTION_PREFIX)) return null;
  const uid = value.slice(CARER_OPTION_PREFIX.length);
  return uid || null;
}
