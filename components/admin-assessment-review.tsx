"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  ASSESSMENT_LIMITS,
  getPatientAssessmentForms,
  hasUrgentRedFlags,
  updateAssessmentReview,
  type AssessmentReviewStatus,
  type PatientAssessmentFormRecord,
} from "@/lib/assessment-forms";
import { validateOptionalText } from "@/lib/validation";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";
import { suggestExercises } from "@/lib/exercise-suggestions";
import { SuggestedExercises } from "@/components/suggested-exercises";
import { assignExercise, getAssignedExercises } from "@/lib/recovery";

interface LinkedBooking {
  id: string;
  service: string;
  sessionDate: Date;
}

interface Props {
  patientUid: string;
  personId: string;
  bookings?: LinkedBooking[];
  onFormsChange?: (bookingIds: string[]) => void;
}

const statusLabels: Record<AssessmentReviewStatus, string> = {
  awaiting_review: "Awaiting review",
  reviewed: "Reviewed",
  needs_more_info: "Needs more information",
  urgent_advice: "Urgent advice",
};

const redFlagText: { key: keyof PatientAssessmentFormRecord["redFlags"]; label: string }[] = [
  { key: "majorTrauma", label: "Major trauma or suspected fracture" },
  { key: "chestPainBreathlessness", label: "Chest pain, breathlessness, fainting or dizziness" },
  { key: "bladderBowelSaddle", label: "Bladder, bowel or saddle-area changes" },
  { key: "progressiveWeakness", label: "Rapidly worsening weakness or coordination" },
  { key: "unexplainedFeverWeightLoss", label: "Fever, infection signs, sweats or weight loss" },
  { key: "nightPain", label: "Constant night pain" },
];

const clinicalAreaLabels: Record<PatientAssessmentFormRecord["subjective"]["clinicalArea"], string> = {
  spine: "Spine, neck or back",
  upper_limb: "Shoulder, arm, wrist or hand",
  lower_limb: "Hip, knee, ankle or foot",
  balance_walking: "Balance, walking or falls",
  neuro: "Neurological rehabilitation",
  post_op: "Post-operative rehab",
  pelvic_health: "Pelvic health",
  paediatric: "Paediatric assessment",
  general: "General or not sure",
};

function formatDate(date: Date | null) {
  if (!date) return "Date not recorded";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCompletedDate(form: PatientAssessmentFormRecord) {
  if (!form.completedAt) return formatDate(form.createdAt);
  const parsed = new Date(form.completedAt);
  if (Number.isNaN(parsed.getTime())) return formatDate(form.createdAt);
  return formatDate(parsed);
}

function selectedRedFlags(form: PatientAssessmentFormRecord): string {
  const selected = redFlagText
    .filter((item) => form.redFlags[item.key])
    .map((item) => item.label);
  if (selected.length === 0 && form.redFlags.none) return "None selected";
  return selected.length > 0 ? selected.join(", ") : "Not recorded";
}

function modeLabel(form: PatientAssessmentFormRecord) {
  const appointmentMode = form.consultationMode === "online" ? "Online" : "In-person/offline";
  const completedVia = form.completedVia === "offline_draft"
    ? "offline draft"
    : form.completedVia === "offline_paper"
      ? "paper"
      : "online form";
  return `${appointmentMode}, ${completedVia}`;
}

function psfsAverage(form: PatientAssessmentFormRecord) {
  const scored = [
    [form.outcomes.psfsActivity1, form.outcomes.psfsScore1] as const,
    [form.outcomes.psfsActivity2, form.outcomes.psfsScore2] as const,
    [form.outcomes.psfsActivity3, form.outcomes.psfsScore3] as const,
  ].filter(([activity]) => activity.trim().length > 0);
  if (scored.length === 0) return "Not recorded";
  const total = scored.reduce((sum, [, score]) => sum + score, 0);
  return `${Math.round((total / scored.length) * 10) / 10}/10`;
}

function goalStatement(form: PatientAssessmentFormRecord) {
  if (!form.goalsPlan.meaningfulGoal) return "Not recorded";
  return `In ${form.goalsPlan.timeframeWeeks} weeks: ${form.goalsPlan.meaningfulGoal}. Baseline: ${form.goalsPlan.baseline || "not recorded"}. Target: ${form.goalsPlan.target || "not recorded"}.`;
}

function ReviewItem({
  patientUid,
  personId,
  form,
  bookings,
  onSaved,
}: Props & { form: PatientAssessmentFormRecord; onSaved: (form: PatientAssessmentFormRecord) => void }) {
  const toast = useToast();
  const [reviewStatus, setReviewStatus] = useState<AssessmentReviewStatus>(
    form.reviewStatus === "awaiting_review" ? "reviewed" : form.reviewStatus
  );
  const [clinicianNotes, setClinicianNotes] = useState(form.clinicianNotes);
  const [riskPlan, setRiskPlan] = useState(form.riskPlan);
  const [nextCheckupDate, setNextCheckupDate] = useState(form.nextCheckupDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    setReviewStatus(form.reviewStatus === "awaiting_review" ? "reviewed" : form.reviewStatus);
    setClinicianNotes(form.clinicianNotes);
    setRiskPlan(form.riskPlan);
    setNextCheckupDate(form.nextCheckupDate);
  }, [form]);

  useEffect(() => {
    let cancelled = false;
    getAssignedExercises(patientUid, personId).then((list) => {
      if (!cancelled) setAssignedIds(list.map((a) => a.exerciseId));
    });
    return () => {
      cancelled = true;
    };
  }, [patientUid, personId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const notesErr = validateOptionalText(clinicianNotes, ASSESSMENT_LIMITS.clinicianNotes);
    const planErr = validateOptionalText(riskPlan, ASSESSMENT_LIMITS.riskPlan);
    if (notesErr || planErr) {
      setError(notesErr ?? planErr);
      return;
    }
    if (nextCheckupDate && nextCheckupDate.length > ASSESSMENT_LIMITS.nextCheckupDate) {
      setError("Use a valid next check-up date.");
      return;
    }

    setSaving(true);
    try {
      const reviewer = auth?.currentUser?.displayName || auth?.currentUser?.email || "Physio";
      const reviewedAt = new Date().toISOString();
      await updateAssessmentReview(patientUid, personId, form.id, {
        reviewStatus,
        reviewedBy: reviewer,
        reviewedAt,
        clinicianNotes,
        riskPlan,
        nextCheckupDate,
      });
      onSaved({
        ...form,
        reviewStatus,
        reviewedBy: reviewer,
        reviewedAt,
        clinicianNotes,
        riskPlan,
        nextCheckupDate,
        updatedAt: new Date(),
      });
      toast.show("Assessment review saved.", "success");
    } catch {
      setError("Could not save this review. Check admin access and try again.");
      toast.show("Could not save assessment review.", "error");
    } finally {
      setSaving(false);
    }
  }

  const linkedBooking = form.bookingId ? bookings?.find((b) => b.id === form.bookingId) : undefined;
  const urgent = hasUrgentRedFlags(form.redFlags);
  const coreConsentComplete = form.consent.careConsent &&
    form.consent.dataConsent &&
    form.consent.privacyConsent &&
    form.consent.safetySharing;

  return (
    <details className="assessment-review-item" open={form.reviewStatus === "awaiting_review" || urgent}>
      <summary>
        <span>
          <strong>{form.formType === "checkup" ? "Review check-up" : "Initial assessment"}</strong>
          <small>
            {formatCompletedDate(form)} - {modeLabel(form)} - Pain {form.painScore}/10
            {form.bookingId && (
              <>
                {" - "}
                {linkedBooking
                  ? `Linked to ${linkedBooking.service} appointment on ${formatDate(linkedBooking.sessionDate)}`
                  : `Linked booking ${form.bookingId}`}
              </>
            )}
          </small>
        </span>
        <span className="dashboard-status-pill status-confirmed">Submitted</span>
        <span className={`assessment-status-pill status-${form.reviewStatus}`}>{statusLabels[form.reviewStatus]}</span>
      </summary>

      <div className="assessment-review-body">
        {urgent && (
          <p className="assessment-alert compact" role="alert">
            Safety flag selected. Review promptly and document advice, signposting or escalation.
          </p>
        )}
        <dl className="assessment-detail-grid">
          <div><dt>Patient</dt><dd>{form.patientName}</dd></div>
          <div><dt>Completed by</dt><dd>{form.completedBy} ({form.relationshipToPatient || "relationship not recorded"})</dd></div>
          <div><dt>Body area</dt><dd>{form.bodyArea}</dd></div>
          <div><dt>Started</dt><dd>{form.symptomStartDate || "Not recorded"} ({form.onsetPattern.replace("_", " ")})</dd></div>
          <div><dt>Concern</dt><dd>{form.presentingComplaint}</dd></div>
          <div><dt>Symptoms</dt><dd>{form.symptoms}</dd></div>
          <div><dt>Clinical area</dt><dd>{clinicalAreaLabels[form.subjective.clinicalArea]}</dd></div>
          <div><dt>Symptom behaviour</dt><dd>{form.subjective.symptomBehaviour || "Not recorded"}</dd></div>
          <div><dt>Severity / irritability</dt><dd>{form.subjective.severity}/10 / {form.subjective.irritability}/10</dd></div>
          <div><dt>Yellow flags</dt><dd>{form.subjective.yellowFlags || "Not recorded"}</dd></div>
          <div><dt>Worse/eased by</dt><dd>{form.aggravatingFactors || "Not recorded"} / {form.easingFactors || "not recorded"}</dd></div>
          <div><dt>Function and goals</dt><dd>{form.functionalImpact || "Not recorded"} {form.goals ? `Goal: ${form.goals}` : ""}</dd></div>
          <div><dt>PSFS average</dt><dd>{psfsAverage(form)}</dd></div>
          <div><dt>PSFS activities</dt><dd>{[
            form.outcomes.psfsActivity1 ? `${form.outcomes.psfsActivity1} (${form.outcomes.psfsScore1}/10)` : "",
            form.outcomes.psfsActivity2 ? `${form.outcomes.psfsActivity2} (${form.outcomes.psfsScore2}/10)` : "",
            form.outcomes.psfsActivity3 ? `${form.outcomes.psfsActivity3} (${form.outcomes.psfsScore3}/10)` : "",
          ].filter(Boolean).join("; ") || "Not recorded"}</dd></div>
          <div><dt>Pain range / confidence</dt><dd>Best {form.outcomes.painBest}/10, current {form.painScore}/10, worst {form.outcomes.painWorst}/10. Confidence {form.outcomes.confidenceScore}/10.</dd></div>
          <div><dt>Condition measure</dt><dd>{form.outcomes.conditionMeasureName ? `${form.outcomes.conditionMeasureName}: ${form.outcomes.conditionMeasureScore}/${form.outcomes.conditionMeasureMax}` : "Not recorded"}</dd></div>
          <div><dt>Objective task</dt><dd>{form.objectiveVideo.taskLabel || "Not recorded"}</dd></div>
          <div><dt>Objective metric</dt><dd>{form.objectiveVideo.metricName || "Metric"}: {form.objectiveVideo.metricValue} {form.objectiveVideo.metricUnit || ""}{form.objectiveVideo.reps ? `, ${form.objectiveVideo.reps} reps` : ""}{form.objectiveVideo.durationSeconds ? `, ${form.objectiveVideo.durationSeconds}s` : ""}</dd></div>
          <div><dt>Objective notes</dt><dd>{form.objectiveVideo.qualityNotes || "Not recorded"}</dd></div>
          <div><dt>Video evidence</dt><dd>{form.objectiveVideo.videoUrl ? <a href={form.objectiveVideo.videoUrl} target="_blank" rel="noreferrer">Open objective video</a> : "No video attached"}</dd></div>
          <div><dt>Review-ready goal</dt><dd>{goalStatement(form)}</dd></div>
          <div><dt>Goal confidence</dt><dd>{form.goalsPlan.confidenceScore}/10{form.goalsPlan.reviewDate ? `, review ${form.goalsPlan.reviewDate}` : ""}</dd></div>
          <div><dt>Barriers/support</dt><dd>{form.goalsPlan.barriers || "No barriers recorded"} / {form.goalsPlan.supportPlan || "no support plan recorded"}</dd></div>
          <div><dt>Medical context</dt><dd>{form.medicalHistory || "Not recorded"}</dd></div>
          <div><dt>Medication/allergies</dt><dd>{form.medications || "Not recorded"} / {form.allergies || "not recorded"}</dd></div>
          <div><dt>Previous care</dt><dd>{form.previousTreatment || "Not recorded"}</dd></div>
          <div><dt>Safety check</dt><dd>{selectedRedFlags(form)}</dd></div>
          <div><dt>Access needs</dt><dd>{form.communicationNeeds || "None recorded"}</dd></div>
          <div><dt>Emergency contact</dt><dd>{form.emergencyContactName || "Not recorded"} {form.emergencyContactPhone ? `- ${form.emergencyContactPhone}` : ""}</dd></div>
          <div><dt>Consent</dt><dd>{coreConsentComplete ? "Core consent confirmed" : "Consent incomplete"}; video {form.consent.videoConsent ? "confirmed" : "not confirmed"}</dd></div>
        </dl>

        <SuggestedExercises
          suggestions={suggestExercises(
            {
              clinicalArea: form.subjective.clinicalArea,
              freeText: [form.presentingComplaint, form.symptoms, form.functionalImpact, form.goals]
                .filter(Boolean)
                .join(" "),
              alreadyAssignedIds: assignedIds,
            },
            5
          )}
          assigning={assigningId}
          onAssign={async (exerciseId) => {
            const adminUid = auth?.currentUser?.uid;
            if (!adminUid) return;
            setAssigningId(exerciseId);
            try {
              await assignExercise(patientUid, personId, exerciseId, adminUid);
              setAssignedIds((prev) => [...prev, exerciseId]);
            } finally {
              setAssigningId(null);
            }
          }}
        />

        <form className="assessment-review-form" onSubmit={(event) => void handleSave(event)}>
          <label>
            Review status
            <select
              className="input"
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as AssessmentReviewStatus)}
            >
              <option value="reviewed">Reviewed</option>
              <option value="needs_more_info">Needs more information</option>
              <option value="urgent_advice">Urgent advice</option>
              <option value="awaiting_review">Awaiting review</option>
            </select>
          </label>
          <label>
            Clinical reasoning and review notes
            <textarea
              className="input"
              rows={3}
              value={clinicianNotes}
              onChange={(e) => setClinicianNotes(e.target.value)}
              maxLength={ASSESSMENT_LIMITS.clinicianNotes}
              placeholder="Clinical interpretation, limitations, advice already given, information needed"
            />
          </label>
          <label>
            Risk plan, referrals or safety advice
            <textarea
              className="input"
              rows={3}
              value={riskPlan}
              onChange={(e) => setRiskPlan(e.target.value)}
              maxLength={ASSESSMENT_LIMITS.riskPlan}
              placeholder="Escalation, GP/111/A&E advice, adaptations for online care, referral plan"
            />
          </label>
          <label>
            Next check-up date
            <input
              type="date"
              className="input"
              value={nextCheckupDate}
              onChange={(e) => setNextCheckupDate(e.target.value)}
            />
          </label>
          {error && <span className="field-error">{error}</span>}
          <button type="submit" className="button primary" disabled={saving}>
            {saving ? "Saving..." : "Save review"}
          </button>
        </form>
      </div>
    </details>
  );
}

export function AdminAssessmentReview({ patientUid, personId, bookings, onFormsChange }: Props) {
  const [forms, setForms] = useState<PatientAssessmentFormRecord[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let live = true;
    setForms(null);
    setLoadError(false);
    getPatientAssessmentForms(patientUid, personId)
      .then((records) => {
        if (live) setForms(records);
      })
      .catch(() => {
        if (live) {
          setForms([]);
          setLoadError(true);
        }
      });
    return () => {
      live = false;
    };
  }, [patientUid, personId]);

  useEffect(() => {
    if (forms) onFormsChange?.(forms.map((form) => form.bookingId).filter((id): id is string => !!id));
    // onFormsChange is a setState wrapper from the parent; including it would
    // re-run this on every parent render since it's a new closure each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forms]);

  function handleSaved(updated: PatientAssessmentFormRecord) {
    setForms((current) => current?.map((form) => form.id === updated.id ? updated : form) ?? current);
  }

  const awaiting = forms?.filter((form) => form.reviewStatus === "awaiting_review").length ?? 0;

  return (
    <div className="panel stack">
      <div>
        <span className="eyebrow">Assessment forms</span>
        <h2 style={{ fontSize: "var(--text-lg)", margin: "0.25rem 0 0" }}>
          Patient assessment and check-ups{awaiting > 0 ? ` (${awaiting} awaiting)` : ""}
        </h2>
      </div>
      {loadError && <p className="field-error">Could not load assessment forms.</p>}
      {!forms ? (
        <SkeletonRow count={3} />
      ) : forms.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
          No patient assessment forms have been submitted yet.
        </p>
      ) : (
        <div className="assessment-review-list">
          {forms.map((form) => (
            <ReviewItem
              key={form.id}
              patientUid={patientUid}
              personId={personId}
              form={form}
              bookings={bookings}
              onSaved={handleSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
