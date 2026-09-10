"use client";

// components/patient-assessment-history.tsx
// A patient's own submitted assessments / check-ups, newest first. Extracted
// from the old patient-assessment-form.tsx so the wizard can drop that file.

import { useEffect, useState } from "react";
import {
  getPatientAssessmentForms,
  hasUrgentRedFlags,
  type OutcomeMeasureSet,
  type PatientAssessmentFormRecord,
} from "@/lib/assessment-forms";
import { SkeletonRow } from "@/components/skeleton";

interface Props {
  uid: string;
  personId: string;
  reloadKey: number;
}

const reviewStatusLabel: Record<PatientAssessmentFormRecord["reviewStatus"], string> = {
  awaiting_review: "Awaiting physio review",
  reviewed: "Reviewed",
  needs_more_info: "Needs more information",
  urgent_advice: "Urgent advice noted",
};

function formatDate(date: Date | null): string {
  if (!date) return "Date not recorded";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatCompletedDate(form: PatientAssessmentFormRecord): string {
  if (!form.completedAt) return formatDate(form.createdAt);
  const parsed = new Date(form.completedAt);
  return Number.isNaN(parsed.getTime()) ? formatDate(form.createdAt) : formatDate(parsed);
}

function psfsAverage(outcomes: OutcomeMeasureSet): number | null {
  const scored = [
    { a: outcomes.psfsActivity1, s: outcomes.psfsScore1 },
    { a: outcomes.psfsActivity2, s: outcomes.psfsScore2 },
    { a: outcomes.psfsActivity3, s: outcomes.psfsScore3 },
  ].filter((x) => x.a.trim().length > 0);
  if (scored.length === 0) return null;
  return Math.round((scored.reduce((t, x) => t + x.s, 0) / scored.length) * 10) / 10;
}

export function PatientAssessmentHistory({ uid, personId, reloadKey }: Props) {
  const [forms, setForms] = useState<PatientAssessmentFormRecord[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    setForms(null);
    setError(false);
    getPatientAssessmentForms(uid, personId)
      .then((records) => {
        if (live) setForms(records);
      })
      .catch(() => {
        if (live) {
          setForms([]);
          setError(true);
        }
      });
    return () => {
      live = false;
    };
  }, [uid, personId, reloadKey]);

  return (
    <div className="panel stack">
      <div>
        <span className="eyebrow">Check-ups</span>
        <h2 style={{ fontSize: "var(--text-lg)", margin: "0.25rem 0 0" }}>Previous assessments</h2>
      </div>
      {error && <p className="field-error">Could not load assessments right now.</p>}
      {!forms ? (
        <SkeletonRow count={2} />
      ) : forms.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
          No assessments submitted yet. Your submitted forms and check-ups will appear here.
        </p>
      ) : (
        <div className="assessment-history-list">
          {forms.slice(0, 6).map((form) => (
            <article key={form.id} className="assessment-history-item">
              <div>
                <strong>{form.formType === "checkup" ? "Review check-up" : "Initial assessment"}</strong>
                <p className="muted">
                  {formatCompletedDate(form)} - {form.consultationMode === "online" ? "Online" : "In-person/offline"} - Pain {form.painScore}/10
                  {psfsAverage(form.outcomes) !== null ? ` - PSFS ${psfsAverage(form.outcomes)}/10` : ""}
                  {form.objectiveVideo.videoUrl ? " - Video attached" : ""}
                </p>
              </div>
              <span className={`assessment-status-pill status-${form.reviewStatus}`}>{reviewStatusLabel[form.reviewStatus]}</span>
              {hasUrgentRedFlags(form.redFlags) && <span className="assessment-risk-pill">Safety flag selected</span>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
