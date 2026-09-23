"use client";

// components/start-session-flow.tsx
// Full-screen, 5-step "Start Session" wizard for admins: Screening ->
// Self-Check Tests -> Differential Diagnosis -> Exercises -> Summary.
// Mirrors the visual pattern of components/assessment-wizard.tsx (itself
// modelled on booking-flow.tsx): a progress bar + step count header, one
// full-viewport step at a time, back/continue nav.
//
// Persists to sessionRecords/{bookingId} (lib/session-records.ts) so leaving
// and returning mid-session resumes at `currentStep`.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { getBooking, type BookingRecord } from "@/lib/patient-bookings";
import {
  getPatientAssessmentForms,
  recordRedFlagChange,
  updateAssessmentRiskPlan,
  levelOfConcern,
  defaultRedFlags,
  CONDITIONAL_RED_FLAG_FIELDS,
  CONDITION_GROUP_LABELS,
  RED_FLAG_FIELD_LABELS,
  type AssessmentRedFlags,
  type ConditionGroup,
  type ConditionalRedFlags,
  type PatientAssessmentFormRecord,
  type RedFlagAuditEntry,
} from "@/lib/assessment-forms";
import { regionToConditionGroups } from "@/lib/red-flag-groups";
import {
  getOrCreateSessionRecord,
  updateSessionRecordStep,
  type SessionRecord,
  type SessionSummaryBlock,
} from "@/lib/session-records";
import { selfTests, type SelfTest } from "@/lib/self-tests";
import { SelfTestImage } from "@/components/exercise-library/self-test-image";
import { SelfTestSteps } from "@/components/exercise-library/self-test-steps";
import { ExerciseImage } from "@/components/exercise-image";
import { deriveDifferentialDiagnosis, type SelfTestResult, type DiagnosisCandidate } from "@/lib/differential-diagnosis";
import { suggestExercises } from "@/lib/exercise-suggestions";
import { assignExercise, getAssignedExercises } from "@/lib/recovery";
import { getStreakGoal, setStreakGoal } from "@/lib/goals";
import { publishSummary, type PublishSummaryInput } from "@/app/admin/actions";
import { useToast } from "@/components/toast-provider";
import { SkeletonRow } from "@/components/skeleton";
import { AdminExerciseAssigner } from "@/components/admin-exercise-assigner";

function getPainColor(score: number): string {
  if (score <= 3) return "var(--color-success)";
  if (score <= 6) return "var(--color-warning, #D97706)";
  return "var(--color-error)";
}

// Ported from the retired components/summary-form.tsx (merged into this
// wizard's Summary step) — same visual, no behaviour change.
function RecoveryRing({ percent }: { percent: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, percent)) / 100) * circ;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="summary-ring">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 32 32)" className="summary-ring-arc" />
      <text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-navy)" fontFamily="var(--font-sans)">{percent}%</text>
    </svg>
  );
}

interface Props {
  bookingId: string;
}

const STEPS = [
  { label: "Screening", description: "Review safety checks and document any clinical concerns." },
  { label: "Self-check tests", description: "Record the relevant movement and symptom checks." },
  { label: "Clinical impression", description: "Confirm or dismiss the suggested clinical possibilities." },
  { label: "Exercise plan", description: "Choose the exercises that support today\'s treatment plan." },
  { label: "Session summary", description: "Capture outcomes, next steps and publish the patient plan." },
] as const;

const CONCERN_COLORS: Record<string, { bg: string; fg: string }> = {
  none: { bg: "var(--color-success-light)", fg: "var(--color-success)" },
  few: { bg: "rgba(217, 119, 6, 0.15)", fg: "var(--color-warning, #D97706)" },
  some: { bg: "rgba(217, 119, 6, 0.25)", fg: "var(--color-warning, #D97706)" },
  emergency: { bg: "var(--color-error-light)", fg: "var(--color-error)" },
};

const CONCERN_TEXT: Record<string, string> = {
  none: "No red flags recorded.",
  few: "A small number of lower-severity flags recorded — proceed with awareness.",
  some: "Several flags recorded — consider whether onward referral is needed.",
  emergency: "Urgent flags recorded. Consider stopping the session and seeking urgent medical advice.",
};

export function StartSessionFlow({ bookingId }: Props) {
  const toast = useToast();
  const adminUid = auth?.currentUser?.uid ?? "";

  const [booking, setBooking] = useState<BookingRecord | null | undefined>(undefined);
  const [form, setForm] = useState<PatientAssessmentFormRecord | null | undefined>(undefined);
  const [record, setRecord] = useState<SessionRecord | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Working copies of editable state per step.
  const [flags, setFlags] = useState<AssessmentRedFlags>({ ...defaultRedFlags });
  const [conditionalFlags, setConditionalFlags] = useState<ConditionalRedFlags>({});
  const [selfTestResults, setSelfTestResults] = useState<SelfTestResult[]>([]);
  const [diagnosis, setDiagnosis] = useState<(DiagnosisCandidate & { confirmedByAdmin: boolean })[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummaryBlock>({
    painScore: 5,
    recoveryPercent: 50,
    sessionOutcome: "improving",
    workedOn: "",
    nextSteps: "",
    followUpWeeks: 2,
  });
  const [publishing, setPublishing] = useState(false);
  const [publishedSummaryId, setPublishedSummaryId] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [streakGoal, setStreakGoalState] = useState(0);

  // Sub-project #4 — UK-guideline hard-gate nudges, derived from the NHS
  // Lothian MSK form: (1) acknowledge elevated concern before proceeding
  // past screening, (2) document reasoning when a red flag is positive,
  // (3) confirm safety-netting advice was given before publish.
  const [concernAck, setConcernAck] = useState(false);
  const [ackedConcern, setAckedConcern] = useState<string | null>(null);
  const [riskPlanText, setRiskPlanText] = useState("");
  const [savingRiskPlan, setSavingRiskPlan] = useState(false);
  const [safetyNettingProvided, setSafetyNettingProvided] = useState(false);
  const [safetyNettingNotes, setSafetyNettingNotes] = useState("");

  const patientUid = booking?.bookedBy ?? form?.submittedByUid ?? "";
  const personId = booking?.patientId ?? patientUid;
  const patientType = personId && patientUid && personId !== patientUid ? "dependent" : "self";

  // ── Load booking, patient's assessment form, and/or create the session record ──
  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      const b = await getBooking(bookingId).catch(() => null);
      if (!live) return;
      setBooking(b);
      if (!b) { setLoading(false); return; }

      let matchedForm: PatientAssessmentFormRecord | null = null;
      try {
        if (b.bookedBy) {
          const forms = await getPatientAssessmentForms(b.bookedBy, b.patientId || b.bookedBy);
          matchedForm = forms.find((f) => f.bookingId === bookingId) ?? forms[0] ?? null;
        }
      } catch {
        /* best effort — screening simply starts blank if this fails */
      }
      if (!live) return;
      setForm(matchedForm);

      const snapshot = matchedForm
        ? { flags: matchedForm.redFlags, conditionalFlags: matchedForm.conditionalFlags }
        : { flags: { ...defaultRedFlags }, conditionalFlags: {} };

      const rec = await getOrCreateSessionRecord(bookingId, snapshot);
      if (!live) return;
      setRecord(rec);
      setStep(rec.currentStep || 1);
      setFlags(rec.redFlagsSnapshot.flags ?? snapshot.flags);
      setConditionalFlags(rec.redFlagsSnapshot.conditionalFlags ?? snapshot.conditionalFlags);
      setSelfTestResults(rec.selfTestResults ?? []);
      setDiagnosis(rec.diagnosis ?? []);
      if (rec.summary) setSummary(rec.summary);
      setRiskPlanText(matchedForm?.riskPlan ?? "");
      setSafetyNettingProvided(rec.safetyNettingProvided === true);
      setSafetyNettingNotes(rec.safetyNettingNotes ?? "");
      // If reasoning was already documented (e.g. a returning session), treat
      // whatever concern level applies now as pre-acknowledged so the nudge
      // doesn't re-fire on every reopen for a session already actioned.
      const initialConcern = levelOfConcern(
        rec.redFlagsSnapshot.flags ?? snapshot.flags,
        rec.redFlagsSnapshot.conditionalFlags ?? snapshot.conditionalFlags,
      );
      if ((matchedForm?.riskPlan ?? "").trim()) {
        setConcernAck(true);
        setAckedConcern(initialConcern);
      }

      setLoading(false);
    })();
    return () => { live = false; };
  }, [bookingId]);

  // Load currently-assigned exercise ids for the "already assigned" exclusion.
  useEffect(() => {
    if (!patientUid || !personId) return;
    let live = true;
    getAssignedExercises(patientUid, personId)
      .then((a) => { if (live) setAssignedIds(a.map((x) => x.exerciseId)); })
      .catch(() => {});
    getStreakGoal(patientUid, personId)
      .then((g) => { if (live) setStreakGoalState(g ?? 0); })
      .catch(() => {});
    return () => { live = false; };
  }, [patientUid, personId]);

  async function handleStreakGoal(days: number) {
    if (!patientUid || !personId || !adminUid) return;
    setStreakGoalState(days);
    try {
      await setStreakGoal(patientUid, personId, days, adminUid);
      toast.show(`Daily streak goal set to ${days} days.`, "success");
    } catch {
      toast.show("Could not set streak goal. Try again.", "error");
    }
  }

  async function goToStep(next: number) {
    setStep(next);
    try {
      await updateSessionRecordStep(bookingId, { currentStep: next });
    } catch {
      /* non-fatal — the user can still navigate this session */
    }
  }

  // ── Step 1: Screening ──────────────────────────────────────────────────
  const concern = useMemo(() => levelOfConcern(flags, conditionalFlags), [flags, conditionalFlags]);
  const relevantGroups = useMemo(
    () => (form?.bodyRegions ? regionToConditionGroups(form.bodyRegions) : (Object.keys(conditionalFlags) as ConditionGroup[])),
    [form, conditionalFlags]
  );

  // Sub-project #4 gates. Any positive common or conditional flag needs a
  // documented reason; "some"/"emergency" concern needs an explicit
  // acknowledgement before the admin can move past screening.
  const hasPositiveFlag = useMemo(() => {
    const commonPositive = (Object.keys(flags) as (keyof AssessmentRedFlags)[])
      .filter((k) => k !== "none")
      .some((k) => flags[k] === true);
    const conditionalPositive = Object.values(conditionalFlags).some((group) =>
      Object.values(group ?? {}).some((v) => v === true)
    );
    return commonPositive || conditionalPositive;
  }, [flags, conditionalFlags]);
  const needsConcernAck = concern === "some" || concern === "emergency";
  const concernAckSatisfied = !needsConcernAck || (concernAck && ackedConcern === concern);
  const riskPlanSatisfied = !hasPositiveFlag || riskPlanText.trim().length > 0;
  const screeningGateSatisfied = concernAckSatisfied && riskPlanSatisfied;

  async function saveRiskPlan(value: string) {
    setRiskPlanText(value);
    if (!form || !patientUid || !personId) return;
    setSavingRiskPlan(true);
    try {
      await updateAssessmentRiskPlan(patientUid, personId, form.id, value);
    } catch {
      toast.show("Could not save that note. Try again.", "error");
    } finally {
      setSavingRiskPlan(false);
    }
  }

  async function toggleCommonFlag(key: keyof AssessmentRedFlags) {
    if (key === "none" || !form) return;
    const from = flags[key];
    const to = !from;
    const nextFlags = { ...flags, [key]: to, none: false };
    setFlags(nextFlags);
    await persistFlagChange(key, from, to, nextFlags, conditionalFlags);
  }

  async function toggleConditionalFlagField(group: ConditionGroup, key: string) {
    if (!form || !patientUid || !personId) return;
    const groupFields = conditionalFlags[group] ?? {};
    const from = groupFields[key] === true;
    const to = !from;
    const nextConditional: ConditionalRedFlags = { ...conditionalFlags, [group]: { ...groupFields, [key]: to } };
    setConditionalFlags(nextConditional);
    await persistFlagChange(`${group}.${key}`, from, to, flags, nextConditional);
  }

  async function persistFlagChange(
    field: string,
    from: boolean,
    to: boolean,
    nextFlags: AssessmentRedFlags,
    nextConditional: ConditionalRedFlags,
  ) {
    if (!form) return;
    const entry: RedFlagAuditEntry = {
      field,
      from,
      to,
      changedBy: adminUid,
      changedAt: new Date().toISOString(),
      source: "admin_session",
    };
    try {
      await recordRedFlagChange(patientUid, personId, form.id, [entry], nextFlags, nextConditional);
      await updateSessionRecordStep(bookingId, { redFlagsSnapshot: { flags: nextFlags, conditionalFlags: nextConditional } });
    } catch {
      toast.show("Could not save that change. Try again.", "error");
    }
  }

  // ── Step 2: Self-check tests ─────────────────────────────────────────
  const candidateTests: SelfTest[] = useMemo(() => {
    if (!form) return selfTests.slice(0, 6);
    const area = form.bodyArea.toLowerCase();
    const matched = selfTests.filter((t) => area.includes(t.bodyArea.toLowerCase()));
    return matched.length > 0 ? matched : selfTests;
  }, [form]);

  // "Present" mode: a focused, one-test-at-a-time view for screen-sharing to
  // the patient over Zoom/Cal.com during the call — large images + full
  // instructions instead of the dense grid, admin still records results here.
  const [presenting, setPresenting] = useState(false);
  const [presentIndex, setPresentIndex] = useState(0);
  const presentedTest = candidateTests[presentIndex] ?? null;

  function setTestResult(slug: string, result: "positive" | "negative", notes?: string) {
    setSelfTestResults((prev) => {
      const idx = prev.findIndex((r) => r.slug === slug);
      const next = [...prev];
      const entry: SelfTestResult = notes ? { slug, result, notes } : { slug, result };
      if (idx >= 0) next[idx] = entry;
      else next.push(entry);
      return next;
    });
  }

  async function saveSelfTests() {
    await updateSessionRecordStep(bookingId, { selfTestResults });
  }

  // ── Step 3: Differential diagnosis ───────────────────────────────────
  const derivedCandidates = useMemo(
    () => deriveDifferentialDiagnosis(selfTestResults, form?.subjective.clinicalArea),
    [selfTestResults, form]
  );

  useEffect(() => {
    // Merge freshly-derived candidates with any prior confirm/dismiss state,
    // without clobbering admin decisions already made this session.
    setDiagnosis((prev) => {
      const prevBySlug = new Map(prev.map((d) => [d.conditionSlug, d]));
      return derivedCandidates.map((c) => ({
        ...c,
        confirmedByAdmin: prevBySlug.get(c.conditionSlug)?.confirmedByAdmin ?? false,
      }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- derive once per test-result change; confirm state is merged in above.
  }, [derivedCandidates]);

  function toggleConfirm(conditionSlug: string) {
    setDiagnosis((prev) =>
      prev.map((d) => (d.conditionSlug === conditionSlug ? { ...d, confirmedByAdmin: !d.confirmedByAdmin } : d))
    );
  }
  function dismissCandidate(conditionSlug: string) {
    setDiagnosis((prev) => prev.filter((d) => d.conditionSlug !== conditionSlug));
  }
  async function saveDiagnosis() {
    await updateSessionRecordStep(bookingId, { diagnosis });
  }

  // ── Step 4: Exercises ─────────────────────────────────────────────────
  const confirmedSlugs = diagnosis.filter((d) => d.confirmedByAdmin).map((d) => d.label).join(" ");
  const suggestions = useMemo(
    () =>
      suggestExercises(
        { clinicalArea: form?.subjective.clinicalArea, freeText: confirmedSlugs, alreadyAssignedIds: assignedIds },
        9
      ),
    [form, confirmedSlugs, assignedIds]
  );

  async function handleAssignAtSession(exerciseId: string) {
    if (!patientUid || !personId || !adminUid) {
      toast.show("Not signed in — please refresh and try again.", "error");
      return;
    }
    setAssigningId(exerciseId);
    try {
      await assignExercise(patientUid, personId, exerciseId, adminUid);
      setAssignedIds((prev) => [...prev, exerciseId]);
      const updated = record ? [...record.exercisesAssignedAtSession, exerciseId] : [exerciseId];
      await updateSessionRecordStep(bookingId, { exercisesAssignedAtSession: updated });
      setRecord((prev) => (prev ? { ...prev, exercisesAssignedAtSession: updated } : prev));
    } catch {
      toast.show("Could not assign exercise. Try again.", "error");
    } finally {
      setAssigningId(null);
    }
  }

  // ── Step 5: Summary ───────────────────────────────────────────────────
  async function handlePublish() {
    if (!booking || !patientUid || !personId) return;
    if (!summary.workedOn.trim() || !summary.nextSteps.trim()) {
      toast.show("Fill in both session note fields to publish.", "error");
      return;
    }
    if (!safetyNettingProvided) {
      toast.show("Confirm safety-netting advice was given before publishing.", "error");
      return;
    }
    setPublishing(true);
    try {
      const idToken = await auth?.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in");
      const input: PublishSummaryInput = {
        bookingId,
        patientId: personId,
        patientType,
        patientName: booking.patientName,
        service: booking.service,
        painScore: summary.painScore,
        recoveryPercent: summary.recoveryPercent,
        sessionOutcome: summary.sessionOutcome,
        workedOn: summary.workedOn,
        exercises: "See the exercises assigned to you in the app.",
        nextSteps: summary.nextSteps,
        followUpWeeks: summary.followUpWeeks,
      };
      const { summaryId } = await publishSummary(input, idToken);
      await updateSessionRecordStep(bookingId, {
        summary,
        currentStep: 5,
        safetyNettingProvided,
        safetyNettingNotes,
      });
      setPublishedSummaryId(summaryId);
      toast.show("Session published.", "success");
    } catch {
      toast.show("Could not publish. Please try again.", "error");
    } finally {
      setPublishing(false);
    }
  }

  // Re-trigger the exercise-plan handout email for the summary just
  // published — mirrors the retired components/summary-form.tsx's resend
  // button exactly (same admin route, same CRON_SECRET-free auth path).
  async function handleResendPlan() {
    if (!publishedSummaryId) return;
    setResending(true);
    try {
      const idToken = await auth?.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in");
      const res = await fetch("/api/admin/exercise-plan/resend", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}`, "content-type": "application/json" },
        body: JSON.stringify({ summaryId: publishedSummaryId }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as { emailed?: boolean; skipped?: string; ok?: boolean };
      if (data.skipped) {
        toast.show(`Plan email skipped: ${data.skipped}.`, "warning");
      } else if (data.emailed === false || data.ok === false) {
        toast.show("Plan rebuilt, but the email did not send. Try again.", "error");
      } else {
        toast.show("Exercise plan email resent.", "success");
      }
    } catch {
      toast.show("Could not resend the plan email. Try again.", "error");
    } finally {
      setResending(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  if (loading || booking === undefined) {
    return (
      <div className="assessment-wizard">
        <SkeletonRow count={5} />
      </div>
    );
  }
  if (!booking) {
    return (
      <div className="panel stack">
        <p className="muted">This booking couldn&apos;t be found.</p>
      </div>
    );
  }

  const progress = Math.round((step / STEPS.length) * 100);

  return (
    <div className="assessment-wizard" style={{ maxWidth: 880 }}>
      <div className="assessment-wizard__progress-row">
        <div className="assessment-wizard__progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <span className="assessment-wizard__step-count">
          Step {step} of {STEPS.length} · {STEPS[step - 1].label}
        </span>
      </div>

      <div className="assessment-wizard__stage" key={step}>
        <div className="assessment-wizard__panel stack">
          <h1>{booking.patientName} · {booking.service}</h1>

          {step === 1 && (
            <>
              <div
                className="dashboard-status-pill"
                role="status"
                style={{ background: CONCERN_COLORS[concern].bg, color: CONCERN_COLORS[concern].fg, fontWeight: 700 }}
              >
                Level of concern: {concern.toUpperCase()}
              </div>
              <p className="muted" style={{ fontSize: "var(--text-sm)" }}>{CONCERN_TEXT[concern]}</p>
              {!form && (
                <p className="field-error" style={{ fontSize: "var(--text-sm)" }}>
                  No submitted assessment form was found for this booking, so red flags can&apos;t be recorded here —
                  there&apos;s no assessment record to attach them to. Ask the patient to submit one, or note any
                  concerns directly in this session&apos;s summary instead.
                </p>
              )}
              <h3 style={{ fontSize: "var(--text-md)" }}>Common red flags</h3>
              <div className="assessment-wizard__flags">
                {(Object.keys(defaultRedFlags) as (keyof AssessmentRedFlags)[])
                  .filter((k) => k !== "none")
                  .map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="assessment-wizard__flag"
                      aria-pressed={flags[key]}
                      disabled={!form}
                      title={!form ? "No assessment form to update for this booking" : undefined}
                      onClick={() => void toggleCommonFlag(key)}
                    >
                      {RED_FLAG_FIELD_LABELS[key] ?? key}
                    </button>
                  ))}
              </div>
              {relevantGroups.map((group) => (
                <fieldset key={group} className="assessment-wizard__chips" style={{ marginTop: "0.5rem" }}>
                  <legend>{CONDITION_GROUP_LABELS[group]}</legend>
                  <div className="assessment-wizard__flags">
                    {CONDITIONAL_RED_FLAG_FIELDS[group].map((f) => (
                      <button
                        key={f}
                        type="button"
                        className="assessment-wizard__flag"
                        aria-pressed={conditionalFlags[group]?.[f] === true}
                        disabled={!form}
                        title={!form ? "No assessment form to update for this booking" : undefined}
                        onClick={() => void toggleConditionalFlagField(group, f)}
                      >
                        {RED_FLAG_FIELD_LABELS[f] ?? f}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}

              {hasPositiveFlag && (
                <div className="panel stack" style={{ borderColor: "var(--color-warning, #b5691a)" }}>
                  <label htmlFor="risk-plan-note">
                    <strong>Action taken / reasoning for the flag(s) above *</strong>
                  </label>
                  <textarea
                    id="risk-plan-note"
                    rows={3}
                    value={riskPlanText}
                    onChange={(e) => setRiskPlanText(e.target.value)}
                    onBlur={(e) => void saveRiskPlan(e.target.value)}
                    placeholder="e.g. discussed with patient, safe to proceed with modified exercises / referred to GP same day..."
                  />
                  <span className="muted" style={{ fontSize: "var(--text-xs)" }}>
                    {savingRiskPlan ? "Saving…" : "Required before continuing — saved to the patient's assessment record."}
                  </span>
                </div>
              )}

              {needsConcernAck && (
                <div className="panel stack" style={{ borderColor: "var(--color-error)" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "var(--text-sm)" }}>
                    <input
                      type="checkbox"
                      checked={concernAckSatisfied}
                      onChange={(e) => {
                        setConcernAck(e.target.checked);
                        setAckedConcern(e.target.checked ? concern : null);
                      }}
                    />
                    <span>
                      I&apos;ve considered whether urgent referral is needed before proceeding, per NHS screening
                      guidance ({concern === "emergency" ? "do not begin a trial of therapy" : "proceed with vigilance"}).
                    </span>
                  </label>
                </div>
              )}
            </>
          )}

          {step === 2 && !presenting && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <p className="muted" style={{ fontSize: "var(--text-sm)", margin: 0 }}>
                  Pick relevant self-check tests and record positive/negative.
                </p>
                {candidateTests.length > 0 && (
                  <button
                    type="button"
                    className="assign-edit-dose"
                    onClick={() => { setPresentIndex(0); setPresenting(true); }}
                  >
                    Present to patient →
                  </button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-3)" }}>
                {candidateTests.map((t) => {
                  const current = selfTestResults.find((r) => r.slug === t.slug);
                  return (
                    <div key={t.slug} className="panel stack" style={{ padding: "var(--space-3)" }}>
                      {t.steps[0] && (
                        <SelfTestImage imageId={t.steps[0].imageId} label={t.name} stepNumber={1} />
                      )}
                      <strong style={{ fontSize: "var(--text-sm)" }}>{t.name}</strong>
                      <span className="muted" style={{ fontSize: "var(--text-xs)" }}>{t.assesses}</span>
                      <div className="summary-chip-row">
                        <button
                          type="button"
                          className="summary-chip"
                          aria-pressed={current?.result === "positive"}
                          style={{
                            background: current?.result === "positive" ? "var(--color-error-light)" : "var(--color-surface)",
                            color: current?.result === "positive" ? "var(--color-error)" : "var(--color-text-secondary)",
                            border: `1.5px solid ${current?.result === "positive" ? "var(--color-error)" : "var(--color-border)"}`,
                          }}
                          onClick={() => setTestResult(t.slug, "positive", current?.notes)}
                        >
                          Positive
                        </button>
                        <button
                          type="button"
                          className="summary-chip"
                          aria-pressed={current?.result === "negative"}
                          style={{
                            background: current?.result === "negative" ? "var(--color-success-light)" : "var(--color-surface)",
                            color: current?.result === "negative" ? "var(--color-success)" : "var(--color-text-secondary)",
                            border: `1.5px solid ${current?.result === "negative" ? "var(--color-success)" : "var(--color-border)"}`,
                          }}
                          onClick={() => setTestResult(t.slug, "negative", current?.notes)}
                        >
                          Negative
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && presenting && presentedTest && (
            <div className="self-test-present stack">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <span className="muted" style={{ fontSize: "var(--text-sm)" }}>
                  Test {presentIndex + 1} of {candidateTests.length}
                </span>
                <button type="button" className="assign-remove" onClick={() => setPresenting(false)}>
                  Exit present mode
                </button>
              </div>

              <h2 style={{ margin: 0 }}>{presentedTest.name}</h2>
              <p className="muted" style={{ fontSize: "var(--text-md)" }}>{presentedTest.whatItChecks}</p>

              <SelfTestSteps steps={presentedTest.steps} testName={presentedTest.name} />

              <div className="self-test-present__interpretation">
                <div className="self-test-present__result self-test-present__result--negative">
                  <strong>Negative / normal</strong>
                  <ul>{presentedTest.negativeResult.map((line, i) => <li key={i}>{line}</li>)}</ul>
                </div>
                <div className="self-test-present__result self-test-present__result--positive">
                  <strong>Positive</strong>
                  <ul>{presentedTest.positiveResult.map((line, i) => <li key={i}>{line}</li>)}</ul>
                </div>
              </div>
              <p className="muted" style={{ fontSize: "var(--text-sm)" }}>{presentedTest.interpretation}</p>

              {(() => {
                const current = selfTestResults.find((r) => r.slug === presentedTest.slug);
                return (
                  <div className="summary-chip-row" style={{ marginTop: "var(--space-2)" }}>
                    <button
                      type="button"
                      className="summary-chip self-test-present__big-chip"
                      aria-pressed={current?.result === "positive"}
                      style={{
                        background: current?.result === "positive" ? "var(--color-error-light)" : "var(--color-surface)",
                        color: current?.result === "positive" ? "var(--color-error)" : "var(--color-text-secondary)",
                        border: `2px solid ${current?.result === "positive" ? "var(--color-error)" : "var(--color-border)"}`,
                      }}
                      onClick={() => setTestResult(presentedTest.slug, "positive", current?.notes)}
                    >
                      Positive
                    </button>
                    <button
                      type="button"
                      className="summary-chip self-test-present__big-chip"
                      aria-pressed={current?.result === "negative"}
                      style={{
                        background: current?.result === "negative" ? "var(--color-success-light)" : "var(--color-surface)",
                        color: current?.result === "negative" ? "var(--color-success)" : "var(--color-text-secondary)",
                        border: `2px solid ${current?.result === "negative" ? "var(--color-success)" : "var(--color-border)"}`,
                      }}
                      onClick={() => setTestResult(presentedTest.slug, "negative", current?.notes)}
                    >
                      Negative
                    </button>
                  </div>
                );
              })()}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-3)" }}>
                <button
                  type="button"
                  className="assign-edit-dose"
                  disabled={presentIndex === 0}
                  onClick={() => setPresentIndex((i) => Math.max(0, i - 1))}
                >
                  ← Previous test
                </button>
                <button
                  type="button"
                  className="assign-edit-dose"
                  disabled={presentIndex >= candidateTests.length - 1}
                  onClick={() => setPresentIndex((i) => Math.min(candidateTests.length - 1, i + 1))}
                >
                  Next test →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <>
              <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
                Ranked from positive self-check results. Confirm the ones that match your clinical judgement, or dismiss.
              </p>
              {diagnosis.length === 0 ? (
                <p className="muted">No candidates yet — mark some self-check tests positive on the previous step.</p>
              ) : (
                <div style={{ display: "grid", gap: "var(--space-2)" }}>
                  {diagnosis.map((d) => (
                    <div key={d.conditionSlug} className="assign-row">
                      <span className="assign-row-label">
                        {d.label} {d.confirmedByAdmin && <span className="dashboard-status-pill status-confirmed">Confirmed</span>}
                      </span>
                      <span className="assign-row-actions">
                        <button type="button" className="assign-edit-dose" onClick={() => toggleConfirm(d.conditionSlug)}>
                          {d.confirmedByAdmin ? "Unconfirm" : "Confirm"}
                        </button>
                        <button type="button" className="assign-remove" onClick={() => dismissCandidate(d.conditionSlug)}>
                          Dismiss
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
                Suggested from the clinical area and confirmed diagnosis. Assigning here adds instantly to the patient&apos;s plan.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-3)" }}>
                {suggestions.map((s) => (
                  <div key={s.exercise.id} className="panel stack" style={{ padding: "var(--space-3)" }}>
                    <ExerciseImage exerciseId={s.exercise.id} name={s.exercise.title} pose={s.exercise.pose} size={96} />
                    <strong style={{ fontSize: "var(--text-sm)" }}>{s.exercise.title}</strong>
                    <span className="muted" style={{ fontSize: "var(--text-xs)" }}>{s.reason}</span>
                    <button
                      type="button"
                      className="assign-add-btn"
                      disabled={assigningId === s.exercise.id}
                      onClick={() => void handleAssignAtSession(s.exercise.id)}
                    >
                      {assigningId === s.exercise.id ? "…" : "Assign"}
                    </button>
                  </div>
                ))}
                {suggestions.length === 0 && (
                  <p className="muted">No further suggestions — browse the full library on the patient&apos;s recovery screen.</p>
                )}
              </div>
              {form && adminUid && (
                <>
                  <h3 style={{ fontSize: "var(--text-md)" }}>Assigned exercises</h3>
                  <AdminExerciseAssigner adminUid={adminUid} patientUid={patientUid} personId={personId} />
                </>
              )}
            </>
          )}

          {step === 5 && (
            <>
              <div className="summary-fields">
                <div>
                  <label htmlFor="session-pain-score" className="summary-label">Pain level today (0 = none · 10 = worst)</label>
                  <div className="summary-row">
                    <input
                      id="session-pain-score"
                      type="range" min={0} max={10} step={1}
                      value={summary.painScore}
                      onChange={(e) => setSummary((s) => ({ ...s, painScore: Number(e.target.value) }))}
                      aria-valuetext={`${summary.painScore} out of 10`}
                      className="summary-pain-slider"
                      style={{ accentColor: getPainColor(summary.painScore) }}
                    />
                    <span className="summary-pain-badge" style={{ background: getPainColor(summary.painScore) }}>
                      {summary.painScore}
                    </span>
                  </div>
                </div>
                <div>
                  <label htmlFor="session-recovery-percent" className="summary-label">Estimated recovery progress</label>
                  <div className="summary-row">
                    <RecoveryRing percent={summary.recoveryPercent} />
                    <div className="summary-inline-group">
                      <input
                        id="session-recovery-percent"
                        type="number" min={0} max={100} step={1}
                        value={summary.recoveryPercent}
                        onChange={(e) => setSummary((s) => ({ ...s, recoveryPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                        className="summary-recovery-input"
                      />
                      <span className="summary-recovery-suffix">%</span>
                    </div>
                  </div>
                </div>
                <div role="group" aria-label="Session outcome">
                  <span className="summary-label">Session outcome</span>
                  <div className="summary-chip-row">
                    {(["improving", "stable", "setback"] as const).map((o) => (
                      <button
                        key={o}
                        type="button"
                        className="summary-chip"
                        aria-pressed={summary.sessionOutcome === o}
                        onClick={() => setSummary((s) => ({ ...s, sessionOutcome: o }))}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <label>
                  <span className="summary-label">What we worked on today *</span>
                  <textarea
                    rows={3}
                    value={summary.workedOn}
                    onChange={(e) => setSummary((s) => ({ ...s, workedOn: e.target.value }))}
                    className="summary-textarea"
                  />
                </label>
                <label>
                  <span className="summary-label">Next steps & advice *</span>
                  <textarea
                    rows={3}
                    value={summary.nextSteps}
                    onChange={(e) => setSummary((s) => ({ ...s, nextSteps: e.target.value }))}
                    className="summary-textarea"
                  />
                </label>
                <div role="group" aria-label="Recommend follow-up">
                  <span className="summary-label">Recommend follow-up</span>
                  <div className="summary-chip-row">
                    {[0, 1, 2, 4, 6, 8].map((w) => (
                      <button
                        key={w}
                        type="button"
                        className="summary-chip"
                        aria-pressed={summary.followUpWeeks === w}
                        onClick={() => setSummary((s) => ({ ...s, followUpWeeks: w }))}
                      >
                        {w === 0 ? "None" : `${w} wk${w > 1 ? "s" : ""}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div role="group" aria-label="Daily streak goal">
                  <span className="summary-label">Daily streak goal</span>
                  <div className="summary-chip-row">
                    {[3, 5, 7, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className="summary-chip"
                        aria-pressed={streakGoal === d}
                        onClick={() => void handleStreakGoal(d)}
                      >
                        {d} days
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="panel stack" style={{ borderColor: "var(--color-error)" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "var(--text-sm)" }}>
                  <input
                    type="checkbox"
                    checked={safetyNettingProvided}
                    onChange={(e) => setSafetyNettingProvided(e.target.checked)}
                  />
                  <span>
                    <strong>Safety-netting advice given *</strong> — the patient knows what to do and who to
                    contact if symptoms worsen (NHS-required before closing any session).
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={safetyNettingNotes}
                  onChange={(e) => setSafetyNettingNotes(e.target.value)}
                  placeholder="Optional notes — what was advised"
                  className="summary-textarea"
                />
              </div>

              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  className="button primary"
                  disabled={publishing || !safetyNettingProvided}
                  title={!safetyNettingProvided ? "Confirm safety-netting advice was given first" : undefined}
                  onClick={() => void handlePublish()}
                >
                  {publishing ? "Publishing…" : publishedSummaryId ? "Published ✓" : "Publish session"}
                </button>
                {publishedSummaryId && (
                  <button
                    type="button"
                    onClick={() => void handleResendPlan()}
                    disabled={resending}
                    className="summary-cancel"
                  >
                    {resending ? "Sending…" : "Resend plan email"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="assessment-wizard__nav" style={presenting ? { display: "none" } : undefined}>
        {step > 1 ? (
          <button type="button" className="button secondary" onClick={() => void goToStep(step - 1)}>
            Back
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length ? (
          <button
            type="button"
            className="button primary"
            disabled={step === 1 && !screeningGateSatisfied}
            title={step === 1 && !screeningGateSatisfied ? "Complete the required screening checks above first" : undefined}
            onClick={async () => {
              if (step === 2) await saveSelfTests();
              if (step === 3) await saveDiagnosis();
              await goToStep(step + 1);
            }}
          >
            Continue
          </button>
        ) : (
          <Link href={`/admin/patients/${form?.submittedByUid ?? ""}`} className="button secondary">
            Back to patient
          </Link>
        )}
      </div>
    </div>
  );
}
