"use client";

// Patient-facing pre-appointment assessment. The booking context is carried
// into a short, four-section flow, and stable details from the latest assessment
// are reused so returning patients only need to confirm what changed. Every
// section remains directly accessible so answers can be reviewed and edited.

import Link from "next/link";
import { Check } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { BodyChart } from "@/components/body-chart";
import { useToast } from "@/components/toast-provider";
import {
  ASSESSMENT_LIMITS,
  CONDITIONAL_RED_FLAG_FIELDS,
  CONDITION_GROUP_LABELS,
  RED_FLAG_FIELD_LABELS,
  defaultGoalSetting,
  defaultObjectiveVideo,
  defaultOnlineReadiness,
  defaultOutcomeMeasures,
  defaultRedFlags,
  defaultSubjectiveProfile,
  getPatientAssessmentForms,
  levelOfConcern,
  submitPatientAssessmentForm,
  type AssessmentFormType,
  type AssessmentRedFlags,
  type ConditionGroup,
  type ConditionalRedFlags,
  type PatientAssessmentFormInput,
} from "@/lib/assessment-forms";
import {
  deriveClinicalArea,
  deriveOnsetPattern,
  deriveSymptomStartDate,
  describeRegions,
  type HowLong,
} from "@/lib/body-chart";
import { calcAge, formatAge } from "@/lib/age";
import type { FocusArea } from "@/lib/cal-services";
import { formatPersonName } from "@/lib/name-format";
import { regionToConditionGroups } from "@/lib/red-flag-groups";
import { validateUKPhone } from "@/lib/validation";

interface Props {
  uid: string;
  personId: string;
  displayName: string;
  personName: string;
  personDob?: string;
  bookingId: string;
  formType?: AssessmentFormType;
  focusAreas?: FocusArea[];
  onSubmitted: (formId: string) => void;
  /** Skip the completion screen while the booking flow redirects to Stripe. */
  redirectingToPayment?: boolean;
}

type StepId = "concern" | "health" | "safety" | "review";

const STEPS: Array<{ id: StepId; label: string; description: string }> = [
  { id: "concern", label: "Your concern", description: "Symptoms and impact" },
  { id: "health", label: "Health details", description: "Only what is relevant" },
  { id: "safety", label: "Safety check", description: "One combined screen" },
  { id: "review", label: "Review", description: "Confirm and submit" },
];

const HOW_LONG: Array<{ value: HowLong; label: string }> = [
  { value: "days", label: "A few days" },
  { value: "weeks", label: "A few weeks" },
  { value: "months", label: "A few months or more" },
  { value: "since-op", label: "Since an operation" },
  { value: "not-sure", label: "Not sure" },
];

const RED_FLAGS: Array<{ key: keyof AssessmentRedFlags; label: string }> = [
  { key: "majorTrauma", label: "A recent serious injury, fall or suspected broken bone" },
  { key: "chestPainBreathlessness", label: "Chest pain, breathlessness, blackouts or dizziness" },
  { key: "bladderBowelSaddle", label: "New bladder or bowel problems, or numbness around the saddle area" },
  { key: "progressiveWeakness", label: "Weakness or clumsiness that is quickly getting worse" },
  { key: "unexplainedFeverWeightLoss", label: "Unexplained fever, night sweats or weight loss" },
  { key: "nightPain", label: "Constant pain that is there all night" },
  { key: "steroidUseOrOsteoporosis", label: "Long-term steroid use or known osteoporosis" },
  { key: "anticoagulantMedication", label: "Taking blood-thinning medication" },
  { key: "persistentCough", label: "A persistent cough" },
  { key: "smoker", label: "Current or recent smoker" },
  { key: "systemicallyUnwellFeverFatigue", label: "Feeling generally unwell with fever or fatigue" },
  { key: "recreationalIVDrugUse", label: "History of recreational IV drug use" },
  { key: "nightSweats", label: "Night sweats" },
  { key: "weightLoss", label: "Unexplained weight loss" },
  { key: "thoracicPain", label: "Pain in the middle of your back" },
  { key: "cancerOrFamilyHistory", label: "Personal or family history of cancer" },
  { key: "immunocompromised", label: "A weakened immune system" },
];

const CONSENT_ITEMS: Array<{ key: "care" | "data" | "privacy" | "safety"; label: string }> = [
  { key: "care", label: "I agree to an online physiotherapy assessment and treatment." },
  { key: "data", label: "I agree to PhysioOnClick storing this information to provide my care." },
  { key: "privacy", label: "I have read how my information is used." },
  { key: "safety", label: "I understand my physiotherapist may contact my GP or emergency services if there is a safety concern." },
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
  conditionalFlags: ConditionalRedFlags;
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
  conditionalFlags: {},
  consent: { care: false, data: false, privacy: false, safety: false },
  signature: "",
};

type SafetyItem =
  | { id: string; kind: "common"; key: keyof AssessmentRedFlags; label: string }
  | { id: string; kind: "conditional"; group: ConditionGroup; key: string; label: string };

function draftKey(uid: string, personId: string, bookingId: string) {
  return `poc-assessment-draft-${bookingId || `${uid}-${personId}`}`;
}

function hasSelectedSafetyItem(state: WizardState) {
  return (
    RED_FLAGS.some((item) => state.redFlags[item.key]) ||
    Object.values(state.conditionalFlags).some((fields) => fields && Object.values(fields).some(Boolean))
  );
}

function canAdvance(step: StepId, state: WizardState): boolean {
  switch (step) {
    case "concern":
      return (
        state.regions.length > 0 &&
        state.story.trim().length >= 10 &&
        state.howLong !== "" &&
        state.impact.trim().length >= 5
      );
    case "health":
      return (
        state.ecName.trim().length > 0 &&
        state.ecPhone.trim().length > 0 &&
        validateUKPhone(state.ecPhone) === null
      );
    case "safety":
      return state.redFlags.none || hasSelectedSafetyItem(state);
    case "review":
      return (
        state.consent.care &&
        state.consent.data &&
        state.consent.privacy &&
        state.consent.safety
      );
  }
}

function restoreDraft(raw: string): WizardState {
  const saved = JSON.parse(raw) as Partial<WizardState>;
  return {
    ...INITIAL,
    ...saved,
    redFlags: { ...defaultRedFlags, ...(saved.redFlags ?? {}) },
    conditionalFlags: saved.conditionalFlags ?? {},
    consent: { ...INITIAL.consent, ...(saved.consent ?? {}) },
    // Older drafts stored a typed confirmation/name here. The current flow
    // only needs the consent checkboxes.
    signature: "",
  };
}

function suggestionKey(regions: string[], focusAreas: FocusArea[]) {
  if (regions.length > 0) return regions.join("|");
  return focusAreas.join("|");
}

function suggestionCategory(regions: string[], focusAreas: FocusArea[]) {
  const text = [...regions, ...focusAreas].join(" ").toLowerCase();
  if (text.includes("shoulder") || text.includes("upper-arm")) return "shoulder";
  if (text.includes("neck") || text.includes("back")) return "back-neck";
  if (text.includes("post-surgery") || text.includes("since-op")) return "post-surgery";
  if (text.includes("sports")) return "sports";
  if (text.includes("neuro")) return "neuro";
  if (text.includes("paediatric")) return "paediatric";
  if (text.includes("knee")) return "knee";
  if (text.includes("hip")) return "hip";
  if (text.includes("ankle") || text.includes("foot")) return "ankle-foot";
  if (text.includes("elbow") || text.includes("wrist") || text.includes("hand") || text.includes("forearm")) return "arm-hand";
  return "general";
}

function suggestedAssessmentCopy(regions: string[], focusAreas: FocusArea[]) {
  const area = regions.length > 0 ? describeRegions(regions) : focusAreas.join(", ") || "this area";
  const selectedCount = regions.length || focusAreas.length;
  if (selectedCount > 1) {
    return {
      story: `I have symptoms around ${area}. It may be linked to a combination of strain, overload, stiffness, joint or tendon irritation, posture, or nerve sensitivity. I am avoiding sharp painful movements, sudden increases in activity and pushing through pain until I am assessed.`,
      impact: "It is stopping me from normal daily activities, sleep, work, driving, exercise, sport or hobbies depending on which area is most irritated.",
    };
  }
  const category = suggestionCategory(regions, focusAreas);
  const copies: Record<string, { story: string; impact: string }> = {
    "back-neck": {
      story: `I have pain or stiffness around ${area}. It may be linked to posture, a strain, joint irritation or nerve sensitivity. I am avoiding sudden heavy lifting, sharp painful movements and long static positions until I am assessed.`,
      impact: "It is stopping me from sitting comfortably, sleeping well, driving, working at a desk or doing normal exercise.",
    },
    shoulder: {
      story: `I have pain or restriction around ${area}. It may be linked to a rotator cuff or tendon irritation, overload, stiffness or a strain. I am avoiding heavy lifting, sudden reaching and pushing through sharp pain until I am assessed.`,
      impact: "It is stopping me from reaching overhead, lifting, dressing, sleeping on that side or doing gym/work tasks.",
    },
    knee: {
      story: `I have pain, stiffness or swelling around ${area}. It may be linked to joint irritation, tendon overload, a twist or recovery after activity. I am avoiding running, jumping, twisting and forcing painful bending until I am assessed.`,
      impact: "It is stopping me from stairs, walking, squatting, kneeling, running or standing for long periods.",
    },
    hip: {
      story: `I have pain or tightness around ${area}. It may be linked to tendon irritation, joint stiffness, muscle overload or referred pain. I am avoiding pushing through sharp pain, deep painful positions and sudden increases in walking or exercise until I am assessed.`,
      impact: "It is stopping me from walking, stairs, getting in and out of a car, sleeping on that side or exercising.",
    },
    "ankle-foot": {
      story: `I have pain, swelling or stiffness around ${area}. It may be linked to a sprain, tendon irritation, overload or reduced balance. I am avoiding unstable surfaces, running, jumping and pushing through sharp pain until I am assessed.`,
      impact: "It is stopping me from walking normally, stairs, standing, sport, work duties or wearing usual footwear.",
    },
    "arm-hand": {
      story: `I have pain, weakness or stiffness around ${area}. It may be linked to tendon irritation, joint stiffness, nerve sensitivity or overload. I am avoiding heavy gripping, repetitive painful tasks and forcing movements until I am assessed.`,
      impact: "It is stopping me from lifting, gripping, typing, driving, household tasks or work duties.",
    },
    "post-surgery": {
      story: `I am recovering after surgery and have symptoms around ${area}. This may be linked to normal healing, swelling, weakness or stiffness, but I want guidance on safe progression. I am following precautions and avoiding movements or loads I have not been cleared for.`,
      impact: "It is stopping me from walking, stairs, sleeping, daily tasks, work or returning to exercise confidently.",
    },
    sports: {
      story: `I have a sports-related problem around ${area}. It may be linked to overload, a strain, tendon irritation or a recent twist/change in training. I am avoiding sprinting, jumping, heavy loading and pushing through sharp pain until I am assessed.`,
      impact: "It is stopping me from training, match play, running, gym work or returning to my usual sport level.",
    },
    neuro: {
      story: `I have a neurological or movement-related concern affecting ${area}. It may involve balance, coordination, strength, sensation or walking confidence. I am avoiding unsafe tasks without support and want guidance on safe exercises.`,
      impact: "It is stopping me from walking confidently, balance tasks, transfers, stairs, daily activities or exercise.",
    },
    paediatric: {
      story: `There is a movement, pain or activity concern around ${area}. It may relate to growth, strength, coordination, posture, sport or daily activity. We are avoiding activities that cause sharp pain or clear limping until assessed.`,
      impact: "It is stopping school, play, sport, walking, stairs or normal daily activities.",
    },
    general: {
      story: `I have symptoms around ${area}. It may be linked to strain, overload, stiffness, irritation or a change in activity. I am avoiding movements that cause sharp pain and want advice on what is safe to do.`,
      impact: "It is stopping normal daily activities, sleep, work, exercise or hobbies.",
    },
  };
  return copies[category] ?? copies.general;
}

export function AssessmentWizard({
  uid,
  personId,
  displayName,
  personName,
  personDob = "",
  bookingId,
  formType = "initial",
  focusAreas = [],
  onSubmitted,
  redirectingToPayment = false,
}: Props) {
  const toast = useToast();
  const displayPersonName = formatPersonName(personName);
  const displayCompletedBy = formatPersonName(displayName);
  const patientAge = calcAge(personDob);
  const patientAgeLabel = formatAge(personDob);
  const [stepIdx, setStepIdx] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL);
  const [hydrated, setHydrated] = useState(false);
  const [reusedPrevious, setReusedPrevious] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const acceptedSuggestion = useRef({ story: "", impact: "" });

  const step = STEPS[stepIdx]!.id;
  const patch = (next: Partial<WizardState>) => setState((current) => ({
    ...current,
    ...next,
    // A typed confirmation only covers the answers that were visible at that
    // moment. Editing any other answer requires a fresh final confirmation.
    signature: Object.prototype.hasOwnProperty.call(next, "signature")
      ? next.signature ?? ""
      : current.signature
        ? ""
        : current.signature,
  }));
  const relevantConditionGroups = useMemo(() => regionToConditionGroups(state.regions), [state.regions]);
  const urgent = levelOfConcern(state.redFlags, state.conditionalFlags) === "emergency";
  const currentSuggestion = useMemo(
    () => suggestedAssessmentCopy(state.regions, focusAreas),
    [state.regions, focusAreas],
  );
  const currentSuggestionKey = useMemo(
    () => suggestionKey(state.regions, focusAreas),
    [state.regions, focusAreas],
  );
  const hasSuggestion = currentSuggestionKey !== "";

  const safetyItems = useMemo(() => {
    const seen = new Set<string>();
    const items: SafetyItem[] = [];
    const add = (item: SafetyItem) => {
      const normalized = item.label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (seen.has(normalized)) return;
      seen.add(normalized);
      items.push(item);
    };

    RED_FLAGS.forEach((item) => add({ id: `common-${item.key}`, kind: "common", ...item }));
    relevantConditionGroups.forEach((group) => {
      CONDITIONAL_RED_FLAG_FIELDS[group].forEach((key) => {
        add({
          id: `${group}-${key}`,
          kind: "conditional",
          group,
          key,
          label: RED_FLAG_FIELD_LABELS[key] ?? key,
        });
      });
    });
    return items;
  }, [relevantConditionGroups]);

  useEffect(() => {
    let cancelled = false;
    const key = draftKey(uid, personId, bookingId);
    setHydrated(false);
    setReusedPrevious(false);
    setState(INITIAL);

    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        setState(restoreDraft(raw));
        setHydrated(true);
        return () => {
          cancelled = true;
        };
      }
    } catch {
      // Continue without a local draft.
    }

    getPatientAssessmentForms(uid, personId)
      .then((forms) => {
        if (cancelled || forms.length === 0) return;
        const latest = forms[0]!;
        const hasReusableDetails = Boolean(
          latest.medicalHistory || latest.emergencyContactName || latest.emergencyContactPhone,
        );
        if (!hasReusableDetails) return;
        setState((current) => ({
          ...current,
          context: latest.medicalHistory,
          ecName: latest.emergencyContactName,
          ecPhone: latest.emergencyContactPhone,
        }));
        setReusedPrevious(true);
      })
      .catch(() => {
        // Previous answers are a convenience only; never block a new form.
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [uid, personId, bookingId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(draftKey(uid, personId, bookingId), JSON.stringify(state));
    } catch {
      // Draft saving is best-effort.
    }
  }, [state, hydrated, uid, personId, bookingId]);

  useEffect(() => {
    if (!hydrated || !hasSuggestion) return;
    setState((current) => {
      const previous = acceptedSuggestion.current;
      const nextStory = previous.story && current.story === previous.story ? currentSuggestion.story : current.story;
      const nextImpact = previous.impact && current.impact === previous.impact ? currentSuggestion.impact : current.impact;
      acceptedSuggestion.current = {
        story: nextStory === currentSuggestion.story ? currentSuggestion.story : previous.story,
        impact: nextImpact === currentSuggestion.impact ? currentSuggestion.impact : previous.impact,
      };
      if (nextStory === current.story && nextImpact === current.impact) return current;
      return {
        ...current,
        story: nextStory,
        impact: nextImpact,
        signature: current.signature ? "" : current.signature,
      };
    });
  }, [currentSuggestion.story, currentSuggestion.impact, hasSuggestion, hydrated]);

  function goToStep(index: number) {
    if (index < 0 || index >= STEPS.length) return;
    setStepIdx(index);
  }

  function acceptSuggestionOnTab(event: KeyboardEvent<HTMLTextAreaElement>, field: "story" | "impact") {
    if (event.key !== "Tab" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
    const suggestion = currentSuggestion[field].trim();
    if (!hasSuggestion || !suggestion || state[field] === suggestion) return;
    event.preventDefault();
    acceptedSuggestion.current = {
      ...acceptedSuggestion.current,
      [field]: suggestion,
    };
    patch({ [field]: suggestion });
  }

  function toggleSafetyItem(item: SafetyItem) {
    setState((current) => {
      if (item.kind === "common") {
        return {
          ...current,
          redFlags: {
            ...current.redFlags,
            none: false,
            [item.key]: !current.redFlags[item.key],
          },
        };
      }
      const groupFields = current.conditionalFlags[item.group] ?? {};
      return {
        ...current,
        redFlags: { ...current.redFlags, none: false },
        conditionalFlags: {
          ...current.conditionalFlags,
          [item.group]: { ...groupFields, [item.key]: !groupFields[item.key] },
        },
      };
    });
  }

  function isSafetyItemSelected(item: SafetyItem) {
    if (item.kind === "common") return state.redFlags[item.key];
    return state.conditionalFlags[item.group]?.[item.key] === true;
  }

  function selectNone() {
    setState((current) => ({
      ...current,
      redFlags: { ...defaultRedFlags, none: !current.redFlags.none },
      conditionalFlags: {},
    }));
  }

  async function handleSubmit() {
    if (!STEPS.every((item) => canAdvance(item.id, state)) || saving) return;
    setSaving(true);
    const howLong = (state.howLong || "not-sure") as HowLong;
    const input: PatientAssessmentFormInput = {
      formType,
      consultationMode: "online",
      completedVia: "online_form",
      patientName: displayPersonName,
      patientDob: personDob,
      patientAge,
      completedBy: displayCompletedBy,
      relationshipToPatient: displayPersonName === displayCompletedBy ? "self" : "",
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
      conditionalFlags: state.conditionalFlags,
      onlineReadiness: { ...defaultOnlineReadiness },
      consent: {
        careConsent: state.consent.care,
        dataConsent: state.consent.data,
        privacyConsent: state.consent.privacy,
        safetySharing: state.consent.safety,
        videoConsent: false,
      },
      signature: "CONFIRM",
      completedAt: new Date().toISOString().slice(0, 10),
      submittedByUid: uid,
      bookingId,
    };

    try {
      const id = await submitPatientAssessmentForm(uid, personId, input);
      try {
        localStorage.removeItem(draftKey(uid, personId, bookingId));
      } catch {
        // Ignore local storage failures after a successful submission.
      }
      if (redirectingToPayment) {
        setAwaitingPayment(true);
        onSubmitted(id);
      } else {
        setSaving(false);
        setDone(true);
        onSubmitted(id);
      }
    } catch {
      setSaving(false);
      toast.show("We couldn't submit your form. Please try again.", "error");
    }
  }

  if (!hydrated || awaitingPayment || done) {
    const title = !hydrated
      ? "Preparing your assessment"
      : awaitingPayment
        ? "Taking you to payment"
        : "Thank you, that's everything";
    const body = !hydrated
      ? "Checking whether we can reuse details you have already provided."
      : awaitingPayment
        ? "Hold on while we redirect you to secure checkout."
        : "Your physiotherapist will review this before your appointment.";

    return (
      <div className="assessment-wizard assessment-wizard--status">
        <div
          className={`assessment-wizard__status-mark${done ? " assessment-wizard__status-mark--done" : ""}`}
          aria-hidden="true"
        >
          {done ? <Check /> : <span className="assessment-wizard__spinner" />}
        </div>
        <h1>{title}</h1>
        <p>{body}</p>
        {done ? (
          <Link className="button primary" href="/patient/appointments">
            Back to my appointments
          </Link>
        ) : null}
      </div>
    );
  }

  const selectedSafetyCount = safetyItems.filter(isSafetyItemSelected).length;
  const incompleteSteps = STEPS.filter((item) => !canAdvance(item.id, state));
  const canSubmit = incompleteSteps.length === 0;
  const continueLabels: Record<Exclude<StepId, "review">, string> = {
    concern: "Continue to health details",
    health: "Continue to safety check",
    safety: "Review my answers",
  };

  return (
    <div className="assessment-wizard">
      <header className="assessment-wizard__header">
        <div>
          <span className="assessment-wizard__eyebrow">Pre-appointment assessment</span>
          <h1>Help us prepare for {displayPersonName}</h1>
          <p>Short, secure and saved as you go. Open any section to review or change your answers before submitting.</p>
        </div>
        <div className="assessment-wizard__header-meta" aria-label="Assessment context">
          <span>For {displayPersonName}{patientAgeLabel ? ` · Age ${patientAgeLabel}` : ""}</span>
          <span>About 3 minutes</span>
        </div>
      </header>

      {focusAreas.length > 0 ? (
        <div className="assessment-wizard__carried" role="note">
          <strong>Already added from your booking</strong>
          <span>{focusAreas.join(", ")}</span>
        </div>
      ) : null}

      <nav className="assessment-wizard__steps" aria-label="Assessment progress">
        <ol>
          {STEPS.map((item, index) => {
            const sectionComplete = canAdvance(item.id, state);
            const status = index === stepIdx ? "current" : sectionComplete ? "complete" : "incomplete";
            return (
              <li key={item.id} data-status={status}>
                <button
                  type="button"
                  aria-current={status === "current" ? "step" : undefined}
                  aria-label={`${item.label}. ${sectionComplete ? "Complete" : "Needs attention"}. ${item.description}`}
                  onClick={() => goToStep(index)}
                >
                  <span className="assessment-wizard__step-number" aria-hidden="true">
                    {sectionComplete ? <Check /> : index + 1}
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="assessment-wizard__stage" aria-labelledby={`assessment-${step}-title`}>
        {step === "concern" ? (
          <AssessmentStage
            id="assessment-concern-title"
            eyebrow="Step 1"
            title="Tell us what is happening"
            description={
              focusAreas.length > 0
                ? "We have your booking focus. Add the exact location and what you want help with."
                : "Mark the exact location and describe what you want help with."
            }
          >
            <div className="assessment-wizard__section">
              <div className="assessment-wizard__section-heading">
                <div>
                  <h3>Where do you feel it?</h3>
                  <p>Select every area involved. This tailors the safety questions later.</p>
                </div>
                {state.regions.length > 0 ? <span>{state.regions.length} selected</span> : null}
              </div>
              <BodyChart value={state.regions} onChange={(regions) => patch({ regions })} />
            </div>

            <div className="assessment-wizard__field-grid">
              {(state.regions.length > 0 || focusAreas.length > 0) ? (
                <div className="assessment-wizard__suggestion-note assessment-wizard__field--wide" role="note">
                  <strong>Suggested from your selected area</strong>
                  <span>Press Tab inside either text box to use its suggestion, then edit the wording so it matches exactly what is happening for you.</span>
                </div>
              ) : null}

              <label className="assessment-wizard__field assessment-wizard__field--wide">
                <span>What is happening?</span>
                <textarea
                  aria-label="What's going on"
                  rows={4}
                  maxLength={ASSESSMENT_LIMITS.symptoms}
                  value={state.story}
                  onChange={(event) => patch({ story: event.target.value })}
                  onKeyDown={(event) => acceptSuggestionOnTab(event, "story")}
                  placeholder="For example: a sharp pain in my right shoulder when I lift my arm overhead."
                />
                {hasSuggestion ? (
                  <small className="assessment-wizard__suggestion-preview">
                    Suggested: {currentSuggestion.story}
                  </small>
                ) : null}
              </label>

              <fieldset className="assessment-wizard__chips assessment-wizard__field--wide">
                <legend>How long have you had it?</legend>
                {HOW_LONG.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className="assessment-wizard__chip"
                    aria-pressed={state.howLong === item.value}
                    onClick={() => patch({ howLong: item.value })}
                  >
                    {item.label}
                  </button>
                ))}
              </fieldset>

              <label className="assessment-wizard__slider">
                <span>Pain right now</span>
                <strong>{state.pain}/10</strong>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={state.pain}
                  aria-label="Pain right now, 0 to 10"
                  onChange={(event) => patch({ pain: Number(event.target.value) })}
                />
                <span className="assessment-wizard__scale"><span>No pain</span><span>Worst pain</span></span>
              </label>

              <label className="assessment-wizard__field">
                <span>What is it stopping you doing?</span>
                <textarea
                  aria-label="What is it stopping you doing"
                  rows={4}
                  maxLength={ASSESSMENT_LIMITS.functionalImpact}
                  value={state.impact}
                  onChange={(event) => patch({ impact: event.target.value })}
                  onKeyDown={(event) => acceptSuggestionOnTab(event, "impact")}
                  placeholder="For example: sleeping on that side, driving or going to the gym."
                />
                {hasSuggestion ? (
                  <small className="assessment-wizard__suggestion-preview">
                    Suggested: {currentSuggestion.impact}
                  </small>
                ) : null}
              </label>
            </div>
          </AssessmentStage>
        ) : null}

        {step === "health" ? (
          <AssessmentStage
            id="assessment-health-title"
            eyebrow="Step 2"
            title="Health details"
            description="Tell us only what may affect your assessment. You can leave the first box blank."
          >
            {reusedPrevious ? (
              <div className="assessment-wizard__reuse" role="status">
                <strong>Saved you some typing</strong>
                <span>We reused your latest health and emergency contact details. Update them only if something changed.</span>
              </div>
            ) : null}

            <label className="assessment-wizard__field">
              <span>Relevant health information <small>Optional</small></span>
              <textarea
                aria-label="Relevant health information"
                rows={5}
                maxLength={ASSESSMENT_LIMITS.medicalHistory}
                value={state.context}
                onChange={(event) => patch({ context: event.target.value })}
                placeholder="Medicines, allergies, health conditions, previous injuries or operations."
              />
            </label>

            <div className="assessment-wizard__section assessment-wizard__section--plain">
              <div className="assessment-wizard__section-heading">
                <div>
                  <h3>Emergency contact</h3>
                  <p>Required for online appointments. We only use this if there is a safety concern.</p>
                </div>
              </div>
              <div className="assessment-wizard__field-grid">
                <label className="assessment-wizard__field">
                  <span>Name</span>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={state.ecName}
                    maxLength={ASSESSMENT_LIMITS.emergencyContactName}
                    onChange={(event) => patch({ ecName: event.target.value })}
                  />
                </label>
                <label className="assessment-wizard__field">
                  <span>UK phone number</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    autoComplete="tel"
                    value={state.ecPhone}
                    maxLength={ASSESSMENT_LIMITS.emergencyContactPhone}
                    onChange={(event) => patch({ ecPhone: event.target.value })}
                  />
                  {state.ecPhone.trim() !== "" && validateUKPhone(state.ecPhone) !== null ? (
                    <span className="field-error">Enter a valid UK phone number.</span>
                  ) : null}
                </label>
              </div>
            </div>
          </AssessmentStage>
        ) : null}

        {step === "safety" ? (
          <AssessmentStage
            id="assessment-safety-title"
            eyebrow="Step 3"
            title="One safety check"
            description="Select anything that applies now. We have combined the general and area-specific checks, so nothing is asked twice."
          >
            <div className="assessment-wizard__safety-summary">
              <span>{describeRegions(state.regions)}</span>
              <strong>{selectedSafetyCount > 0 ? `${selectedSafetyCount} selected` : "Choose an answer"}</strong>
            </div>

            <div className="assessment-wizard__flags" role="group" aria-label="Safety symptoms">
              {safetyItems.map((item) => (
                <label className="assessment-wizard__flag" key={item.id}>
                  <input
                    type="checkbox"
                    checked={isSafetyItemSelected(item)}
                    onChange={() => toggleSafetyItem(item)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
              <label className="assessment-wizard__flag assessment-wizard__flag--none">
                <input type="checkbox" checked={state.redFlags.none} onChange={selectNone} />
                <span>None of these apply</span>
              </label>
            </div>

            {relevantConditionGroups.length > 0 ? (
              <p className="assessment-wizard__tailored-note">
                Tailored for {relevantConditionGroups.map((group) => CONDITION_GROUP_LABELS[group]).join(", ").toLowerCase()}.
              </p>
            ) : null}

            {urgent ? (
              <div className="assessment-wizard__alert" role="alert">
                <strong>Please seek medical advice now</strong>
                <span>
                  Some answers may need urgent attention. Contact your GP or NHS 111, or call 999 in an emergency.
                  You can still submit this form for your physiotherapist to review.
                </span>
              </div>
            ) : null}
          </AssessmentStage>
        ) : null}

        {step === "review" ? (
          <AssessmentStage
            id="assessment-review-title"
            eyebrow="Step 4"
            title="Review and confirm"
            description="Check the summary, then confirm your consent. Your physiotherapist receives the full answers."
          >
            {incompleteSteps.some((item) => item.id !== "review") ? (
              <div className="assessment-wizard__attention" role="status">
                <strong>Some sections still need attention</strong>
                <span>
                  Complete {incompleteSteps.filter((item) => item.id !== "review").map((item) => item.label.toLowerCase()).join(", ")} before submitting.
                  You can open any section using the buttons above.
                </span>
              </div>
            ) : null}
            <div className="assessment-wizard__review-list">
              <ReviewRow label="Your concern" value={canAdvance("concern", state) ? `${describeRegions(state.regions)}. ${state.story}` : "Complete your symptoms, body area, duration and impact."} onEdit={() => setStepIdx(0)} complete={canAdvance("concern", state)} />
              <ReviewRow label="Impact and pain" value={state.impact ? `${state.impact} Pain ${state.pain}/10.` : "Tell us what the problem is stopping you doing."} onEdit={() => setStepIdx(0)} complete={canAdvance("concern", state)} />
              <ReviewRow label="Health details" value={state.context || "No additional health information provided."} onEdit={() => setStepIdx(1)} />
              <ReviewRow label="Emergency contact" value={canAdvance("health", state) ? `${state.ecName}, ${state.ecPhone}` : "Add a name and valid UK phone number."} onEdit={() => setStepIdx(1)} complete={canAdvance("health", state)} />
              <ReviewRow
                label="Safety check"
                value={canAdvance("safety", state) ? (state.redFlags.none ? "None of the listed concerns apply." : `${selectedSafetyCount} item${selectedSafetyCount === 1 ? "" : "s"} selected for clinical review.`) : "Choose any symptoms that apply, or select none of these apply."}
                onEdit={() => setStepIdx(2)}
                complete={canAdvance("safety", state)}
              />
            </div>

            <div className="assessment-wizard__consent">
              <h3>Your consent</h3>
              {CONSENT_ITEMS.map((item) => (
                <label key={item.key} className="assessment-wizard__consent-item">
                  <input
                    type="checkbox"
                    checked={state.consent[item.key]}
                    onChange={(event) => patch({ consent: { ...state.consent, [item.key]: event.target.checked } })}
                  />
                  <span>
                    {item.label}
                    {item.key === "privacy" ? (
                      <> Read the <Link href="/privacy-policy" target="_blank">privacy policy</Link>.</>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </AssessmentStage>
        ) : null}

        <footer className="assessment-wizard__nav">
          <button type="button" className="button secondary" disabled={stepIdx === 0} onClick={() => goToStep(stepIdx - 1)}>
            Back
          </button>
          <span className="assessment-wizard__save-note">Draft saved automatically</span>
          {step === "review" ? (
            <button
              type="button"
              className="button primary"
              disabled={!canSubmit || saving}
              onClick={() => void handleSubmit()}
            >
              {saving ? "Submitting" : "Submit assessment"}
            </button>
          ) : (
            <button
              type="button"
              className="button primary"
              disabled={!canAdvance(step, state)}
              onClick={() => goToStep(stepIdx + 1)}
            >
              {continueLabels[step]}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

function AssessmentStage({ id, eyebrow, title, description, children }: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="assessment-wizard__panel">
      <header className="assessment-wizard__stage-header">
        <span>{eyebrow}</span>
        <h2 id={id}>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="assessment-wizard__body">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value, onEdit, complete = true }: { label: string; value: string; onEdit: () => void; complete?: boolean }) {
  return (
    <div className="assessment-wizard__review-row">
      <div>
        <span>{label}</span>
        <p>{value}</p>
      </div>
      <button type="button" onClick={onEdit} aria-label={`Edit ${label.toLowerCase()}`}>
        {complete ? "Edit" : "Complete"}
      </button>
    </div>
  );
}
