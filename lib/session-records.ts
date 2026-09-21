// lib/session-records.ts
// Firestore helpers for the admin "Start Session" wizard's working document —
// one per booking at sessionRecords/{bookingId}. This persists progress
// (currentStep) so leaving and returning mid-session resumes where it left
// off, and accumulates the screening snapshot, self-test results, derived
// differential diagnosis, exercises assigned during the session, and the
// final summary block.

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AssessmentRedFlags, ConditionalRedFlags } from "@/lib/assessment-forms";
import type { SelfTestResult } from "@/lib/differential-diagnosis";
import type { DiagnosisCandidate } from "@/lib/differential-diagnosis";

export type SessionSummaryBlock = {
  painScore: number;
  recoveryPercent: number;
  sessionOutcome: "improving" | "stable" | "setback";
  workedOn: string;
  nextSteps: string;
  followUpWeeks: number;
};

export interface SessionRecord {
  bookingId: string;
  redFlagsSnapshot: {
    flags: AssessmentRedFlags;
    conditionalFlags: ConditionalRedFlags;
  };
  selfTestResults: SelfTestResult[];
  diagnosis: (DiagnosisCandidate & { confirmedByAdmin: boolean })[];
  exercisesAssignedAtSession: string[];
  summary?: SessionSummaryBlock;
  // NHS-guideline "safety netting" gate (sub-project #4): the form's
  // mandatory "what to do if things get worse" advice — required before
  // publish, tracked here rather than on the assessment form since it's
  // given live during the session, not something the patient fills in.
  safetyNettingProvided?: boolean;
  safetyNettingNotes?: string;
  currentStep: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

function sessionRef(bookingId: string) {
  if (!db) throw new Error("Firestore not available");
  return doc(db, "sessionRecords", bookingId);
}

function toDate(value: unknown): Date | null {
  if (value && typeof value === "object" && "toDate" in value) {
    try {
      return (value as Timestamp).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

function mapSessionRecord(id: string, data: Record<string, unknown>): SessionRecord {
  return {
    bookingId: id,
    redFlagsSnapshot: (data.redFlagsSnapshot as SessionRecord["redFlagsSnapshot"]) ?? {
      flags: {} as AssessmentRedFlags,
      conditionalFlags: {},
    },
    selfTestResults: Array.isArray(data.selfTestResults) ? (data.selfTestResults as SelfTestResult[]) : [],
    diagnosis: Array.isArray(data.diagnosis)
      ? (data.diagnosis as SessionRecord["diagnosis"])
      : [],
    exercisesAssignedAtSession: Array.isArray(data.exercisesAssignedAtSession)
      ? (data.exercisesAssignedAtSession as string[])
      : [],
    summary: (data.summary as SessionSummaryBlock | undefined) ?? undefined,
    safetyNettingProvided: data.safetyNettingProvided === true,
    safetyNettingNotes: typeof data.safetyNettingNotes === "string" ? data.safetyNettingNotes : undefined,
    currentStep: typeof data.currentStep === "number" ? data.currentStep : 1,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getSessionRecord(bookingId: string): Promise<SessionRecord | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "sessionRecords", bookingId));
  if (!snap.exists()) return null;
  return mapSessionRecord(snap.id, snap.data() as Record<string, unknown>);
}

/**
 * Fetches the existing session record for this booking, or creates one
 * seeded with `initialRedFlagsSnapshot` (from the patient's submitted
 * assessment form) when none exists yet.
 */
export async function getOrCreateSessionRecord(
  bookingId: string,
  initialRedFlagsSnapshot: SessionRecord["redFlagsSnapshot"],
): Promise<SessionRecord> {
  const existing = await getSessionRecord(bookingId);
  if (existing) return existing;

  const ref = sessionRef(bookingId);
  await setDoc(ref, {
    bookingId,
    redFlagsSnapshot: initialRedFlagsSnapshot,
    selfTestResults: [],
    diagnosis: [],
    exercisesAssignedAtSession: [],
    currentStep: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const created = await getSessionRecord(bookingId);
  if (!created) throw new Error("Failed to create session record");
  return created;
}

export async function updateSessionRecordStep(
  bookingId: string,
  partial: Partial<Omit<SessionRecord, "bookingId" | "createdAt" | "updatedAt">>,
): Promise<void> {
  if (!db) throw new Error("Firestore not available");
  const ref = sessionRef(bookingId);
  await setDoc(
    ref,
    {
      ...partial,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
