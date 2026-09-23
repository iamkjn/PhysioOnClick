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
  const currentStep = STEPS[step - 1];
  const patientHref = patientUid
    ? `/admin/patients/${patientUid}${personId && personId !== patientUid ? `?person=${personId}` : ""}`
    : "/admin/patients";

  return (
    <div className="session-workspace">
      <header className="session-workspace__header">
        <div>
          <span className="session-workspace__eyebrow">Clinical session</span>
          <h1>{booking.patientName}</h1>
          <p>
            {booking.service}
            <span aria-hidden="true"> · </span>
            {booking.sessionDate.toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="session-workspace__save-state">
          <span aria-hidden="true" />
          Progress saves as you continue
        </div>
      </header>

      <div className="session-workspace__layout">
        <aside className="session-step-rail" aria-label="Session steps">
          <div className="session-step-rail__progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <ol>
            {STEPS.map((item, index) => {
              const number = index + 1;
              const state = number === step ? "current" : number < step ? "complete" : "upcoming";
              return (
                <li key={item.label} className={`session-step-rail__item is-${state}`} aria-current={state === "current" ? "step" : undefined}>
                  <span className="session-step-rail__number" aria-hidden="true">{state === "complete" ? "✓" : number}</span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{state === "complete" ? "Completed" : state === "current" ? "In progress" : "Not started"}</small>
                  </span>
                </li>
              );
            })}
          </ol>
        </aside>

        <main className="session-stage">
          <header className="session-stage__header">
            <span>Step {step} of {STEPS.length}</span>
            <h2>{currentStep.label}</h2>
            <p>{currentStep.description}</p>
          </header>

          <div className="session-stage__body" key={step}>

          {step === 1 && (
            <>
              <div className="session-status-row">
                <div className={`session-concern session-concern--${concern}`} role="status">
                  <span>Concern level</span>
                  <strong>{concern}</strong>
                </div>
                <p>{CONCERN_TEXT[concern]}</p>
              </div>
              {!form && (
                <div className="session-notice session-notice--warning" role="alert">
                  <strong>No assessment form is linked to this booking.</strong>
                  <span>Safety checks cannot be saved, but you can still complete and publish the session summary.</span>
                </div>
              )}
              <section className="session-section" aria-labelledby="safety-checks-title">
                <div className="session-section__heading">
                  <div>
                    <h3 id="safety-checks-title">Safety checks</h3>
                    <p>Select only the findings that are present. General and condition-specific checks are combined.</p>
                  </div>
                </div>
                <div className="session-flag-grid">
                {(Object.keys(defaultRedFlags) as (keyof AssessmentRedFlags)[])
                  .filter((key) => key !== "none")
                  .map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="session-flag"
                      aria-pressed={flags[key]}
                      disabled={!form}
                      title={!form ? "No assessment form to update for this booking" : undefined}
                      onClick={() => void toggleCommonFlag(key)}
                    >
                      <span className="session-flag__check" aria-hidden="true">{flags[key] ? "✓" : ""}</span>
                      <span>{RED_FLAG_FIELD_LABELS[key] ?? key}</span>
                    </button>
                  ))}
                {relevantGroups.flatMap((group) =>
                  CONDITIONAL_RED_FLAG_FIELDS[group].map((field) => {
                    const selected = conditionalFlags[group]?.[field] === true;
                    return (
                      <button
                        key={`${group}-${field}`}
                        type="button"
                        className="session-flag"
                        aria-pressed={selected}
                        disabled={!form}
                        title={`${CONDITION_GROUP_LABELS[group]}${!form ? " — no assessment form to update" : ""}`}
                        onClick={() => void toggleConditionalFlagField(group, field)}
                      >
                        <span className="session-flag__check" aria-hidden="true">{selected ? "✓" : ""}</span>
                        <span>{RED_FLAG_FIELD_LABELS[field] ?? field}</span>
                      </button>
                    );
                  }),
                )}
                </div>
              </section>

              {hasPositiveFlag && (
                <div className="session-callout session-callout--warning">
                  <label htmlFor="risk-plan-note">Action taken or clinical reasoning *</label>
                  <textarea
                    id="risk-plan-note"
                    rows={3}
                    value={riskPlanText}
                    onChange={(e) => setRiskPlanText(e.target.value)}
                    onBlur={(e) => void saveRiskPlan(e.target.value)}
                    placeholder="Document why it is safe to proceed, any modification made, or the referral action taken."
                  />
                  <small>{savingRiskPlan ? "Saving..." : "Required before continuing and saved to the assessment record."}</small>
                </div>
              )}

              {needsConcernAck && (
                <div className="session-callout session-callout--urgent">
                  <label className="session-confirmation">
                    <input
                      type="checkbox"
                      checked={concernAckSatisfied}
                      onChange={(e) => {
                        setConcernAck(e.target.checked);
                        setAckedConcern(e.target.checked ? concern : null);
                      }}
                    />
                    <span>
                      <strong>Referral risk considered</strong>
                      I have considered whether urgent referral is needed before proceeding
                      ({concern === "emergency" ? "do not begin a trial of therapy" : "proceed with vigilance"}).
                    </span>
                  </label>
                </div>
              )}
            </>
          )}

          {step === 2 && !presenting && (
            <>
              <div className="session-section__heading">
                <div>
                  <h3>Recommended checks</h3>
                  <p>Record a result for each test you use. Unused tests can stay blank.</p>
                </div>
                {candidateTests.length > 0 && (
                  <button
                    type="button"
                    className="session-text-button"
                    onClick={() => { setPresentIndex(0); setPresenting(true); }}
                  >
                    Present to patient
                  </button>
                )}
              </div>
              <div className="session-test-grid">
                {candidateTests.map((t) => {
                  const current = selfTestResults.find((r) => r.slug === t.slug);
                  return (
                    <article key={t.slug} className="session-test-card">
                      {t.steps[0] && (
                        <SelfTestImage imageId={t.steps[0].imageId} label={t.name} stepNumber={1} />
                      )}
                      <div className="session-test-card__copy">
                        <h4>{t.name}</h4>
                        <p>{t.assesses}</p>
                      </div>
                      <div className="session-result-control">
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
                    </article>
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
              <div className="session-section__heading">
                <div>
                  <h3>Suggested clinical possibilities</h3>
                  <p>Based on positive self-check results. Confirm only what matches your clinical judgement.</p>
                </div>
              </div>
              {diagnosis.length === 0 ? (
                <div className="session-empty-state">
                  <strong>No suggestions yet</strong>
                  <span>Return to self-check tests and record any positive findings.</span>
                </div>
              ) : (
                <div className="session-diagnosis-list">
                  {diagnosis.map((d) => (
                    <article key={d.conditionSlug} className={d.confirmedByAdmin ? "session-diagnosis is-confirmed" : "session-diagnosis"}>
                      <div>
                        <h4>{d.label}</h4>
                        <span>{d.confirmedByAdmin ? "Included in clinical impression" : "Awaiting review"}</span>
                      </div>
                      <div className="session-diagnosis__actions">
                        <button type="button" className="button small secondary" onClick={() => toggleConfirm(d.conditionSlug)}>
                          {d.confirmedByAdmin ? "Undo" : "Confirm"}
                        </button>
                        <button type="button" className="session-text-button session-text-button--danger" onClick={() => dismissCandidate(d.conditionSlug)}>
                          Dismiss
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <div className="session-section__heading">
                <div>
                  <h3>Suggested exercises</h3>
                  <p>Based on the assessment area and confirmed impression. Assignment is immediate.</p>
                </div>
              </div>
              <div className="session-exercise-grid">
                {suggestions.map((s) => (
                  <article key={s.exercise.id} className="session-exercise-card">
                    <ExerciseImage exerciseId={s.exercise.id} name={s.exercise.title} pose={s.exercise.pose} size={96} />
                    <div>
                      <h4>{s.exercise.title}</h4>
                      <p>{s.reason}</p>
                    </div>
                    <button
                      type="button"
                      className="button small secondary"
                      disabled={assigningId === s.exercise.id}
                      onClick={() => void handleAssignAtSession(s.exercise.id)}
                    >
                      {assigningId === s.exercise.id ? "Assigning..." : "Assign"}
                    </button>
                  </article>
                ))}
                {suggestions.length === 0 && (
                  <div className="session-empty-state">
                    <strong>No further suggestions</strong>
                    <span>Use the full exercise library below to build the plan.</span>
                  </div>
                )}
              </div>
              {patientUid && personId && adminUid && (
                <>
                  <div className="session-section__heading session-section__heading--library">
                    <div>
                      <h3>Patient exercise plan</h3>
                      <p>Review assigned exercises or add a different exercise from the library.</p>
                    </div>
                  </div>
                  <AdminExerciseAssigner adminUid={adminUid} patientUid={patientUid} personId={personId} />
                </>
              )}
            </>
          )}

          {step === 5 && (
            <>
              <div className="summary-fields session-summary-fields">
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
                    placeholder="Assessment findings, treatment completed and patient response."
                  />
                </label>
                <label>
                  <span className="summary-label">Next steps & advice *</span>
                  <textarea
                    rows={3}
                    value={summary.nextSteps}
                    onChange={(e) => setSummary((s) => ({ ...s, nextSteps: e.target.value }))}
                    className="summary-textarea"
                    placeholder="Home plan, activity advice, precautions and what happens next."
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

              <div className="session-callout session-callout--safety">
                <label className="session-confirmation">
                  <input
                    type="checkbox"
                    checked={safetyNettingProvided}
                    onChange={(e) => setSafetyNettingProvided(e.target.checked)}
                  />
                  <span>
                    <strong>Safety-netting advice given *</strong>
                    The patient knows what to do and who to contact if symptoms worsen.
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={safetyNettingNotes}
                  onChange={(e) => setSafetyNettingNotes(e.target.value)}
                  placeholder="Optional: record the specific advice provided."
                  className="summary-textarea"
                />
              </div>

              {publishedSummaryId && (
                <div className="session-notice session-notice--success" role="status">
                  <strong>Session published</strong>
                  <span>The summary and plan are now available on the patient record.</span>
                </div>
              )}
            </>
          )}
          </div>

          {!presenting && (
            <footer className="session-stage__footer">
              {step > 1 ? (
                <button type="button" className="button secondary" onClick={() => void goToStep(step - 1)}>
                  Back
                </button>
              ) : (
                <Link href={patientHref} className="session-text-button">Exit session</Link>
              )}
              <div className="session-stage__footer-actions">
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
                    Continue to {STEPS[step].label}
                  </button>
                ) : (
                  <>
                    {publishedSummaryId && (
                      <button type="button" onClick={() => void handleResendPlan()} disabled={resending} className="button secondary">
                        {resending ? "Sending..." : "Resend plan email"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="button primary"
                      disabled={publishing || !safetyNettingProvided || Boolean(publishedSummaryId)}
                      title={!safetyNettingProvided ? "Confirm safety-netting advice was given first" : undefined}
                      onClick={() => void handlePublish()}
                    >
                      {publishing ? "Publishing..." : publishedSummaryId ? "Session published" : "Publish session"}
                    </button>
                  </>
                )}
              </div>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
