"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  ASSESSMENT_LIMITS,
  defaultGoalSetting,
  defaultObjectiveVideo,
  defaultAssessmentConsent,
  defaultOnlineReadiness,
  defaultOutcomeMeasures,
  defaultRedFlags,
  defaultSubjectiveProfile,
  getPatientAssessmentForms,
  hasUrgentRedFlags,
  submitPatientAssessmentForm,
  type AssessmentConsent,
  type AssessmentFormType,
  type ClinicalArea,
  type ConsultationMode,
  type GoalSetting,
  type ObjectiveVideoAssessment,
  type OnsetPattern,
  type OnlineReadiness,
  type OutcomeMeasureSet,
  type PatientAssessmentFormInput,
  type PatientAssessmentFormRecord,
  type AssessmentRedFlags,
  type SubjectiveAssessmentProfile,
} from "@/lib/assessment-forms";
import { storage } from "@/lib/firebase";
import { validateOptionalText, validateRequiredText, validateUKPhone } from "@/lib/validation";
import { useToast } from "@/components/toast-provider";
import { SkeletonRow } from "@/components/skeleton";

interface Props {
  uid: string;
  personId: string;
  displayName: string;
  personName: string;
  bookingId?: string;
  onSubmitted?: (formId: string) => void;
}

interface HistoryProps {
  uid: string;
  personId: string;
  reloadKey: number;
}

type FormErrors = Record<string, string>;

interface QueuedAssessment {
  id: string;
  queuedAt: string;
  payload: PatientAssessmentFormInput;
}

const redFlagLabels: { key: keyof AssessmentRedFlags; label: string }[] = [
  { key: "majorTrauma", label: "Recent major trauma, fall, accident or suspected fracture" },
  { key: "chestPainBreathlessness", label: "Chest pain, severe breathlessness, fainting or new unexplained dizziness" },
  { key: "bladderBowelSaddle", label: "New bladder or bowel changes, or numbness around the saddle area" },
  { key: "progressiveWeakness", label: "Rapidly worsening weakness, loss of coordination or new foot drop" },
  { key: "unexplainedFeverWeightLoss", label: "Unexplained fever, infection signs, night sweats or weight loss" },
  { key: "nightPain", label: "Constant night pain or pain that does not change with rest or position" },
  { key: "none", label: "None of these apply" },
];

const onsetOptions: { value: OnsetPattern; label: string }[] = [
  { value: "gradual", label: "Gradual" },
  { value: "sudden", label: "Sudden" },
  { value: "recurring", label: "Recurring" },
  { value: "post_surgery", label: "Post-surgery" },
  { value: "not_sure", label: "Not sure" },
];

interface ObjectiveTaskTemplate {
  taskId: string;
  taskLabel: string;
  metricName: string;
  metricUnit: string;
  safetyNote: string;
}

interface ClinicalAreaOption {
  value: ClinicalArea;
  label: string;
  outcomeHint: string;
  conditionMeasurePlaceholder: string;
  redFlagFocus: string;
  objectiveTask: ObjectiveTaskTemplate;
  goalIdeas: string[];
}

const clinicalAreaOptions: ClinicalAreaOption[] = [
  {
    value: "spine",
    label: "Spine, neck or back",
    outcomeHint: "PSFS, pain 0-10, and a clinician-selected spine disability measure where appropriate.",
    conditionMeasurePlaceholder: "Example: ODI, NDI or RMDQ score",
    redFlagFocus: "Watch for bladder or bowel changes, saddle numbness, progressive weakness, fever, trauma and constant night pain.",
    objectiveTask: {
      taskId: "spine-functional-screen",
      taskLabel: "Comfortable spine movement or sit-to-stand screen",
      metricName: "Movement confidence",
      metricUnit: "/10",
      safetyNote: "Record only comfortable movement. Stop if symptoms spread, worsen sharply, or any red flag is present.",
    },
    goalIdeas: ["Walk for 20 minutes", "Sit through work comfortably", "Lift a light bag safely"],
  },
  {
    value: "upper_limb",
    label: "Shoulder, arm, wrist or hand",
    outcomeHint: "PSFS, pain 0-10, grip or reach metric, and a clinician-selected upper limb PROM if used.",
    conditionMeasurePlaceholder: "Example: QuickDASH or SPADI score",
    redFlagFocus: "Watch for new severe weakness, major trauma, spreading numbness, chest symptoms or unexplained swelling.",
    objectiveTask: {
      taskId: "upper-limb-reach",
      taskLabel: "Active reach or hand function clip",
      metricName: "Reach quality",
      metricUnit: "/10",
      safetyNote: "Use a comfortable reach or hand task. Keep load light unless your physiotherapist has agreed otherwise.",
    },
    goalIdeas: ["Reach a high shelf", "Carry shopping", "Type or grip without flare-up"],
  },
  {
    value: "lower_limb",
    label: "Hip, knee, ankle or foot",
    outcomeHint: "PSFS, pain 0-10, walking or sit-to-stand metric, and a clinician-selected lower limb PROM if used.",
    conditionMeasurePlaceholder: "Example: LEFS, Oxford Knee/Hip score",
    redFlagFocus: "Watch for major trauma, inability to weight-bear, new calf swelling, infection signs or rapid weakness.",
    objectiveTask: {
      taskId: "lower-limb-sit-to-stand",
      taskLabel: "30-second sit-to-stand or step-up clip",
      metricName: "Completed repetitions",
      metricUnit: "reps",
      safetyNote: "Use a stable chair and stop if pain, dizziness or balance feels unsafe. Skip this if weight-bearing is not safe.",
    },
    goalIdeas: ["Climb one flight of stairs", "Walk to the shops", "Return to running drills"],
  },
  {
    value: "balance_walking",
    label: "Balance, walking or falls",
    outcomeHint: "PSFS, falls history, walking speed/TUG where appropriate, and confidence with daily mobility.",
    conditionMeasurePlaceholder: "Example: TUG, 10m walk test or ABC scale",
    redFlagFocus: "Watch for new dizziness, fainting, sudden weakness, chest symptoms, head injury or rapidly worsening balance.",
    objectiveTask: {
      taskId: "walking-balance-clip",
      taskLabel: "Short walking or transfer clip",
      metricName: "Task time",
      metricUnit: "seconds",
      safetyNote: "Record with a support person nearby if needed. Do not film balance tasks that feel unsafe.",
    },
    goalIdeas: ["Walk outdoors confidently", "Stand from a chair safely", "Reduce near-falls at home"],
  },
  {
    value: "neuro",
    label: "Neurological rehabilitation",
    outcomeHint: "PSFS plus clinician-selected neurological or functional measures such as gait, transfer or upper limb scales.",
    conditionMeasurePlaceholder: "Example: gait speed, TUG, Barthel or Fugl-Meyer score",
    redFlagFocus: "Watch for sudden facial droop, speech change, new severe weakness, seizure, chest symptoms or acute confusion.",
    objectiveTask: {
      taskId: "neuro-functional-transfer",
      taskLabel: "Functional transfer, gait or upper limb task clip",
      metricName: "Movement quality",
      metricUnit: "/10",
      safetyNote: "Only record a task already considered safe for you, with support or equipment as normally used.",
    },
    goalIdeas: ["Transfer with less help", "Improve foot clearance", "Use the affected hand in a daily task"],
  },
  {
    value: "post_op",
    label: "Post-operative rehab",
    outcomeHint: "PSFS, pain 0-10, swelling/function notes, and operation-specific measures selected by the clinician.",
    conditionMeasurePlaceholder: "Example: operation-specific PROM or range target",
    redFlagFocus: "Watch for infection signs, calf pain/swelling, chest symptoms, wound changes or sudden function loss.",
    objectiveTask: {
      taskId: "post-op-agreed-task",
      taskLabel: "Post-op functional task agreed with your physio",
      metricName: "Task result",
      metricUnit: "score",
      safetyNote: "Stay inside surgical precautions and record only tasks already cleared for your current stage.",
    },
    goalIdeas: ["Meet the next rehab milestone", "Walk without limping", "Return to work duties"],
  },
  {
    value: "pelvic_health",
    label: "Pelvic health",
    outcomeHint: "PSFS plus sensitive symptom goals and validated pelvic health measures chosen by the clinician.",
    conditionMeasurePlaceholder: "Example: clinician-selected pelvic health PROM",
    redFlagFocus: "Watch for severe new pain, infection signs, heavy bleeding, new neurological symptoms or bladder/bowel red flags.",
    objectiveTask: {
      taskId: "pelvic-health-no-video",
      taskLabel: "No video unless explicitly agreed",
      metricName: "Self-rated function",
      metricUnit: "/10",
      safetyNote: "Do not upload intimate footage. Use written measures unless a specific, appropriate functional task is agreed.",
    },
    goalIdeas: ["Exercise with confidence", "Manage symptoms at work", "Return to daily activities without fear"],
  },
  {
    value: "paediatric",
    label: "Paediatric assessment",
    outcomeHint: "PSFS-style parent goals, age-appropriate function, play and participation measures selected by the clinician.",
    conditionMeasurePlaceholder: "Example: age-appropriate functional measure",
    redFlagFocus: "Watch for fever, unexplained deterioration, non-weight-bearing, safeguarding concerns or sudden neurological change.",
    objectiveTask: {
      taskId: "paediatric-play-function",
      taskLabel: "Parent or guardian guided play/function clip",
      metricName: "Task quality",
      metricUnit: "/10",
      safetyNote: "Film only age-appropriate daily activity with guardian consent and a safe space.",
    },
    goalIdeas: ["Join playground activity", "Walk or run more confidently", "Use stairs with less help"],
  },
  {
    value: "general",
    label: "General or not sure",
    outcomeHint: "PSFS, pain 0-10, confidence score and the most relevant clinician-selected measure.",
    conditionMeasurePlaceholder: "Example: measure name and score",
    redFlagFocus: "Watch for any sudden, severe, unexplained or rapidly worsening symptoms.",
    objectiveTask: {
      taskId: "general-functional-task",
      taskLabel: "Short clip of the main difficult daily task",
      metricName: "Task confidence",
      metricUnit: "/10",
      safetyNote: "Choose a safe, ordinary task that represents the problem. Stop if symptoms feel unsafe.",
    },
    goalIdeas: ["Do the task that matters most", "Reduce flare-ups", "Build confidence with movement"],
  },
];

const psfsSlots = [
  { activity: "psfsActivity1", score: "psfsScore1", label: "Activity 1" },
  { activity: "psfsActivity2", score: "psfsScore2", label: "Activity 2" },
  { activity: "psfsActivity3", score: "psfsScore3", label: "Activity 3" },
] as const;

const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

const reviewStatusLabel: Record<PatientAssessmentFormRecord["reviewStatus"], string> = {
  awaiting_review: "Awaiting physio review",
  reviewed: "Reviewed",
  needs_more_info: "Needs more information",
  urgent_advice: "Urgent advice noted",
};

function draftKey(uid: string, personId: string) {
  return `poc:assessment:draft:${uid}:${personId}`;
}

function outboxKey(uid: string, personId: string) {
  return `poc:assessment:outbox:${uid}:${personId}`;
}

function makeInitialForm(uid: string, displayName: string, personName: string): PatientAssessmentFormInput {
  const defaultTask = getClinicalAreaOption("general").objectiveTask;
  return {
    formType: "initial",
    consultationMode: "online",
    completedVia: "online_form",
    patientName: personName || displayName,
    completedBy: displayName,
    relationshipToPatient: personName && personName !== displayName ? "Parent/carer" : "Self",
    presentingComplaint: "",
    bodyArea: "",
    symptomStartDate: "",
    onsetPattern: "gradual",
    painScore: 5,
    subjective: { ...defaultSubjectiveProfile },
    outcomes: { ...defaultOutcomeMeasures },
    objectiveVideo: {
      ...defaultObjectiveVideo,
      taskId: defaultTask.taskId,
      taskLabel: defaultTask.taskLabel,
      metricName: defaultTask.metricName,
      metricUnit: defaultTask.metricUnit,
    },
    goalsPlan: { ...defaultGoalSetting, reviewDate: defaultReviewDate(defaultGoalSetting.timeframeWeeks) },
    symptoms: "",
    aggravatingFactors: "",
    easingFactors: "",
    functionalImpact: "",
    goals: "",
    medicalHistory: "",
    medications: "",
    allergies: "",
    previousTreatment: "",
    communicationNeeds: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    redFlags: { ...defaultRedFlags },
    onlineReadiness: { ...defaultOnlineReadiness },
    consent: { ...defaultAssessmentConsent },
    signature: "",
    completedAt: "",
    submittedByUid: uid,
  };
}

function parseStoredForm(
  raw: string | null,
  fallback: PatientAssessmentFormInput
): PatientAssessmentFormInput | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PatientAssessmentFormInput>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      ...fallback,
      ...parsed,
      redFlags: { ...fallback.redFlags, ...(parsed.redFlags ?? {}) },
      onlineReadiness: { ...fallback.onlineReadiness, ...(parsed.onlineReadiness ?? {}) },
      consent: { ...fallback.consent, ...(parsed.consent ?? {}) },
      subjective: { ...fallback.subjective, ...(parsed.subjective ?? {}) },
      outcomes: { ...fallback.outcomes, ...(parsed.outcomes ?? {}) },
      objectiveVideo: { ...fallback.objectiveVideo, ...(parsed.objectiveVideo ?? {}) },
      goalsPlan: { ...fallback.goalsPlan, ...(parsed.goalsPlan ?? {}) },
      painScore: typeof parsed.painScore === "number" ? parsed.painScore : fallback.painScore,
      completedAt: typeof parsed.completedAt === "string" ? parsed.completedAt : fallback.completedAt,
      submittedByUid: fallback.submittedByUid,
    };
  } catch {
    return null;
  }
}

function readQueue(key: string): QueuedAssessment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is QueuedAssessment => {
      if (!item || typeof item !== "object") return false;
      const q = item as Partial<QueuedAssessment>;
      return typeof q.id === "string" && typeof q.queuedAt === "string" && !!q.payload;
    });
  } catch {
    return [];
  }
}

function writeQueue(key: string, queue: QueuedAssessment[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(queue));
}

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

function isOverLimit(value: string, max: number): string | null {
  return validateOptionalText(value, max);
}

function getClinicalAreaOption(area: ClinicalArea): ClinicalAreaOption {
  return clinicalAreaOptions.find((option) => option.value === area) ?? clinicalAreaOptions[clinicalAreaOptions.length - 1];
}

function isWholeNumberInRange(value: number, min: number, max: number) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function normalisePositiveNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function getPsfsAverage(outcomes: OutcomeMeasureSet): number | null {
  const scored = psfsSlots
    .map((slot) => ({
      activity: outcomes[slot.activity].trim(),
      score: outcomes[slot.score],
    }))
    .filter((slot) => slot.activity.length > 0);

  if (scored.length === 0) return null;
  const total = scored.reduce((sum, slot) => sum + slot.score, 0);
  return Math.round((total / scored.length) * 10) / 10;
}

function defaultReviewDate(weeks: number) {
  const date = new Date();
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

function safePathSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "objective";
}

function videoExtension(contentType: string) {
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("quicktime")) return "mov";
  return "webm";
}

function normaliseVideoContentType(contentType: string) {
  const lower = contentType.toLowerCase();
  if (lower.includes("mp4")) return "video/mp4";
  if (lower.includes("quicktime") || lower.includes("mov")) return "video/quicktime";
  return "video/webm";
}

function validateForm(form: PatientAssessmentFormInput): FormErrors {
  const errors: FormErrors = {};
  const requiredChecks: [string, string | null][] = [
    ["patientName", validateRequiredText(form.patientName, { min: 2, max: ASSESSMENT_LIMITS.patientName, message: "Enter the patient's name." })],
    ["completedBy", validateRequiredText(form.completedBy, { min: 2, max: ASSESSMENT_LIMITS.completedBy, message: "Enter who completed this form." })],
    ["bodyArea", validateRequiredText(form.bodyArea, { min: 2, max: ASSESSMENT_LIMITS.bodyArea, message: "Enter the main body area or problem." })],
    ["presentingComplaint", validateRequiredText(form.presentingComplaint, { min: 10, max: ASSESSMENT_LIMITS.presentingComplaint, message: "Describe the main problem in a little more detail." })],
    ["symptoms", validateRequiredText(form.symptoms, { min: 10, max: ASSESSMENT_LIMITS.symptoms, message: "Describe the symptoms you are experiencing." })],
    ["subjective.symptomBehaviour", validateRequiredText(form.subjective.symptomBehaviour, { min: 10, max: ASSESSMENT_LIMITS.symptomBehaviour, message: "Describe how symptoms behave across the day or with activity." })],
    ["outcomes.psfsActivity1", validateRequiredText(form.outcomes.psfsActivity1, { min: 2, max: ASSESSMENT_LIMITS.outcomeActivity, message: "Enter at least one meaningful activity to score." })],
    ["objectiveVideo.taskLabel", validateRequiredText(form.objectiveVideo.taskLabel, { min: 3, max: ASSESSMENT_LIMITS.objectiveTask, message: "Choose or enter the objective task." })],
    ["objectiveVideo.metricName", validateRequiredText(form.objectiveVideo.metricName, { min: 2, max: ASSESSMENT_LIMITS.objectiveMetricName, message: "Enter what will be measured for the objective task." })],
    ["goalsPlan.meaningfulGoal", validateRequiredText(form.goalsPlan.meaningfulGoal, { min: 3, max: ASSESSMENT_LIMITS.goalText, message: "Enter the main goal that matters to the patient." })],
    ["goalsPlan.baseline", validateRequiredText(form.goalsPlan.baseline, { min: 2, max: ASSESSMENT_LIMITS.goalDetail, message: "Enter the current baseline for the goal." })],
    ["goalsPlan.target", validateRequiredText(form.goalsPlan.target, { min: 2, max: ASSESSMENT_LIMITS.goalDetail, message: "Enter the target for the next review." })],
    ["signature", validateRequiredText(form.signature, { min: 2, max: ASSESSMENT_LIMITS.signature, message: "Type your name as a signature." })],
  ];
  for (const [key, error] of requiredChecks) {
    if (error) errors[key] = error;
  }

  const optionalChecks: [string, string | null][] = [
    ["relationshipToPatient", isOverLimit(form.relationshipToPatient, ASSESSMENT_LIMITS.relationshipToPatient)],
    ["symptomStartDate", isOverLimit(form.symptomStartDate, ASSESSMENT_LIMITS.symptomStartDate)],
    ["aggravatingFactors", isOverLimit(form.aggravatingFactors, ASSESSMENT_LIMITS.aggravatingFactors)],
    ["easingFactors", isOverLimit(form.easingFactors, ASSESSMENT_LIMITS.easingFactors)],
    ["functionalImpact", isOverLimit(form.functionalImpact, ASSESSMENT_LIMITS.functionalImpact)],
    ["goals", isOverLimit(form.goals, ASSESSMENT_LIMITS.goals)],
    ["medicalHistory", isOverLimit(form.medicalHistory, ASSESSMENT_LIMITS.medicalHistory)],
    ["medications", isOverLimit(form.medications, ASSESSMENT_LIMITS.medications)],
    ["allergies", isOverLimit(form.allergies, ASSESSMENT_LIMITS.allergies)],
    ["previousTreatment", isOverLimit(form.previousTreatment, ASSESSMENT_LIMITS.previousTreatment)],
    ["communicationNeeds", isOverLimit(form.communicationNeeds, ASSESSMENT_LIMITS.communicationNeeds)],
    ["emergencyContactName", isOverLimit(form.emergencyContactName, ASSESSMENT_LIMITS.emergencyContactName)],
    ["completedAt", isOverLimit(form.completedAt, ASSESSMENT_LIMITS.completedAt)],
    ["subjective.yellowFlags", isOverLimit(form.subjective.yellowFlags, ASSESSMENT_LIMITS.yellowFlags)],
    ["outcomes.psfsActivity2", isOverLimit(form.outcomes.psfsActivity2, ASSESSMENT_LIMITS.outcomeActivity)],
    ["outcomes.psfsActivity3", isOverLimit(form.outcomes.psfsActivity3, ASSESSMENT_LIMITS.outcomeActivity)],
    ["outcomes.conditionMeasureName", isOverLimit(form.outcomes.conditionMeasureName, ASSESSMENT_LIMITS.outcomeMeasureName)],
    ["objectiveVideo.metricUnit", isOverLimit(form.objectiveVideo.metricUnit, ASSESSMENT_LIMITS.objectiveMetricUnit)],
    ["objectiveVideo.qualityNotes", isOverLimit(form.objectiveVideo.qualityNotes, ASSESSMENT_LIMITS.objectiveNotes)],
    ["objectiveVideo.videoUrl", isOverLimit(form.objectiveVideo.videoUrl, ASSESSMENT_LIMITS.videoUrl)],
    ["objectiveVideo.storagePath", isOverLimit(form.objectiveVideo.storagePath, ASSESSMENT_LIMITS.storagePath)],
    ["objectiveVideo.recordedAt", isOverLimit(form.objectiveVideo.recordedAt, ASSESSMENT_LIMITS.completedAt)],
    ["goalsPlan.barriers", isOverLimit(form.goalsPlan.barriers, ASSESSMENT_LIMITS.goalDetail)],
    ["goalsPlan.supportPlan", isOverLimit(form.goalsPlan.supportPlan, ASSESSMENT_LIMITS.goalDetail)],
    ["goalsPlan.reviewDate", isOverLimit(form.goalsPlan.reviewDate, ASSESSMENT_LIMITS.nextCheckupDate)],
  ];
  for (const [key, error] of optionalChecks) {
    if (error) errors[key] = error;
  }

  if (form.symptomStartDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (form.symptomStartDate > today) {
      errors.symptomStartDate = "Use today's date or an earlier date.";
    }
  }

  if (form.painScore < 0 || form.painScore > 10 || !Number.isInteger(form.painScore)) {
    errors.painScore = "Choose a whole number between 0 and 10.";
  }

  if (!isWholeNumberInRange(form.subjective.irritability, 0, 10)) {
    errors["subjective.irritability"] = "Choose a whole number between 0 and 10.";
  }
  if (!isWholeNumberInRange(form.subjective.severity, 0, 10)) {
    errors["subjective.severity"] = "Choose a whole number between 0 and 10.";
  }
  for (const slot of psfsSlots) {
    if (!isWholeNumberInRange(form.outcomes[slot.score], 0, 10)) {
      errors[`outcomes.${slot.score}`] = "Choose a whole number between 0 and 10.";
    }
  }
  if (!isWholeNumberInRange(form.outcomes.painBest, 0, 10)) {
    errors["outcomes.painBest"] = "Choose a whole number between 0 and 10.";
  }
  if (!isWholeNumberInRange(form.outcomes.painWorst, 0, 10)) {
    errors["outcomes.painWorst"] = "Choose a whole number between 0 and 10.";
  }
  if (form.outcomes.painBest > form.outcomes.painWorst) {
    errors["outcomes.painBest"] = "Best pain should not be higher than worst pain.";
  }
  if (!isWholeNumberInRange(form.outcomes.confidenceScore, 0, 10)) {
    errors["outcomes.confidenceScore"] = "Choose a whole number between 0 and 10.";
  }
  if (form.outcomes.conditionMeasureScore < 0 || form.outcomes.conditionMeasureScore > 1000 || !Number.isFinite(form.outcomes.conditionMeasureScore)) {
    errors["outcomes.conditionMeasureScore"] = "Enter a valid condition-specific score.";
  }
  if (form.outcomes.conditionMeasureMax <= 0 || form.outcomes.conditionMeasureMax > 1000 || !Number.isFinite(form.outcomes.conditionMeasureMax)) {
    errors["outcomes.conditionMeasureMax"] = "Enter a valid maximum score.";
  }
  if (form.outcomes.conditionMeasureScore > form.outcomes.conditionMeasureMax) {
    errors["outcomes.conditionMeasureScore"] = "The score should not be higher than the maximum.";
  }

  if (form.objectiveVideo.metricValue < 0 || form.objectiveVideo.metricValue > 10000 || !Number.isFinite(form.objectiveVideo.metricValue)) {
    errors["objectiveVideo.metricValue"] = "Enter a valid objective measure value.";
  }
  if (!isWholeNumberInRange(form.objectiveVideo.reps, 0, 1000)) {
    errors["objectiveVideo.reps"] = "Enter whole-number repetitions between 0 and 1000.";
  }
  if (!isWholeNumberInRange(form.objectiveVideo.durationSeconds, 0, 3600)) {
    errors["objectiveVideo.durationSeconds"] = "Enter a duration from 0 to 3600 seconds.";
  }
  if (form.objectiveVideo.videoUrl && (!form.objectiveVideo.consent || !form.consent.videoConsent)) {
    errors.videoConsent = "Confirm video consent before attaching objective assessment video.";
  }
  if (!isWholeNumberInRange(form.goalsPlan.timeframeWeeks, 1, 52)) {
    errors["goalsPlan.timeframeWeeks"] = "Choose a review timeframe between 1 and 52 weeks.";
  }
  if (!isWholeNumberInRange(form.goalsPlan.confidenceScore, 0, 10)) {
    errors["goalsPlan.confidenceScore"] = "Choose a whole number between 0 and 10.";
  }

  const phoneError = validateUKPhone(form.emergencyContactPhone);
  if (phoneError && (form.emergencyContactPhone.trim() || form.consultationMode === "online")) {
    errors.emergencyContactPhone = phoneError;
  }
  if (form.consultationMode === "online" && !form.emergencyContactName.trim()) {
    errors.emergencyContactName = "Enter an emergency contact for online appointments.";
  }

  const selectedRedFlag = Object.values(form.redFlags).some(Boolean);
  if (!selectedRedFlag) {
    errors.redFlags = "Select any urgent symptoms that apply, or confirm none apply.";
  }

  if (form.consultationMode === "online") {
    const readiness = form.onlineReadiness;
    if (!readiness.privateSpace || !readiness.safeSpace || !readiness.cameraAvailable || !readiness.emergencyContactAvailable) {
      errors.onlineReadiness = "Confirm the online appointment readiness checks.";
    }
  }

  const consent = form.consent;
  if (!consent.careConsent || !consent.dataConsent || !consent.privacyConsent || !consent.safetySharing) {
    errors.consent = "Confirm each consent and safety statement.";
  }

  return errors;
}

export function PatientAssessmentForm({ uid, personId, displayName, personName, bookingId, onSubmitted }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<PatientAssessmentFormInput>(() =>
    makeInitialForm(uid, displayName, personName)
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const syncingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [videoSeconds, setVideoSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const keys = useMemo(() => ({
    draft: draftKey(uid, personId),
    outbox: outboxKey(uid, personId),
  }), [uid, personId]);

  useEffect(() => {
    const fallback = makeInitialForm(uid, displayName, personName);
    const stored = typeof window !== "undefined" ? parseStoredForm(window.localStorage.getItem(keys.draft), fallback) : null;
    setForm(stored ?? fallback);
    setErrors({});
    setStatus(stored ? "Draft restored from this device." : null);
    setQueueCount(readQueue(keys.outbox).length);
  }, [uid, personId, displayName, personName, keys.draft, keys.outbox]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(keys.draft, JSON.stringify(form));
      setDraftSaved(true);
      window.setTimeout(() => setDraftSaved(false), 1800);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [form, keys.draft]);

  useEffect(() => {
    if (!liveVideoRef.current || !mediaStream) return;
    liveVideoRef.current.srcObject = mediaStream;
    void liveVideoRef.current.play().catch(() => undefined);
  }, [mediaStream]);

  useEffect(() => {
    if (!recording || typeof window === "undefined") return;
    setVideoSeconds(0);
    const timer = window.setInterval(() => {
      setVideoSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    return () => {
      mediaStream?.getTracks().forEach((track) => track.stop());
    };
  }, [mediaStream]);

  useEffect(() => {
    return () => {
      if (recordedPreviewUrl) URL.revokeObjectURL(recordedPreviewUrl);
    };
  }, [recordedPreviewUrl]);

  async function syncQueued() {
    if (syncingRef.current || typeof window === "undefined" || !navigator.onLine) return;
    const queue = readQueue(keys.outbox);
    if (queue.length === 0) {
      setQueueCount(0);
      return;
    }

    syncingRef.current = true;
    setSyncing(true);
    const remaining: QueuedAssessment[] = [];
    let lastFormId: string | null = null;
    try {
      for (const item of queue) {
        try {
          lastFormId = await submitPatientAssessmentForm(uid, personId, {
            ...item.payload,
            submittedByUid: uid,
            completedAt: item.payload.completedAt || item.queuedAt,
            completedVia: "offline_draft",
          });
        } catch {
          remaining.push(item);
        }
      }
      writeQueue(keys.outbox, remaining);
      setQueueCount(remaining.length);
      if (remaining.length === 0) {
        toast.show("Offline assessment synced.", "success");
        if (lastFormId) onSubmitted?.(lastFormId);
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => void syncQueued();
    window.addEventListener("online", handleOnline);
    if (navigator.onLine) void syncQueued();
    return () => window.removeEventListener("online", handleOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syncQueued reads the latest keys/form via state and is intentionally event-driven.
  }, [keys.outbox, uid, personId]);

  function setField<K extends keyof PatientAssessmentFormInput>(field: K, value: PatientAssessmentFormInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setStatus(null);
  }

  function setRedFlag(key: keyof AssessmentRedFlags, checked: boolean) {
    setForm((current) => {
      const next = { ...current.redFlags };
      if (key === "none") {
        return {
          ...current,
          redFlags: {
            ...defaultRedFlags,
            none: checked,
          },
        };
      }
      next[key] = checked;
      if (checked) next.none = false;
      return { ...current, redFlags: next };
    });
    setStatus(null);
  }

  function setReadiness(key: keyof OnlineReadiness, checked: boolean) {
    setForm((current) => ({
      ...current,
      onlineReadiness: { ...current.onlineReadiness, [key]: checked },
    }));
    setStatus(null);
  }

  function setConsent(key: keyof AssessmentConsent, checked: boolean) {
    setForm((current) => ({
      ...current,
      consent: { ...current.consent, [key]: checked },
    }));
    setStatus(null);
  }

  function setSubjective<K extends keyof SubjectiveAssessmentProfile>(field: K, value: SubjectiveAssessmentProfile[K]) {
    setForm((current) => ({
      ...current,
      subjective: { ...current.subjective, [field]: value },
    }));
    setStatus(null);
  }

  function setOutcomes<K extends keyof OutcomeMeasureSet>(field: K, value: OutcomeMeasureSet[K]) {
    setForm((current) => ({
      ...current,
      outcomes: { ...current.outcomes, [field]: value },
    }));
    setStatus(null);
  }

  function setObjectiveVideo<K extends keyof ObjectiveVideoAssessment>(field: K, value: ObjectiveVideoAssessment[K]) {
    setForm((current) => ({
      ...current,
      objectiveVideo: { ...current.objectiveVideo, [field]: value },
    }));
    setStatus(null);
  }

  function patchObjectiveVideo(patch: Partial<ObjectiveVideoAssessment>) {
    setForm((current) => ({
      ...current,
      objectiveVideo: { ...current.objectiveVideo, ...patch },
    }));
    setStatus(null);
  }

  function setGoalsPlan<K extends keyof GoalSetting>(field: K, value: GoalSetting[K]) {
    setForm((current) => ({
      ...current,
      goalsPlan: { ...current.goalsPlan, [field]: value },
    }));
    setStatus(null);
  }

  function setGoalTimeframe(weeks: number) {
    setForm((current) => ({
      ...current,
      goalsPlan: {
        ...current.goalsPlan,
        timeframeWeeks: weeks,
        reviewDate: current.goalsPlan.reviewDate || defaultReviewDate(weeks),
      },
    }));
    setStatus(null);
  }

  function applyObjectiveTask(task: ObjectiveTaskTemplate) {
    patchObjectiveVideo({
      taskId: task.taskId,
      taskLabel: task.taskLabel,
      metricName: task.metricName,
      metricUnit: task.metricUnit,
    });
  }

  function handleClinicalAreaChange(area: ClinicalArea) {
    const option = getClinicalAreaOption(area);
    setForm((current) => ({
      ...current,
      subjective: {
        ...current.subjective,
        clinicalArea: area,
      },
      objectiveVideo: {
        ...current.objectiveVideo,
        taskId: option.objectiveTask.taskId,
        taskLabel: option.objectiveTask.taskLabel,
        metricName: option.objectiveTask.metricName,
        metricUnit: option.objectiveTask.metricUnit,
      },
    }));
    setStatus(null);
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
    mediaStream?.getTracks().forEach((track) => track.stop());
    setMediaStream(null);
    setRecording(false);
  }

  async function uploadAssessmentVideo(blob: Blob, hintedType = "") {
    setVideoError(null);
    if (!storage) {
      setVideoError("Video upload is not available right now.");
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setVideoError("Video upload needs an internet connection. The written assessment will still autosave.");
      return;
    }
    if (!form.objectiveVideo.consent || !form.consent.videoConsent) {
      setVideoError("Confirm video consent before attaching a clip.");
      return;
    }
    if (blob.size > VIDEO_MAX_BYTES) {
      setVideoError("Use a clip under 50MB.");
      return;
    }

    const contentType = normaliseVideoContentType(hintedType || blob.type || "video/webm");
    const extension = videoExtension(contentType);
    const now = new Date().toISOString();
    const taskSegment = safePathSegment(form.objectiveVideo.taskId || form.subjective.clinicalArea);
    const personSegment = safePathSegment(personId);
    const storagePath = `patient-assessment-videos/${uid}/${personSegment}/${Date.now()}_${taskSegment}.${extension}`;

    setUploadingVideo(true);
    try {
      const objectRef = ref(storage, storagePath);
      await uploadBytes(objectRef, blob, {
        contentType,
        customMetadata: {
          personId,
          clinicalArea: form.subjective.clinicalArea,
          objectiveTask: form.objectiveVideo.taskId || taskSegment,
        },
      });
      const videoUrl = await getDownloadURL(objectRef);
      patchObjectiveVideo({ videoUrl, storagePath, recordedAt: now });
      toast.show("Objective video attached.", "success");
    } catch {
      setVideoError("Could not upload the video. Please try again when the connection is stable.");
      toast.show("Video upload failed.", "error");
    } finally {
      setUploadingVideo(false);
    }
  }

  async function startRecording() {
    setVideoError(null);
    if (hasUrgentRedFlags(form.redFlags)) {
      setVideoError("Do not record an objective video while urgent symptoms are selected. Seek appropriate medical advice first.");
      return;
    }
    if (!form.objectiveVideo.consent || !form.consent.videoConsent) {
      setVideoError("Confirm video consent before recording.");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setVideoError("This browser does not support in-browser video recording. You can upload an existing clip instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const chunks: BlobPart[] = [];
      const preferredTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: normaliseVideoContentType(recorder.mimeType || "video/webm") });
        setRecordedBlob(blob);
        setRecordedPreviewUrl(URL.createObjectURL(blob));
      };
      setMediaStream(stream);
      recorder.start();
      setRecording(true);
    } catch {
      setVideoError("Camera access was not available. Check browser permissions or upload an existing clip.");
    }
  }

  async function handleVideoFile(file: File | null) {
    if (!file) return;
    setVideoError(null);
    const lowerName = file.name.toLowerCase();
    const lowerType = file.type.toLowerCase();
    const supportedType = lowerType.includes("webm") ||
      lowerType.includes("mp4") ||
      lowerType.includes("quicktime") ||
      lowerName.endsWith(".webm") ||
      lowerName.endsWith(".mp4") ||
      lowerName.endsWith(".mov");
    if ((file.type && !file.type.startsWith("video/")) || !supportedType) {
      setVideoError("Choose a video file.");
      return;
    }
    setRecordedBlob(file);
    setRecordedPreviewUrl(URL.createObjectURL(file));
    await uploadAssessmentVideo(file, file.type || lowerName);
  }

  function queueForLater(payload: PatientAssessmentFormInput) {
    const queue = readQueue(keys.outbox);
    const next = [
      ...queue,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        queuedAt: new Date().toISOString(),
        payload: { ...payload, completedVia: "offline_draft" as const },
      },
    ];
    writeQueue(keys.outbox, next);
    setQueueCount(next.length);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.show("Please check the highlighted assessment fields.", "error");
      return;
    }

    const payload: PatientAssessmentFormInput = {
      ...form,
      completedAt: form.completedAt || new Date().toISOString(),
      submittedByUid: uid,
      completedVia: navigator.onLine ? "online_form" : "offline_draft",
      bookingId,
    };

    setSaving(true);
    try {
      if (!navigator.onLine) {
        queueForLater(payload);
        window.localStorage.removeItem(keys.draft);
        setForm(makeInitialForm(uid, displayName, personName));
        setStatus("Assessment saved on this device. It will submit when you are back online.");
        toast.show("Saved offline. We will sync it when the connection returns.", "success");
        return;
      }

      const formId = await submitPatientAssessmentForm(uid, personId, payload);
      window.localStorage.removeItem(keys.draft);
      setForm(makeInitialForm(uid, displayName, personName));
      setStatus("Assessment submitted for physio review.");
      toast.show("Assessment submitted.", "success");
      onSubmitted?.(formId);
    } catch {
      queueForLater(payload);
      setStatus("We could not reach Firestore. The assessment is saved locally and will retry later.");
      toast.show("Saved locally. We will retry when you are online.", "success");
    } finally {
      setSaving(false);
    }
  }

  const urgent = hasUrgentRedFlags(form.redFlags);
  const selectedClinicalArea = getClinicalAreaOption(form.subjective.clinicalArea);
  const psfsAverage = getPsfsAverage(form.outcomes);
  const goalSentence = form.goalsPlan.meaningfulGoal.trim()
    ? `In ${form.goalsPlan.timeframeWeeks} weeks, I want to ${form.goalsPlan.meaningfulGoal.trim()}, moving from ${form.goalsPlan.baseline.trim() || "my current baseline"} to ${form.goalsPlan.target.trim() || "my target level"}.`
    : "Add a goal, baseline and target to create a review-ready goal statement.";

  return (
    <div className="assessment-shell">
      <div className="panel stack assessment-intro">
        <div>
          <span className="eyebrow">Patient assessment</span>
          <h2>Before your session</h2>
        </div>
        <p className="muted">
          Complete this before an online or in-person appointment. It helps your physiotherapist prepare,
          check safety, record consent and plan the right first steps.
        </p>
        <div className="assessment-meta-row">
          <span>{draftSaved ? "Draft saved on this device" : "Autosaves locally"}</span>
          <span>{queueCount > 0 ? `${queueCount} offline submission${queueCount === 1 ? "" : "s"} waiting` : "No offline submissions waiting"}</span>
          <span>{syncing ? "Syncing..." : "Ready"}</span>
        </div>
      </div>

      <form className="panel assessment-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        {status && <p role="status" className="assessment-status">{status}</p>}
        {urgent && (
          <div className="assessment-alert" role="alert">
            <strong>Urgent symptoms selected.</strong>
            <p>
              This form is not for emergency care. If symptoms are severe, rapidly worsening or unsafe,
              seek urgent medical help now before waiting for a physiotherapy review.
            </p>
          </div>
        )}

        <fieldset className="assessment-section">
          <legend>Appointment details</legend>
          <div className="assessment-choice-row" role="group" aria-label="Assessment type">
            {([
              ["initial", "Initial assessment"],
              ["checkup", "Review check-up"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`assessment-choice${form.formType === value ? " is-active" : ""}`}
                onClick={() => setField("formType", value as AssessmentFormType)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="assessment-choice-row" role="group" aria-label="Appointment mode">
            {([
              ["online", "Online video"],
              ["in_person", "In-person or offline"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`assessment-choice${form.consultationMode === value ? " is-active" : ""}`}
                onClick={() => setField("consultationMode", value as ConsultationMode)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="assessment-grid">
            <label>
              Patient name
              <input
                className="input"
                value={form.patientName}
                onChange={(e) => setField("patientName", e.target.value)}
                maxLength={ASSESSMENT_LIMITS.patientName}
                aria-invalid={errors.patientName ? true : undefined}
                aria-describedby={errors.patientName ? "err-assessment-patient" : undefined}
              />
              {errors.patientName && <span className="field-error" id="err-assessment-patient">{errors.patientName}</span>}
            </label>
            <label>
              Completed by
              <input
                className="input"
                value={form.completedBy}
                onChange={(e) => setField("completedBy", e.target.value)}
                maxLength={ASSESSMENT_LIMITS.completedBy}
                aria-invalid={errors.completedBy ? true : undefined}
                aria-describedby={errors.completedBy ? "err-assessment-completed-by" : undefined}
              />
              {errors.completedBy && <span className="field-error" id="err-assessment-completed-by">{errors.completedBy}</span>}
            </label>
            <label>
              Relationship to patient
              <input
                className="input"
                value={form.relationshipToPatient}
                onChange={(e) => setField("relationshipToPatient", e.target.value)}
                maxLength={ASSESSMENT_LIMITS.relationshipToPatient}
                placeholder="Self, parent, carer"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="assessment-section">
          <legend>Symptoms and function</legend>
          <div className="assessment-grid">
            <label>
              Main body area or problem
              <input
                className="input"
                value={form.bodyArea}
                onChange={(e) => setField("bodyArea", e.target.value)}
                maxLength={ASSESSMENT_LIMITS.bodyArea}
                placeholder="Example: right knee, lower back, balance"
                aria-invalid={errors.bodyArea ? true : undefined}
                aria-describedby={errors.bodyArea ? "err-assessment-body-area" : undefined}
              />
              {errors.bodyArea && <span className="field-error" id="err-assessment-body-area">{errors.bodyArea}</span>}
            </label>
            <label>
              When did it start?
              <input
                type="date"
                className="input"
                value={form.symptomStartDate}
                onChange={(e) => setField("symptomStartDate", e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                aria-invalid={errors.symptomStartDate ? true : undefined}
                aria-describedby={errors.symptomStartDate ? "err-assessment-start-date" : undefined}
              />
              {errors.symptomStartDate && <span className="field-error" id="err-assessment-start-date">{errors.symptomStartDate}</span>}
            </label>
            <label>
              Onset pattern
              <select
                className="input"
                value={form.onsetPattern}
                onChange={(e) => setField("onsetPattern", e.target.value as OnsetPattern)}
              >
                {onsetOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Main problem
            <textarea
              className="input"
              value={form.presentingComplaint}
              onChange={(e) => setField("presentingComplaint", e.target.value)}
              rows={4}
              maxLength={ASSESSMENT_LIMITS.presentingComplaint}
              placeholder="Tell us what happened, what has changed, and what matters most to you."
              aria-invalid={errors.presentingComplaint ? true : undefined}
              aria-describedby={errors.presentingComplaint ? "err-assessment-complaint" : undefined}
            />
            {errors.presentingComplaint && <span className="field-error" id="err-assessment-complaint">{errors.presentingComplaint}</span>}
          </label>

          <div className="assessment-range">
            <div>
              <span>Pain right now</span>
              <strong>{form.painScore}/10</strong>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={form.painScore}
              onChange={(e) => setField("painScore", Number(e.target.value))}
              aria-label="Pain score, 0 to 10"
              aria-valuetext={`${form.painScore} out of 10`}
            />
            {errors.painScore && <span className="field-error">{errors.painScore}</span>}
          </div>

          <div className="assessment-grid">
            <label>
              Symptoms
              <textarea
                className="input"
                value={form.symptoms}
                onChange={(e) => setField("symptoms", e.target.value)}
                rows={3}
                maxLength={ASSESSMENT_LIMITS.symptoms}
                placeholder="Pain, stiffness, pins and needles, weakness, swelling, balance changes"
                aria-invalid={errors.symptoms ? true : undefined}
                aria-describedby={errors.symptoms ? "err-assessment-symptoms" : undefined}
              />
              {errors.symptoms && <span className="field-error" id="err-assessment-symptoms">{errors.symptoms}</span>}
            </label>
            <label>
              What makes it worse?
              <textarea
                className="input"
                value={form.aggravatingFactors}
                onChange={(e) => setField("aggravatingFactors", e.target.value)}
                rows={3}
                maxLength={ASSESSMENT_LIMITS.aggravatingFactors}
              />
            </label>
            <label>
              What eases it?
              <textarea
                className="input"
                value={form.easingFactors}
                onChange={(e) => setField("easingFactors", e.target.value)}
                rows={3}
                maxLength={ASSESSMENT_LIMITS.easingFactors}
              />
            </label>
            <label>
              How is it affecting daily life?
              <textarea
                className="input"
                value={form.functionalImpact}
                onChange={(e) => setField("functionalImpact", e.target.value)}
                rows={3}
                maxLength={ASSESSMENT_LIMITS.functionalImpact}
              />
            </label>
          </div>

          <label>
            Goals for physiotherapy
            <textarea
              className="input"
              value={form.goals}
              onChange={(e) => setField("goals", e.target.value)}
              rows={3}
              maxLength={ASSESSMENT_LIMITS.goals}
              placeholder="Example: walk to the shops, return to football, lift without pain"
            />
          </label>
        </fieldset>

        <fieldset className="assessment-section">
          <legend>Subjective assessment</legend>
          <div className="assessment-grid">
            <label>
              Clinical focus
              <select
                className="input"
                value={form.subjective.clinicalArea}
                onChange={(e) => handleClinicalAreaChange(e.target.value as ClinicalArea)}
              >
                {clinicalAreaOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <div className="assessment-note">
              <strong>Condition safety focus</strong>
              <p>{selectedClinicalArea.redFlagFocus}</p>
            </div>
          </div>

          <label>
            Symptom behaviour
            <textarea
              className="input"
              value={form.subjective.symptomBehaviour}
              onChange={(e) => setSubjective("symptomBehaviour", e.target.value)}
              rows={3}
              maxLength={ASSESSMENT_LIMITS.symptomBehaviour}
              placeholder="Pattern across the day, 24-hour behaviour, sleep, activity tolerance, easing time and flare-ups."
              aria-invalid={errors["subjective.symptomBehaviour"] ? true : undefined}
              aria-describedby={errors["subjective.symptomBehaviour"] ? "err-subjective-behaviour" : undefined}
            />
            {errors["subjective.symptomBehaviour"] && <span className="field-error" id="err-subjective-behaviour">{errors["subjective.symptomBehaviour"]}</span>}
          </label>

          <div className="assessment-grid">
            <div className="assessment-range">
              <div>
                <span>Symptom severity</span>
                <strong>{form.subjective.severity}/10</strong>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={form.subjective.severity}
                onChange={(e) => setSubjective("severity", Number(e.target.value))}
                aria-label="Symptom severity, 0 to 10"
              />
              {errors["subjective.severity"] && <span className="field-error">{errors["subjective.severity"]}</span>}
            </div>
            <div className="assessment-range">
              <div>
                <span>Irritability</span>
                <strong>{form.subjective.irritability}/10</strong>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={form.subjective.irritability}
                onChange={(e) => setSubjective("irritability", Number(e.target.value))}
                aria-label="Symptom irritability, 0 to 10"
              />
              {errors["subjective.irritability"] && <span className="field-error">{errors["subjective.irritability"]}</span>}
            </div>
          </div>

          <label>
            Yellow flags, concerns or context
            <textarea
              className="input"
              value={form.subjective.yellowFlags}
              onChange={(e) => setSubjective("yellowFlags", e.target.value)}
              rows={3}
              maxLength={ASSESSMENT_LIMITS.yellowFlags}
              placeholder="Fear, confidence, mood, work, sleep, stress, expectations, support at home or barriers to recovery."
            />
            {errors["subjective.yellowFlags"] && <span className="field-error">{errors["subjective.yellowFlags"]}</span>}
          </label>
        </fieldset>

        <fieldset className="assessment-section">
          <legend>Outcome measures</legend>
          <div className="assessment-outcome-summary">
            <div>
              <span className="eyebrow">Patient-specific function</span>
              <strong>{psfsAverage === null ? "Not scored" : `${psfsAverage}/10 average`}</strong>
            </div>
            <p>{selectedClinicalArea.outcomeHint}</p>
          </div>

          <div className="assessment-grid">
            {psfsSlots.map((slot) => (
              <label key={slot.activity}>
                {slot.label}: meaningful activity
                <input
                  className="input"
                  value={form.outcomes[slot.activity]}
                  onChange={(e) => setOutcomes(slot.activity, e.target.value)}
                  maxLength={ASSESSMENT_LIMITS.outcomeActivity}
                  placeholder={slot.activity === "psfsActivity1" ? "Example: walk upstairs" : "Optional"}
                  aria-invalid={errors[`outcomes.${slot.activity}`] ? true : undefined}
                />
                {errors[`outcomes.${slot.activity}`] && <span className="field-error">{errors[`outcomes.${slot.activity}`]}</span>}
                <div className="assessment-range compact-range">
                  <div>
                    <span>Current ability</span>
                    <strong>{form.outcomes[slot.score]}/10</strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={form.outcomes[slot.score]}
                    onChange={(e) => setOutcomes(slot.score, Number(e.target.value))}
                    aria-label={`${slot.label} current ability, 0 to 10`}
                  />
                  {errors[`outcomes.${slot.score}`] && <span className="field-error">{errors[`outcomes.${slot.score}`]}</span>}
                </div>
              </label>
            ))}
          </div>

          <div className="assessment-grid">
            <div className="assessment-range">
              <div>
                <span>Best pain in last week</span>
                <strong>{form.outcomes.painBest}/10</strong>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={form.outcomes.painBest}
                onChange={(e) => setOutcomes("painBest", Number(e.target.value))}
                aria-label="Best pain in the last week"
              />
              {errors["outcomes.painBest"] && <span className="field-error">{errors["outcomes.painBest"]}</span>}
            </div>
            <div className="assessment-range">
              <div>
                <span>Worst pain in last week</span>
                <strong>{form.outcomes.painWorst}/10</strong>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={form.outcomes.painWorst}
                onChange={(e) => setOutcomes("painWorst", Number(e.target.value))}
                aria-label="Worst pain in the last week"
              />
              {errors["outcomes.painWorst"] && <span className="field-error">{errors["outcomes.painWorst"]}</span>}
            </div>
          </div>

          <div className="assessment-grid">
            <label>
              Condition-specific measure used
              <input
                className="input"
                value={form.outcomes.conditionMeasureName}
                onChange={(e) => setOutcomes("conditionMeasureName", e.target.value)}
                maxLength={ASSESSMENT_LIMITS.outcomeMeasureName}
                placeholder={selectedClinicalArea.conditionMeasurePlaceholder}
              />
              {errors["outcomes.conditionMeasureName"] && <span className="field-error">{errors["outcomes.conditionMeasureName"]}</span>}
            </label>
            <div className="assessment-grid mini-grid">
              <label>
                Score
                <input
                  type="number"
                  className="input"
                  min={0}
                  max={1000}
                  step="0.1"
                  value={form.outcomes.conditionMeasureScore}
                  onChange={(e) => setOutcomes("conditionMeasureScore", normalisePositiveNumber(Number(e.target.value)))}
                />
                {errors["outcomes.conditionMeasureScore"] && <span className="field-error">{errors["outcomes.conditionMeasureScore"]}</span>}
              </label>
              <label>
                Out of
                <input
                  type="number"
                  className="input"
                  min={1}
                  max={1000}
                  step="0.1"
                  value={form.outcomes.conditionMeasureMax}
                  onChange={(e) => setOutcomes("conditionMeasureMax", normalisePositiveNumber(Number(e.target.value)))}
                />
                {errors["outcomes.conditionMeasureMax"] && <span className="field-error">{errors["outcomes.conditionMeasureMax"]}</span>}
              </label>
            </div>
          </div>

          <div className="assessment-range">
            <div>
              <span>Confidence to progress</span>
              <strong>{form.outcomes.confidenceScore}/10</strong>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={form.outcomes.confidenceScore}
              onChange={(e) => setOutcomes("confidenceScore", Number(e.target.value))}
              aria-label="Confidence to progress, 0 to 10"
            />
            {errors["outcomes.confidenceScore"] && <span className="field-error">{errors["outcomes.confidenceScore"]}</span>}
          </div>
        </fieldset>

        <fieldset className="assessment-section">
          <legend>Objective video assessment</legend>
          <div className="assessment-objective-card">
            <div>
              <span className="eyebrow">Suggested objective task</span>
              <strong>{selectedClinicalArea.objectiveTask.taskLabel}</strong>
              <p>{selectedClinicalArea.objectiveTask.safetyNote}</p>
            </div>
            <button type="button" className="assessment-choice" onClick={() => applyObjectiveTask(selectedClinicalArea.objectiveTask)}>
              Use this task
            </button>
          </div>

          <div className="assessment-check-list">
            <label className="assessment-check">
              <input
                type="checkbox"
                checked={form.objectiveVideo.consent}
                onChange={(e) => setObjectiveVideo("consent", e.target.checked)}
              />
              <span>I agree this clip can be used as clinical evidence for this assessment and stored in my patient record.</span>
            </label>
            <label className="assessment-check">
              <input
                type="checkbox"
                checked={form.consent.videoConsent}
                onChange={(e) => setConsent("videoConsent", e.target.checked)}
              />
              <span>I understand video is optional and I can choose written measures instead.</span>
            </label>
          </div>
          {errors.videoConsent && <span className="field-error">{errors.videoConsent}</span>}

          <div className="assessment-grid">
            <label>
              Objective task
              <input
                className="input"
                value={form.objectiveVideo.taskLabel}
                onChange={(e) => setObjectiveVideo("taskLabel", e.target.value)}
                maxLength={ASSESSMENT_LIMITS.objectiveTask}
                aria-invalid={errors["objectiveVideo.taskLabel"] ? true : undefined}
              />
              {errors["objectiveVideo.taskLabel"] && <span className="field-error">{errors["objectiveVideo.taskLabel"]}</span>}
            </label>
            <label>
              Outcome metric
              <input
                className="input"
                value={form.objectiveVideo.metricName}
                onChange={(e) => setObjectiveVideo("metricName", e.target.value)}
                maxLength={ASSESSMENT_LIMITS.objectiveMetricName}
                aria-invalid={errors["objectiveVideo.metricName"] ? true : undefined}
              />
              {errors["objectiveVideo.metricName"] && <span className="field-error">{errors["objectiveVideo.metricName"]}</span>}
            </label>
          </div>

          <div className="assessment-grid">
            <label>
              Metric value
              <input
                type="number"
                className="input"
                min={0}
                max={10000}
                step="0.1"
                value={form.objectiveVideo.metricValue}
                onChange={(e) => setObjectiveVideo("metricValue", normalisePositiveNumber(Number(e.target.value)))}
              />
              {errors["objectiveVideo.metricValue"] && <span className="field-error">{errors["objectiveVideo.metricValue"]}</span>}
            </label>
            <label>
              Unit
              <input
                className="input"
                value={form.objectiveVideo.metricUnit}
                onChange={(e) => setObjectiveVideo("metricUnit", e.target.value)}
                maxLength={ASSESSMENT_LIMITS.objectiveMetricUnit}
                placeholder="seconds, reps, /10"
              />
              {errors["objectiveVideo.metricUnit"] && <span className="field-error">{errors["objectiveVideo.metricUnit"]}</span>}
            </label>
            <label>
              Reps
              <input
                type="number"
                className="input"
                min={0}
                max={1000}
                step={1}
                value={form.objectiveVideo.reps}
                onChange={(e) => setObjectiveVideo("reps", Math.max(0, Math.round(Number(e.target.value))))}
              />
              {errors["objectiveVideo.reps"] && <span className="field-error">{errors["objectiveVideo.reps"]}</span>}
            </label>
            <label>
              Duration seconds
              <input
                type="number"
                className="input"
                min={0}
                max={3600}
                step={1}
                value={form.objectiveVideo.durationSeconds}
                onChange={(e) => setObjectiveVideo("durationSeconds", Math.max(0, Math.round(Number(e.target.value))))}
              />
              {errors["objectiveVideo.durationSeconds"] && <span className="field-error">{errors["objectiveVideo.durationSeconds"]}</span>}
            </label>
          </div>

          <label>
            Movement quality notes
            <textarea
              className="input"
              value={form.objectiveVideo.qualityNotes}
              onChange={(e) => setObjectiveVideo("qualityNotes", e.target.value)}
              rows={3}
              maxLength={ASSESSMENT_LIMITS.objectiveNotes}
              placeholder="Visible range, control, compensations, pain behaviour, aids used, support person present."
            />
            {errors["objectiveVideo.qualityNotes"] && <span className="field-error">{errors["objectiveVideo.qualityNotes"]}</span>}
          </label>

          <div className="assessment-video-panel">
            <div className="assessment-video-preview">
              {mediaStream ? (
                <video ref={liveVideoRef} muted playsInline />
              ) : recordedPreviewUrl ? (
                <video src={recordedPreviewUrl} controls playsInline />
              ) : form.objectiveVideo.videoUrl ? (
                <video src={form.objectiveVideo.videoUrl} controls playsInline />
              ) : (
                <div>
                  <strong>No objective video attached</strong>
                  <span>Written objective metrics can still be submitted.</span>
                </div>
              )}
            </div>
            <div className="assessment-video-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => void startRecording()}
                disabled={recording || uploadingVideo}
              >
                Record clip
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={stopRecording}
                disabled={!recording}
              >
                Stop {recording ? `${videoSeconds}s` : ""}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => recordedBlob ? void uploadAssessmentVideo(recordedBlob) : setVideoError("Record or choose a clip first.")}
                disabled={!recordedBlob || uploadingVideo}
              >
                {uploadingVideo ? "Uploading..." : "Attach clip"}
              </button>
              <label className="assessment-file-button">
                Choose video
                <input
                  type="file"
                  accept="video/webm,video/mp4,video/quicktime,video/*"
                  onChange={(e) => void handleVideoFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            {form.objectiveVideo.videoUrl && (
              <a href={form.objectiveVideo.videoUrl} target="_blank" rel="noreferrer" className="assessment-video-link">
                Open attached objective video
              </a>
            )}
            {videoError && <span className="field-error">{videoError}</span>}
          </div>
        </fieldset>

        <fieldset className="assessment-section">
          <legend>Goal setting and review</legend>
          <div className="assessment-goal-statement">
            <span className="eyebrow">Review-ready goal</span>
            <strong>{goalSentence}</strong>
          </div>

          <div className="assessment-choice-row">
            {selectedClinicalArea.goalIdeas.map((idea) => (
              <button
                key={idea}
                type="button"
                className="assessment-choice"
                onClick={() => setGoalsPlan("meaningfulGoal", idea)}
              >
                {idea}
              </button>
            ))}
          </div>

          <label>
            Meaningful goal
            <input
              className="input"
              value={form.goalsPlan.meaningfulGoal}
              onChange={(e) => setGoalsPlan("meaningfulGoal", e.target.value)}
              maxLength={ASSESSMENT_LIMITS.goalText}
              placeholder="Example: climb the stairs at home without stopping"
              aria-invalid={errors["goalsPlan.meaningfulGoal"] ? true : undefined}
            />
            {errors["goalsPlan.meaningfulGoal"] && <span className="field-error">{errors["goalsPlan.meaningfulGoal"]}</span>}
          </label>

          <div className="assessment-grid">
            <label>
              Current baseline
              <input
                className="input"
                value={form.goalsPlan.baseline}
                onChange={(e) => setGoalsPlan("baseline", e.target.value)}
                maxLength={ASSESSMENT_LIMITS.goalDetail}
                placeholder="Example: 3 stairs with pain 7/10"
                aria-invalid={errors["goalsPlan.baseline"] ? true : undefined}
              />
              {errors["goalsPlan.baseline"] && <span className="field-error">{errors["goalsPlan.baseline"]}</span>}
            </label>
            <label>
              Target for review
              <input
                className="input"
                value={form.goalsPlan.target}
                onChange={(e) => setGoalsPlan("target", e.target.value)}
                maxLength={ASSESSMENT_LIMITS.goalDetail}
                placeholder="Example: one flight with pain no higher than 3/10"
                aria-invalid={errors["goalsPlan.target"] ? true : undefined}
              />
              {errors["goalsPlan.target"] && <span className="field-error">{errors["goalsPlan.target"]}</span>}
            </label>
          </div>

          <div className="assessment-grid">
            <label>
              Review timeframe in weeks
              <input
                type="number"
                className="input"
                min={1}
                max={52}
                step={1}
                value={form.goalsPlan.timeframeWeeks}
                onChange={(e) => setGoalTimeframe(Math.max(1, Math.round(Number(e.target.value))))}
              />
              {errors["goalsPlan.timeframeWeeks"] && <span className="field-error">{errors["goalsPlan.timeframeWeeks"]}</span>}
            </label>
            <label>
              Review date
              <input
                type="date"
                className="input"
                value={form.goalsPlan.reviewDate}
                onChange={(e) => setGoalsPlan("reviewDate", e.target.value)}
              />
              {errors["goalsPlan.reviewDate"] && <span className="field-error">{errors["goalsPlan.reviewDate"]}</span>}
            </label>
          </div>

          <div className="assessment-range">
            <div>
              <span>Confidence to achieve this goal</span>
              <strong>{form.goalsPlan.confidenceScore}/10</strong>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={form.goalsPlan.confidenceScore}
              onChange={(e) => setGoalsPlan("confidenceScore", Number(e.target.value))}
              aria-label="Confidence to achieve goal, 0 to 10"
            />
            {errors["goalsPlan.confidenceScore"] && <span className="field-error">{errors["goalsPlan.confidenceScore"]}</span>}
          </div>

          <div className="assessment-grid">
            <label>
              Barriers
              <textarea
                className="input"
                value={form.goalsPlan.barriers}
                onChange={(e) => setGoalsPlan("barriers", e.target.value)}
                rows={3}
                maxLength={ASSESSMENT_LIMITS.goalDetail}
                placeholder="Pain flare-ups, work demands, equipment, fear, time, transport or support."
              />
              {errors["goalsPlan.barriers"] && <span className="field-error">{errors["goalsPlan.barriers"]}</span>}
            </label>
            <label>
              Support plan
              <textarea
                className="input"
                value={form.goalsPlan.supportPlan}
                onChange={(e) => setGoalsPlan("supportPlan", e.target.value)}
                rows={3}
                maxLength={ASSESSMENT_LIMITS.goalDetail}
                placeholder="What will help: pacing, exercise dose, reminders, equipment, family support or workplace changes."
              />
              {errors["goalsPlan.supportPlan"] && <span className="field-error">{errors["goalsPlan.supportPlan"]}</span>}
            </label>
          </div>
        </fieldset>

        <fieldset className="assessment-section">
          <legend>Health screening</legend>
          <div className="assessment-grid">
            <label>
              Medical history
              <textarea
                className="input"
                value={form.medicalHistory}
                onChange={(e) => setField("medicalHistory", e.target.value)}
                rows={3}
                maxLength={ASSESSMENT_LIMITS.medicalHistory}
                placeholder="Relevant conditions, surgery, pregnancy/postpartum, falls, long-term conditions"
              />
            </label>
            <label>
              Medications
              <textarea
                className="input"
                value={form.medications}
                onChange={(e) => setField("medications", e.target.value)}
                rows={3}
                maxLength={ASSESSMENT_LIMITS.medications}
              />
            </label>
            <label>
              Allergies
              <textarea
                className="input"
                value={form.allergies}
                onChange={(e) => setField("allergies", e.target.value)}
                rows={3}
                maxLength={ASSESSMENT_LIMITS.allergies}
              />
            </label>
            <label>
              Previous treatment or investigations
              <textarea
                className="input"
                value={form.previousTreatment}
                onChange={(e) => setField("previousTreatment", e.target.value)}
                rows={3}
                maxLength={ASSESSMENT_LIMITS.previousTreatment}
                placeholder="Scans, GP advice, medication changes, prior physiotherapy"
              />
            </label>
          </div>

          <div className="assessment-check-group">
            <strong>Safety check</strong>
            <p className="muted">Select any symptoms that apply today. These help your physiotherapist decide whether physiotherapy is appropriate or urgent medical advice is needed.</p>
            <div className="assessment-check-list">
              {redFlagLabels.map((item) => (
                <label key={item.key} className="assessment-check">
                  <input
                    type="checkbox"
                    checked={form.redFlags[item.key]}
                    onChange={(e) => setRedFlag(item.key, e.target.checked)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
            {errors.redFlags && <span className="field-error">{errors.redFlags}</span>}
          </div>
        </fieldset>

        <fieldset className="assessment-section">
          <legend>Access and check-up planning</legend>
          <div className="assessment-grid">
            <label>
              Communication or access needs
              <textarea
                className="input"
                value={form.communicationNeeds}
                onChange={(e) => setField("communicationNeeds", e.target.value)}
                rows={3}
                maxLength={ASSESSMENT_LIMITS.communicationNeeds}
                placeholder="Interpreter, hearing, vision, mobility, preferred communication"
              />
            </label>
            <label>
              Emergency contact name
              <input
                className="input"
                value={form.emergencyContactName}
                onChange={(e) => setField("emergencyContactName", e.target.value)}
                maxLength={ASSESSMENT_LIMITS.emergencyContactName}
                aria-invalid={errors.emergencyContactName ? true : undefined}
                aria-describedby={errors.emergencyContactName ? "err-assessment-emergency-name" : undefined}
              />
              {errors.emergencyContactName && <span className="field-error" id="err-assessment-emergency-name">{errors.emergencyContactName}</span>}
            </label>
            <label>
              Emergency contact phone
              <input
                className="input"
                value={form.emergencyContactPhone}
                onChange={(e) => setField("emergencyContactPhone", e.target.value)}
                maxLength={ASSESSMENT_LIMITS.emergencyContactPhone}
                inputMode="tel"
                aria-invalid={errors.emergencyContactPhone ? true : undefined}
                aria-describedby={errors.emergencyContactPhone ? "err-assessment-emergency-phone" : undefined}
              />
              {errors.emergencyContactPhone && <span className="field-error" id="err-assessment-emergency-phone">{errors.emergencyContactPhone}</span>}
            </label>
          </div>

          {form.consultationMode === "online" ? (
            <div className="assessment-check-group">
              <strong>Online appointment readiness</strong>
              <div className="assessment-check-list two-col-list">
                {([
                  ["privateSpace", "I can take the call somewhere private."],
                  ["safeSpace", "I have space to move safely if asked."],
                  ["cameraAvailable", "I have a working camera and microphone."],
                  ["emergencyContactAvailable", "My emergency contact is reachable during the appointment."],
                ] as const).map(([key, label]) => (
                  <label key={key} className="assessment-check">
                    <input
                      type="checkbox"
                      checked={form.onlineReadiness[key]}
                      onChange={(e) => setReadiness(key, e.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {errors.onlineReadiness && <span className="field-error">{errors.onlineReadiness}</span>}
            </div>
          ) : (
            <div className="assessment-note">
              Bring any relevant letters, medication details, supports, splints or footwear to your in-person assessment where practical.
            </div>
          )}
        </fieldset>

        <fieldset className="assessment-section">
          <legend>Consent and signature</legend>
          <div className="assessment-check-list">
            {([
              ["careConsent", "I consent to a physiotherapy assessment and understand I can pause or decline any part of it."],
              ["dataConsent", "I understand this form contains personal and clinical information and will be stored in my patient record."],
              ["privacyConsent", "I have read or can access the Privacy Policy and understand how my information is used."],
              ["safetySharing", "I understand information may be shared where required by law, consent, best interests or public safety."],
            ] as const).map(([key, label]) => (
              <label key={key} className="assessment-check">
                <input
                  type="checkbox"
                  checked={form.consent[key]}
                  onChange={(e) => setConsent(key, e.target.checked)}
                />
                <span>
                  {label}
                  {key === "privacyConsent" ? (
                    <>
                      {" "}
                      <Link href="/privacy-policy" target="_blank">Privacy Policy</Link>
                    </>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
          {errors.consent && <span className="field-error">{errors.consent}</span>}

          <label>
            Typed signature
            <input
              className="input"
              value={form.signature}
              onChange={(e) => setField("signature", e.target.value)}
              maxLength={ASSESSMENT_LIMITS.signature}
              aria-invalid={errors.signature ? true : undefined}
              aria-describedby={errors.signature ? "err-assessment-signature" : undefined}
            />
            {errors.signature && <span className="field-error" id="err-assessment-signature">{errors.signature}</span>}
          </label>
        </fieldset>

        <div className="assessment-actions">
          <button type="submit" className="button primary" disabled={saving}>
            {saving ? "Saving..." : "Submit assessment"}
          </button>
          <button type="button" className="button secondary" onClick={() => window.print()}>
            Print offline copy
          </button>
        </div>
      </form>
    </div>
  );
}

export function PatientAssessmentHistory({ uid, personId, reloadKey }: HistoryProps) {
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
                  {getPsfsAverage(form.outcomes) !== null ? ` - PSFS ${getPsfsAverage(form.outcomes)}/10` : ""}
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
