"use client";

// components/assessment-wizard.tsx
// The short, full-screen patient assessment. One question per screen, a
// clickable body chart, ~3 minutes. Everything the clinician now captures at
// the session is submitted as the `default*` shapes from lib/assessment-forms.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  submitPatientAssessmentForm,
  defaultSubjectiveProfile,
  defaultOutcomeMeasures,
  defaultObjectiveVideo,
  defaultGoalSetting,
  defaultOnlineReadiness,
  defaultRedFlags,
  hasUrgentRedFlags,
  ASSESSMENT_LIMITS,
  type AssessmentFormType,
  type AssessmentRedFlags,
  type PatientAssessmentFormInput,
} from "@/lib/assessment-forms";
import { validateUKPhone } from "@/lib/validation";
import {
  deriveClinicalArea,
  deriveOnsetPattern,
  deriveSymptomStartDate,
  describeRegions,
  type HowLong,
} from "@/lib/body-chart";
import { BodyChart } from "@/components/body-chart";
import { PersonSwitcher } from "@/components/person-switcher";
import { useToast } from "@/components/toast-provider";

interface Props {
  uid: string;
  personId: string;
  displayName: string;
  personName: string;
  bookingId: string;
  formType?: AssessmentFormType;
  onSubmitted: (formId: string) => void;
}

type StepId = "intro" | "body" | "story" | "impact" | "context" | "safety" | "consent";
const STEPS: StepId[] = ["intro", "body", "story", "impact", "context", "safety", "consent"];

const HOW_LONG: { value: HowLong; label: string }[] = [
  { value: "days", label: "A few days" },
  { value: "weeks", label: "A few weeks" },
  { value: "months", label: "A few months or more" },
  { value: "since-op", label: "Since an operation" },
  { value: "not-sure", label: "Not sure" },
];

const RED_FLAGS: { key: keyof AssessmentRedFlags; label: string }[] = [
  { key: "majorTrauma", label: "A recent serious injury, fall or suspected broken bone" },
  { key: "chestPainBreathlessness", label: "Chest pain, breathlessness, blackouts or dizziness" },
  { key: "bladderBowelSaddle", label: "New problems with your bladder, bowel or numbness around the saddle area" },
  { key: "progressiveWeakness", label: "Weakness or clumsiness that's quickly getting worse" },
  { key: "unexplainedFeverWeightLoss", label: "Unexplained fever, night sweats or weight loss" },
  { key: "nightPain", label: "Constant pain that's there all night" },
];

const CONSENT_ITEMS: { key: "care" | "data" | "privacy" | "safety"; label: string }[] = [
  { key: "care", label: "I'm happy to have an online physiotherapy assessment and treatment." },
  { key: "data", label: "I agree to PhysioOnClick storing this information to provide my care." },
  { key: "privacy", label: "I've read how my information is used (privacy policy)." },
  { key: "safety", label: "I understand my physiotherapist may contact my GP or emergency services if there's a safety concern." },
];

interface WizardState {
  regions: string[];
  story: string;
  howLong: HowLong | "";
  pain: number;
  impact: string;
  context: string;
  ecName: string;
  ecPhone: string;
  redFlags: AssessmentRedFlags;
  consent: { care: boolean; data: boolean; privacy: boolean; safety: boolean };
  signature: string;
}

const INITIAL: WizardState = {
  regions: [],
  story: "",
  howLong: "",
  pain: 3,
  impact: "",
  context: "",
  ecName: "",
  ecPhone: "",
  redFlags: { ...defaultRedFlags },
  consent: { care: false, data: false, privacy: false, safety: false },
  signature: "",
};

function draftKey(bookingId: string) {
  return `poc-assessment-draft-${bookingId}`;
}

function canAdvance(step: StepId, s: WizardState): boolean {
  switch (step) {
    case "body":
      return s.regions.length > 0;
    case "story":
      return s.story.trim().length >= 10 && s.howLong !== "";
    case "impact":
      return s.impact.trim().length >= 5;
    case "context":
      return s.ecPhone.trim() === "" || validateUKPhone(s.ecPhone) === null;
    case "safety":
      return s.redFlags.none || RED_FLAGS.some((f) => s.redFlags[f.key]);
    case "consent":
      return (
        s.consent.care &&
        s.consent.data &&
        s.consent.privacy &&
        s.consent.safety &&
        s.signature.trim().length >= 2
      );
    default:
      return true;
  }
}

export function AssessmentWizard({
  uid,
  personId,
  displayName,
  personName,
  bookingId,
  formType = "initial",
  onSubmitted,
}: Props) {
  const toast = useToast();
  const [stepIdx, setStepIdx] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // hydrate draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey(bookingId));
      if (raw) setState({ ...INITIAL, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, [bookingId]);

  // persist draft
  useEffect(() => {
    try {
      localStorage.setItem(draftKey(bookingId), JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, bookingId]);

  const step = STEPS[stepIdx];
  const patch = (p: Partial<WizardState>) => setState((s) => ({ ...s, ...p }));
  const urgent = hasUrgentRedFlags(state.redFlags);
  const progress = useMemo(() => Math.round(((stepIdx + 1) / STEPS.length) * 100), [stepIdx]);

  function back() {
    setStepIdx((i) => Math.max(0, i - 1));
  }
  function forward() {
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  }

  function toggleFlag(key: keyof AssessmentRedFlags) {
    setState((s) => {
      if (key === "none") {
        return { ...s, redFlags: { ...defaultRedFlags, none: !s.redFlags.none } };
      }
      return { ...s, redFlags: { ...s.redFlags, none: false, [key]: !s.redFlags[key] } };
    });
  }

  async function handleSubmit() {
    if (!canAdvance("consent", state) || saving) return;
    setSaving(true);
    const howLong = (state.howLong || "not-sure") as HowLong;
    const input: PatientAssessmentFormInput = {
      formType,
      consultationMode: "online",
      completedVia: "online_form",
      patientName: personName,
      completedBy: displayName,
      relationshipToPatient: personName === displayName ? "self" : "",
      presentingComplaint: state.story.trim(),
      bodyArea: describeRegions(state.regions),
      bodyRegions: state.regions,
      symptomStartDate: deriveSymptomStartDate(howLong),
      onsetPattern: deriveOnsetPattern(howLong),
      painScore: state.pain,
      subjective: { ...defaultSubjectiveProfile, clinicalArea: deriveClinicalArea(state.regions) },
      outcomes: { ...defaultOutcomeMeasures },
      objectiveVideo: { ...defaultObjectiveVideo },
      goalsPlan: { ...defaultGoalSetting, meaningfulGoal: state.impact.trim() },
      symptoms: state.story.trim(),
      aggravatingFactors: "",
      easingFactors: "",
      functionalImpact: state.impact.trim(),
      goals: state.impact.trim(),
      medicalHistory: state.context.trim(),
      medications: "",
      allergies: "",
      previousTreatment: "",
      communicationNeeds: "",
      emergencyContactName: state.ecName.trim(),
      emergencyContactPhone: state.ecPhone.trim(),
      redFlags: state.redFlags,
      onlineReadiness: { ...defaultOnlineReadiness },
      consent: {
        careConsent: state.consent.care,
        dataConsent: state.consent.data,
        privacyConsent: state.consent.privacy,
        safetySharing: state.consent.safety,
        videoConsent: false,
      },
      signature: state.signature.trim(),
      completedAt: new Date().toISOString().slice(0, 10),
      submittedByUid: uid,
      bookingId,
    };
    try {
      const id = await submitPatientAssessmentForm(uid, personId, input);
      try {
        localStorage.removeItem(draftKey(bookingId));
      } catch {
        /* ignore */
      }
      setDone(true);
      onSubmitted(id);
    } catch {
      toast.show("We couldn't submit your form. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="assessment-wizard assessment-wizard--done">
        <div className="assessment-wizard__panel">
          <span className="assessment-wizard__tick" aria-hidden="true">✓</span>
          <h1>Thank you — that&apos;s everything.</h1>
          <p>Your physiotherapist will review this before your appointment.</p>
          <Link className="button primary" href="/patient/appointments">
            Back to my appointments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-wizard">
      <div className="assessment-wizard__progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="assessment-wizard__stage" key={step}>
        {step === "intro" && (
          <StepShell title={`Let's get you ready for your appointment.`}>
            <p className="assessment-wizard__lede">
              A few quick questions — about 3 minutes. Your physiotherapist reads this before you meet, so
              the session starts where it matters.
            </p>
            <div className="assessment-wizard__person">
              <PersonSwitcher uid={uid} displayName={displayName} alwaysShow onSelect={() => {}} />
            </div>
          </StepShell>
        )}

        {step === "body" && (
          <StepShell title="Where is the problem?" hint="Tap every area that's involved. You can pick more than one.">
            <BodyChart value={state.regions} onChange={(regions) => patch({ regions })} />
          </StepShell>
        )}

        {step === "story" && (
          <StepShell title="Tell us what's going on." hint="In your own words — what it feels like, when it started, what makes it better or worse.">
            <label className="assessment-wizard__field">
              <span className="sr-only">What&apos;s going on</span>
              <textarea
                aria-label="What's going on"
                rows={5}
                maxLength={ASSESSMENT_LIMITS.symptoms}
                value={state.story}
                onChange={(e) => patch({ story: e.target.value })}
                placeholder="e.g. A sharp pain in my right shoulder when I lift my arm overhead, started about three weeks ago after decorating…"
              />
            </label>
            <fieldset className="assessment-wizard__chips">
              <legend>How long have you had it?</legend>
              {HOW_LONG.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  className="assessment-wizard__chip"
                  aria-pressed={state.howLong === h.value}
                  onClick={() => patch({ howLong: h.value })}
                >
                  {h.label}
                </button>
              ))}
            </fieldset>
            <label className="assessment-wizard__slider">
              <span>Pain right now: <strong>{state.pain}/10</strong></span>
              <input
                type="range"
                min={0}
                max={10}
                value={state.pain}
                aria-label="Pain right now, 0 to 10"
                onChange={(e) => patch({ pain: Number(e.target.value) })}
              />
            </label>
          </StepShell>
        )}

        {step === "impact" && (
          <StepShell title="What is it stopping you doing?" hint="The everyday things that matter most — work, sleep, sport, lifting the kids.">
            <label className="assessment-wizard__field">
              <span className="sr-only">What is it stopping you doing</span>
              <textarea
                aria-label="What is it stopping you doing"
                rows={4}
                maxLength={ASSESSMENT_LIMITS.functionalImpact}
                value={state.impact}
                onChange={(e) => patch({ impact: e.target.value })}
                placeholder="e.g. I can't sleep on that side and I've stopped going to the gym."
              />
            </label>
          </StepShell>
        )}

        {step === "context" && (
          <StepShell title="Anything we should know?" hint="Optional — medicines you take, past injuries or operations, or health conditions.">
            <label className="assessment-wizard__field">
              <span className="sr-only">Anything we should know</span>
              <textarea
                aria-label="Anything we should know"
                rows={4}
                maxLength={ASSESSMENT_LIMITS.medicalHistory}
                value={state.context}
                onChange={(e) => patch({ context: e.target.value })}
                placeholder="e.g. I take blood pressure tablets. Broke the same wrist 10 years ago."
              />
            </label>
            <div className="assessment-wizard__emergency">
              <p className="assessment-wizard__sublabel">Emergency contact <span>(optional)</span></p>
              <div className="assessment-wizard__grid2">
                <label className="assessment-wizard__field">
                  Name
                  <input
                    type="text"
                    value={state.ecName}
                    maxLength={ASSESSMENT_LIMITS.emergencyContactName}
                    onChange={(e) => patch({ ecName: e.target.value })}
                  />
                </label>
                <label className="assessment-wizard__field">
                  Phone
                  <input
                    type="tel"
                    inputMode="tel"
                    value={state.ecPhone}
                    maxLength={ASSESSMENT_LIMITS.emergencyContactPhone}
                    onChange={(e) => patch({ ecPhone: e.target.value })}
                  />
                  {state.ecPhone.trim() !== "" && validateUKPhone(state.ecPhone) !== null && (
                    <span className="field-error">Enter a valid UK phone number, or leave it blank.</span>
                  )}
                </label>
              </div>
            </div>
          </StepShell>
        )}

        {step === "safety" && (
          <StepShell title="A quick safety check." hint="Physiotherapists screen for a few things that need a doctor first. Do any of these apply right now?">
            <div className="assessment-wizard__flags">
              {RED_FLAGS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className="assessment-wizard__flag"
                  aria-pressed={state.redFlags[f.key]}
                  onClick={() => toggleFlag(f.key)}
                >
                  {f.label}
                </button>
              ))}
              <button
                type="button"
                className="assessment-wizard__flag assessment-wizard__flag--none"
                aria-pressed={state.redFlags.none}
                onClick={() => toggleFlag("none")}
              >
                None of these
              </button>
            </div>
            {urgent && (
              <p className="assessment-wizard__alert" role="alert">
                Some of what you&apos;ve described may need urgent medical attention. Please contact your GP,
                call <strong>NHS 111</strong>, or call <strong>999</strong> if it&apos;s an emergency. You can
                still submit this form so your physiotherapist has the detail.
              </p>
            )}
          </StepShell>
        )}

        {step === "consent" && (
          <StepShell title="Last step — your consent.">
            <div className="assessment-wizard__consent">
              {CONSENT_ITEMS.map((c) => (
                <label key={c.key} className="assessment-wizard__consent-item">
                  <input
                    type="checkbox"
                    checked={state.consent[c.key]}
                    onChange={(e) => patch({ consent: { ...state.consent, [c.key]: e.target.checked } })}
                  />
                  <span>
                    {c.key === "privacy" ? (
                      <>
                        I&apos;ve read how my information is used (
                        <Link href="/privacy-policy" target="_blank">privacy policy</Link>
                        ).
                      </>
                    ) : (
                      c.label
                    )}
                  </span>
                </label>
              ))}
              <label className="assessment-wizard__field">
                Type your name to confirm
                <input
                  type="text"
                  aria-label="Type your name to confirm"
                  value={state.signature}
                  maxLength={ASSESSMENT_LIMITS.signature}
                  onChange={(e) => patch({ signature: e.target.value })}
                />
              </label>
            </div>
          </StepShell>
        )}
      </div>

      <div className="assessment-wizard__nav">
        {stepIdx > 0 ? (
          <button type="button" className="button secondary" onClick={back}>
            Back
          </button>
        ) : (
          <span />
        )}
        {step === "consent" ? (
          <button
            type="button"
            className="button primary"
            disabled={!canAdvance("consent", state) || saving}
            onClick={() => void handleSubmit()}
          >
            {saving ? "Submitting…" : "Submit"}
          </button>
        ) : (
          <button
            type="button"
            className="button primary"
            disabled={!canAdvance(step, state)}
            onClick={forward}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

function StepShell({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="assessment-wizard__panel">
      <h1>{title}</h1>
      {hint && <p className="assessment-wizard__hint">{hint}</p>}
      <div className="assessment-wizard__body">{children}</div>
    </div>
  );
}
