import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const ASSESSMENT_FORM_VERSION = "2026-07-csp-hcpc-v2";

export type AssessmentFormType = "initial" | "checkup";
export type ConsultationMode = "online" | "in_person";
export type AssessmentCompletionMethod = "online_form" | "offline_draft" | "offline_paper";
export type AssessmentReviewStatus = "awaiting_review" | "reviewed" | "needs_more_info" | "urgent_advice";
export type OnsetPattern = "sudden" | "gradual" | "recurring" | "post_surgery" | "not_sure";
export type ClinicalArea =
  | "spine"
  | "upper_limb"
  | "lower_limb"
  | "balance_walking"
  | "neuro"
  | "post_op"
  | "pelvic_health"
  | "paediatric"
  | "general";

export const ASSESSMENT_LIMITS = {
  patientName: 80,
  completedBy: 80,
  relationshipToPatient: 50,
  bodyArea: 120,
  presentingComplaint: 2000,
  symptomStartDate: 10,
  symptoms: 2000,
  aggravatingFactors: 1000,
  easingFactors: 1000,
  functionalImpact: 1500,
  goals: 1000,
  medicalHistory: 2000,
  medications: 1000,
  allergies: 1000,
  previousTreatment: 1000,
  communicationNeeds: 1000,
  emergencyContactName: 80,
  emergencyContactPhone: 20,
  signature: 80,
  completedAt: 40,
  symptomBehaviour: 1000,
  yellowFlags: 1000,
  outcomeActivity: 160,
  outcomeMeasureName: 120,
  objectiveTask: 160,
  objectiveMetricName: 80,
  objectiveMetricUnit: 40,
  objectiveNotes: 1000,
  videoUrl: 2000,
  storagePath: 500,
  goalText: 500,
  goalDetail: 500,
  clinicianNotes: 2000,
  riskPlan: 2000,
  nextCheckupDate: 10,
} as const;

export interface SubjectiveAssessmentProfile {
  clinicalArea: ClinicalArea;
  symptomBehaviour: string;
  irritability: number;
  severity: number;
  yellowFlags: string;
}

export interface OutcomeMeasureSet {
  psfsActivity1: string;
  psfsScore1: number;
  psfsActivity2: string;
  psfsScore2: number;
  psfsActivity3: string;
  psfsScore3: number;
  painBest: number;
  painWorst: number;
  confidenceScore: number;
  conditionMeasureName: string;
  conditionMeasureScore: number;
  conditionMeasureMax: number;
}

export interface ObjectiveVideoAssessment {
  consent: boolean;
  taskId: string;
  taskLabel: string;
  metricName: string;
  metricValue: number;
  metricUnit: string;
  reps: number;
  durationSeconds: number;
  qualityNotes: string;
  videoUrl: string;
  storagePath: string;
  recordedAt: string;
}

export interface GoalSetting {
  meaningfulGoal: string;
  baseline: string;
  target: string;
  timeframeWeeks: number;
  confidenceScore: number;
  barriers: string;
  supportPlan: string;
  reviewDate: string;
}

export interface AssessmentRedFlags {
  majorTrauma: boolean;
  chestPainBreathlessness: boolean;
  bladderBowelSaddle: boolean;
  progressiveWeakness: boolean;
  unexplainedFeverWeightLoss: boolean;
  nightPain: boolean;
  none: boolean;
}

export interface OnlineReadiness {
  privateSpace: boolean;
  safeSpace: boolean;
  cameraAvailable: boolean;
  emergencyContactAvailable: boolean;
}

export interface AssessmentConsent {
  careConsent: boolean;
  dataConsent: boolean;
  privacyConsent: boolean;
  safetySharing: boolean;
  videoConsent: boolean;
}

export interface PatientAssessmentFormInput {
  formType: AssessmentFormType;
  consultationMode: ConsultationMode;
  completedVia: AssessmentCompletionMethod;
  patientName: string;
  completedBy: string;
  relationshipToPatient: string;
  presentingComplaint: string;
  bodyArea: string;
  symptomStartDate: string;
  onsetPattern: OnsetPattern;
  painScore: number;
  subjective: SubjectiveAssessmentProfile;
  outcomes: OutcomeMeasureSet;
  objectiveVideo: ObjectiveVideoAssessment;
  goalsPlan: GoalSetting;
  symptoms: string;
  aggravatingFactors: string;
  easingFactors: string;
  functionalImpact: string;
  goals: string;
  medicalHistory: string;
  medications: string;
  allergies: string;
  previousTreatment: string;
  communicationNeeds: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  redFlags: AssessmentRedFlags;
  onlineReadiness: OnlineReadiness;
  consent: AssessmentConsent;
  signature: string;
  completedAt: string;
  submittedByUid: string;
  bookingId?: string;
}

export interface PatientAssessmentFormRecord extends PatientAssessmentFormInput {
  id: string;
  version: string;
  reviewStatus: AssessmentReviewStatus;
  reviewedBy: string;
  reviewedAt: string;
  clinicianNotes: string;
  riskPlan: string;
  nextCheckupDate: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface AssessmentReviewInput {
  reviewStatus: AssessmentReviewStatus;
  reviewedBy: string;
  reviewedAt: string;
  clinicianNotes: string;
  riskPlan: string;
  nextCheckupDate: string;
}

export const defaultRedFlags: AssessmentRedFlags = {
  majorTrauma: false,
  chestPainBreathlessness: false,
  bladderBowelSaddle: false,
  progressiveWeakness: false,
  unexplainedFeverWeightLoss: false,
  nightPain: false,
  none: false,
};

export const defaultOnlineReadiness: OnlineReadiness = {
  privateSpace: false,
  safeSpace: false,
  cameraAvailable: false,
  emergencyContactAvailable: false,
};

export const defaultAssessmentConsent: AssessmentConsent = {
  careConsent: false,
  dataConsent: false,
  privacyConsent: false,
  safetySharing: false,
  videoConsent: false,
};

export const defaultSubjectiveProfile: SubjectiveAssessmentProfile = {
  clinicalArea: "general",
  symptomBehaviour: "",
  irritability: 5,
  severity: 5,
  yellowFlags: "",
};

export const defaultOutcomeMeasures: OutcomeMeasureSet = {
  psfsActivity1: "",
  psfsScore1: 5,
  psfsActivity2: "",
  psfsScore2: 5,
  psfsActivity3: "",
  psfsScore3: 5,
  painBest: 0,
  painWorst: 8,
  confidenceScore: 5,
  conditionMeasureName: "",
  conditionMeasureScore: 0,
  conditionMeasureMax: 100,
};

export const defaultObjectiveVideo: ObjectiveVideoAssessment = {
  consent: false,
  taskId: "",
  taskLabel: "",
  metricName: "",
  metricValue: 0,
  metricUnit: "",
  reps: 0,
  durationSeconds: 0,
  qualityNotes: "",
  videoUrl: "",
  storagePath: "",
  recordedAt: "",
};

export const defaultGoalSetting: GoalSetting = {
  meaningfulGoal: "",
  baseline: "",
  target: "",
  timeframeWeeks: 6,
  confidenceScore: 5,
  barriers: "",
  supportPlan: "",
  reviewDate: "",
};

function personBase(uid: string, personId: string) {
  if (!db) throw new Error("Firestore not available");
  return collection(db, "patients", uid, "people", personId, "assessmentForms");
}

function readDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate(): Date }).toDate();
  }
  return null;
}

function readString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  return typeof value === "string" ? value : "";
}

function readNumber(data: Record<string, unknown>, key: string, fallback: number): number {
  const value = data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readRedFlags(value: unknown): AssessmentRedFlags {
  const d = typeof value === "object" && value !== null ? value as Partial<AssessmentRedFlags> : {};
  return {
    majorTrauma: d.majorTrauma === true,
    chestPainBreathlessness: d.chestPainBreathlessness === true,
    bladderBowelSaddle: d.bladderBowelSaddle === true,
    progressiveWeakness: d.progressiveWeakness === true,
    unexplainedFeverWeightLoss: d.unexplainedFeverWeightLoss === true,
    nightPain: d.nightPain === true,
    none: d.none === true,
  };
}

function readOnlineReadiness(value: unknown): OnlineReadiness {
  const d = typeof value === "object" && value !== null ? value as Partial<OnlineReadiness> : {};
  return {
    privateSpace: d.privateSpace === true,
    safeSpace: d.safeSpace === true,
    cameraAvailable: d.cameraAvailable === true,
    emergencyContactAvailable: d.emergencyContactAvailable === true,
  };
}

function readConsent(value: unknown): AssessmentConsent {
  const d = typeof value === "object" && value !== null ? value as Partial<AssessmentConsent> : {};
  return {
    careConsent: d.careConsent === true,
    dataConsent: d.dataConsent === true,
    privacyConsent: d.privacyConsent === true,
    safetySharing: d.safetySharing === true,
    videoConsent: d.videoConsent === true,
  };
}

function asClinicalArea(value: unknown): ClinicalArea {
  if (
    value === "spine" ||
    value === "upper_limb" ||
    value === "lower_limb" ||
    value === "balance_walking" ||
    value === "neuro" ||
    value === "post_op" ||
    value === "pelvic_health" ||
    value === "paediatric" ||
    value === "general"
  ) {
    return value;
  }
  return "general";
}

function readSubjective(value: unknown): SubjectiveAssessmentProfile {
  const d = typeof value === "object" && value !== null ? value as Partial<SubjectiveAssessmentProfile> : {};
  return {
    clinicalArea: asClinicalArea(d.clinicalArea),
    symptomBehaviour: typeof d.symptomBehaviour === "string" ? d.symptomBehaviour : "",
    irritability: typeof d.irritability === "number" ? d.irritability : 5,
    severity: typeof d.severity === "number" ? d.severity : 5,
    yellowFlags: typeof d.yellowFlags === "string" ? d.yellowFlags : "",
  };
}

function readOutcomes(value: unknown): OutcomeMeasureSet {
  const d = typeof value === "object" && value !== null ? value as Partial<OutcomeMeasureSet> : {};
  return {
    psfsActivity1: typeof d.psfsActivity1 === "string" ? d.psfsActivity1 : "",
    psfsScore1: typeof d.psfsScore1 === "number" ? d.psfsScore1 : 5,
    psfsActivity2: typeof d.psfsActivity2 === "string" ? d.psfsActivity2 : "",
    psfsScore2: typeof d.psfsScore2 === "number" ? d.psfsScore2 : 5,
    psfsActivity3: typeof d.psfsActivity3 === "string" ? d.psfsActivity3 : "",
    psfsScore3: typeof d.psfsScore3 === "number" ? d.psfsScore3 : 5,
    painBest: typeof d.painBest === "number" ? d.painBest : 0,
    painWorst: typeof d.painWorst === "number" ? d.painWorst : 8,
    confidenceScore: typeof d.confidenceScore === "number" ? d.confidenceScore : 5,
    conditionMeasureName: typeof d.conditionMeasureName === "string" ? d.conditionMeasureName : "",
    conditionMeasureScore: typeof d.conditionMeasureScore === "number" ? d.conditionMeasureScore : 0,
    conditionMeasureMax: typeof d.conditionMeasureMax === "number" ? d.conditionMeasureMax : 100,
  };
}

function readObjectiveVideo(value: unknown): ObjectiveVideoAssessment {
  const d = typeof value === "object" && value !== null ? value as Partial<ObjectiveVideoAssessment> : {};
  return {
    consent: d.consent === true,
    taskId: typeof d.taskId === "string" ? d.taskId : "",
    taskLabel: typeof d.taskLabel === "string" ? d.taskLabel : "",
    metricName: typeof d.metricName === "string" ? d.metricName : "",
    metricValue: typeof d.metricValue === "number" ? d.metricValue : 0,
    metricUnit: typeof d.metricUnit === "string" ? d.metricUnit : "",
    reps: typeof d.reps === "number" ? d.reps : 0,
    durationSeconds: typeof d.durationSeconds === "number" ? d.durationSeconds : 0,
    qualityNotes: typeof d.qualityNotes === "string" ? d.qualityNotes : "",
    videoUrl: typeof d.videoUrl === "string" ? d.videoUrl : "",
    storagePath: typeof d.storagePath === "string" ? d.storagePath : "",
    recordedAt: typeof d.recordedAt === "string" ? d.recordedAt : "",
  };
}

function readGoalSetting(value: unknown): GoalSetting {
  const d = typeof value === "object" && value !== null ? value as Partial<GoalSetting> : {};
  return {
    meaningfulGoal: typeof d.meaningfulGoal === "string" ? d.meaningfulGoal : "",
    baseline: typeof d.baseline === "string" ? d.baseline : "",
    target: typeof d.target === "string" ? d.target : "",
    timeframeWeeks: typeof d.timeframeWeeks === "number" ? d.timeframeWeeks : 6,
    confidenceScore: typeof d.confidenceScore === "number" ? d.confidenceScore : 5,
    barriers: typeof d.barriers === "string" ? d.barriers : "",
    supportPlan: typeof d.supportPlan === "string" ? d.supportPlan : "",
    reviewDate: typeof d.reviewDate === "string" ? d.reviewDate : "",
  };
}

function asFormType(value: unknown): AssessmentFormType {
  return value === "checkup" ? "checkup" : "initial";
}

function asConsultationMode(value: unknown): ConsultationMode {
  return value === "in_person" ? "in_person" : "online";
}

function asCompletionMethod(value: unknown): AssessmentCompletionMethod {
  if (value === "offline_draft" || value === "offline_paper") return value;
  return "online_form";
}

function asOnsetPattern(value: unknown): OnsetPattern {
  if (
    value === "sudden" ||
    value === "gradual" ||
    value === "recurring" ||
    value === "post_surgery" ||
    value === "not_sure"
  ) {
    return value;
  }
  return "not_sure";
}

function asReviewStatus(value: unknown): AssessmentReviewStatus {
  if (
    value === "reviewed" ||
    value === "needs_more_info" ||
    value === "urgent_advice" ||
    value === "awaiting_review"
  ) {
    return value;
  }
  return "awaiting_review";
}

function mapAssessmentForm(snap: QueryDocumentSnapshot): PatientAssessmentFormRecord {
  const data = snap.data() as Record<string, unknown>;
  return {
    id: snap.id,
    version: readString(data, "version") || ASSESSMENT_FORM_VERSION,
    formType: asFormType(data.formType),
    consultationMode: asConsultationMode(data.consultationMode),
    completedVia: asCompletionMethod(data.completedVia),
    patientName: readString(data, "patientName"),
    completedBy: readString(data, "completedBy"),
    relationshipToPatient: readString(data, "relationshipToPatient"),
    presentingComplaint: readString(data, "presentingComplaint"),
    bodyArea: readString(data, "bodyArea"),
    symptomStartDate: readString(data, "symptomStartDate"),
    onsetPattern: asOnsetPattern(data.onsetPattern),
    painScore: readNumber(data, "painScore", 0),
    subjective: readSubjective(data.subjective),
    outcomes: readOutcomes(data.outcomes),
    objectiveVideo: readObjectiveVideo(data.objectiveVideo),
    goalsPlan: readGoalSetting(data.goalsPlan),
    symptoms: readString(data, "symptoms"),
    aggravatingFactors: readString(data, "aggravatingFactors"),
    easingFactors: readString(data, "easingFactors"),
    functionalImpact: readString(data, "functionalImpact"),
    goals: readString(data, "goals"),
    medicalHistory: readString(data, "medicalHistory"),
    medications: readString(data, "medications"),
    allergies: readString(data, "allergies"),
    previousTreatment: readString(data, "previousTreatment"),
    communicationNeeds: readString(data, "communicationNeeds"),
    emergencyContactName: readString(data, "emergencyContactName"),
    emergencyContactPhone: readString(data, "emergencyContactPhone"),
    redFlags: readRedFlags(data.redFlags),
    onlineReadiness: readOnlineReadiness(data.onlineReadiness),
    consent: readConsent(data.consent),
    signature: readString(data, "signature"),
    completedAt: readString(data, "completedAt"),
    submittedByUid: readString(data, "submittedByUid"),
    bookingId: readString(data, "bookingId"),
    reviewStatus: asReviewStatus(data.reviewStatus),
    reviewedBy: readString(data, "reviewedBy"),
    reviewedAt: readString(data, "reviewedAt"),
    clinicianNotes: readString(data, "clinicianNotes"),
    riskPlan: readString(data, "riskPlan"),
    nextCheckupDate: readString(data, "nextCheckupDate"),
    createdAt: readDate(data.createdAt),
    updatedAt: readDate(data.updatedAt),
  };
}

export function hasUrgentRedFlags(flags: AssessmentRedFlags): boolean {
  return flags.majorTrauma ||
    flags.chestPainBreathlessness ||
    flags.bladderBowelSaddle ||
    flags.progressiveWeakness ||
    flags.unexplainedFeverWeightLoss ||
    flags.nightPain;
}

export async function submitPatientAssessmentForm(
  uid: string,
  personId: string,
  input: PatientAssessmentFormInput
): Promise<string> {
  const ref = await addDoc(personBase(uid, personId), {
    ...input,
    bookingId: input.bookingId ?? "",
    version: ASSESSMENT_FORM_VERSION,
    reviewStatus: "awaiting_review",
    reviewedBy: "",
    reviewedAt: "",
    clinicianNotes: "",
    riskPlan: "",
    nextCheckupDate: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPatientAssessmentForms(
  uid: string,
  personId: string,
): Promise<PatientAssessmentFormRecord[]> {
  const snap = await getDocs(query(personBase(uid, personId), orderBy("createdAt", "desc")));
  return snap.docs.map(mapAssessmentForm);
}

export async function updateAssessmentReview(
  uid: string,
  personId: string,
  formId: string,
  input: AssessmentReviewInput
): Promise<void> {
  if (!db) throw new Error("Firestore not available");
  await updateDoc(doc(db, "patients", uid, "people", personId, "assessmentForms", formId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}
