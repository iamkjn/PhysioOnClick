import {
  addDoc,
  collection,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  type QueryDocumentSnapshot,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatPersonName } from "@/lib/name-format";

export const ASSESSMENT_FORM_VERSION = "2.0";

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
  // NHS general-checklist additions.
  steroidUseOrOsteoporosis: boolean;
  anticoagulantMedication: boolean;
  persistentCough: boolean;
  smoker: boolean;
  systemicallyUnwellFeverFatigue: boolean;
  recreationalIVDrugUse: boolean;
  nightSweats: boolean;
  weightLoss: boolean;
  thoracicPain: boolean;
  cancerOrFamilyHistory: boolean;
  immunocompromised: boolean;
  none: boolean;
}

/**
 * Condition-specific red-flag groups (NHS Lothian MSK form). Only the groups
 * relevant to the patient's picked body region(s) are shown — see
 * `regionToConditionGroups()` in lib/red-flag-groups.ts.
 */
export type ConditionGroup =
  | "cervicalVascular"
  | "caudaEquina"
  | "spinalFragilityFracture"
  | "inflammatoryArthritisAxSpA"
  | "cancerMSCC";

export type ConditionalRedFlags = Partial<Record<ConditionGroup, Record<string, boolean>>>;

export const CONDITIONAL_RED_FLAG_FIELDS: Record<ConditionGroup, string[]> = {
  cervicalVascular: [
    "dizziness",
    "doubleOrBlurredVision",
    "difficultySwallowing",
    "difficultyTalking",
    "blackoutOrUnexplainedFall",
    "suddenSevereHeadache",
    "cordSigns",
    "bilateralNumbnessHandsFeet",
  ],
  caudaEquina: [
    "bilateralSciatica",
    "severeProgressiveBilateralLegDeficit",
    "difficultyMicturition",
    "lossOfRectalSensation",
    "perianalSensoryLoss",
    "changeInSexualFunction",
  ],
  spinalFragilityFracture: [
    "suddenOnsetPain",
    "minimalTrauma",
    "worsePainSittingLeaningBack",
    "worsePainStandingLeaningForward",
  ],
  inflammatoryArthritisAxSpA: [
    "jointSwellingNoMechanicalCause",
    "prolongedMorningStiffness",
    "dactylitis",
    "enthesitisNoMechanicalCause",
    "historyPsoriasisOrIBD",
    "familyHistoryInflammatoryArthritis",
  ],
  cancerMSCC: [
    "severeProgressivePainThoracic",
    "newSpinalNerveRootPain",
    "newDifficultyWalking",
    "reducedPowerOrAlteredSensationLimbs",
    "bowelBladderDisturbance",
  ],
};

export const CONDITION_GROUP_LABELS: Record<ConditionGroup, string> = {
  cervicalVascular: "Cervical (neck) vascular screen",
  caudaEquina: "Cauda equina screen",
  spinalFragilityFracture: "Spinal fragility fracture screen",
  inflammatoryArthritisAxSpA: "Inflammatory arthritis / axial spondyloarthritis screen",
  cancerMSCC: "Cancer / spinal cord compression screen",
};

export const RED_FLAG_FIELD_LABELS: Record<string, string> = {
  // common
  majorTrauma: "A recent serious injury, fall or suspected broken bone",
  chestPainBreathlessness: "Chest pain, breathlessness, blackouts or dizziness",
  bladderBowelSaddle: "New problems with bladder, bowel or numbness around the saddle area",
  progressiveWeakness: "Weakness or clumsiness that's quickly getting worse",
  unexplainedFeverWeightLoss: "Unexplained fever, night sweats or weight loss",
  nightPain: "Constant pain that's there all night",
  steroidUseOrOsteoporosis: "Long-term steroid use or known osteoporosis",
  anticoagulantMedication: "Taking anticoagulant (blood-thinning) medication",
  persistentCough: "Persistent cough",
  smoker: "Current or recent smoker",
  systemicallyUnwellFeverFatigue: "Feeling systemically unwell — fever or fatigue",
  recreationalIVDrugUse: "History of recreational IV drug use",
  nightSweats: "Night sweats",
  weightLoss: "Unexplained weight loss",
  thoracicPain: "Thoracic (mid-back) pain",
  cancerOrFamilyHistory: "Personal or family history of cancer",
  immunocompromised: "Immunocompromised",
  // cervicalVascular
  dizziness: "Dizziness",
  doubleOrBlurredVision: "Double or blurred vision",
  difficultySwallowing: "Difficulty swallowing",
  difficultyTalking: "Difficulty talking / slurred speech",
  blackoutOrUnexplainedFall: "Blackout or unexplained fall",
  suddenSevereHeadache: "Sudden, severe headache",
  cordSigns: "Signs of spinal cord involvement",
  bilateralNumbnessHandsFeet: "Bilateral numbness in hands or feet",
  // caudaEquina
  bilateralSciatica: "Bilateral sciatica",
  severeProgressiveBilateralLegDeficit: "Severe, progressive bilateral leg weakness",
  difficultyMicturition: "Difficulty passing urine",
  lossOfRectalSensation: "Loss of rectal sensation",
  perianalSensoryLoss: "Numbness around the perianal area (saddle anaesthesia)",
  changeInSexualFunction: "New change in sexual function",
  // spinalFragilityFracture
  suddenOnsetPain: "Sudden onset of severe spinal pain",
  minimalTrauma: "Pain after only minimal trauma (e.g. a minor bump)",
  worsePainSittingLeaningBack: "Pain worse sitting or leaning back",
  worsePainStandingLeaningForward: "Pain worse standing or leaning forward",
  // inflammatoryArthritisAxSpA
  jointSwellingNoMechanicalCause: "Joint swelling with no obvious mechanical cause",
  prolongedMorningStiffness: "Prolonged morning stiffness (over 30 minutes)",
  dactylitis: "'Sausage' swelling of a whole finger or toe (dactylitis)",
  enthesitisNoMechanicalCause: "Tendon/ligament attachment pain with no mechanical cause (enthesitis)",
  historyPsoriasisOrIBD: "History of psoriasis or inflammatory bowel disease",
  familyHistoryInflammatoryArthritis: "Family history of inflammatory arthritis",
  // cancerMSCC
  severeProgressivePainThoracic: "Severe, progressive thoracic/spinal pain",
  newSpinalNerveRootPain: "New spinal nerve root pain",
  newDifficultyWalking: "New difficulty walking",
  reducedPowerOrAlteredSensationLimbs: "Reduced power or altered sensation in the limbs",
  bowelBladderDisturbance: "New bowel or bladder disturbance",
};

export interface RedFlagAuditEntry {
  field: string;
  from: boolean | null;
  to: boolean;
  changedBy: string;
  changedAt: string;
  source: "patient_form" | "admin_session";
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
  patientDob?: string;
  patientAge?: number | null;
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
  conditionalFlags?: ConditionalRedFlags;
  bodyRegions?: string[];
  onlineReadiness: OnlineReadiness;
  consent: AssessmentConsent;
  signature: string;
  completedAt: string;
  submittedByUid: string;
  bookingId?: string;
}

export interface PatientAssessmentFormRecord extends PatientAssessmentFormInput {
  id: string;
  bodyRegions: string[];
  version: string;
  reviewStatus: AssessmentReviewStatus;
  reviewedBy: string;
  reviewedAt: string;
  clinicianNotes: string;
  riskPlan: string;
  nextCheckupDate: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  // Server/admin-managed only — never written by the patient-facing form.
  conditionalFlags: ConditionalRedFlags;
  redFlagAuditLog: RedFlagAuditEntry[];
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
  steroidUseOrOsteoporosis: false,
  anticoagulantMedication: false,
  persistentCough: false,
  smoker: false,
  systemicallyUnwellFeverFatigue: false,
  recreationalIVDrugUse: false,
  nightSweats: false,
  weightLoss: false,
  thoracicPain: false,
  cancerOrFamilyHistory: false,
  immunocompromised: false,
  none: false,
};

export function defaultConditionalRedFlagsFor(groups: ConditionGroup[]): ConditionalRedFlags {
  const out: ConditionalRedFlags = {};
  for (const g of groups) {
    out[g] = Object.fromEntries(CONDITIONAL_RED_FLAG_FIELDS[g].map((f) => [f, false]));
  }
  return out;
}

export const defaultConditionalRedFlags: ConditionalRedFlags = {};

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

function readStringArray(data: Record<string, unknown>, key: string): string[] {
  const value = data[key];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function readRedFlags(value: unknown): AssessmentRedFlags {
  const d = typeof value === "object" && value !== null ? value as Partial<AssessmentRedFlags> : {};
  return {
    majorTrauma: d.majorTrauma === true,
    chestPainBreathlessness: d.chestPainBreathlessness === true,
    bladderBowelSaddle: d.bladderBowelSaddle === true,
    progressiveWeakness: d.progressiveWeakness === true,
    unexplainedFeverWeightLoss: d.unexplainedFeverWeightLoss === true,
    nightPain: d.nightPain === true,
    steroidUseOrOsteoporosis: d.steroidUseOrOsteoporosis === true,
    anticoagulantMedication: d.anticoagulantMedication === true,
    persistentCough: d.persistentCough === true,
    smoker: d.smoker === true,
    systemicallyUnwellFeverFatigue: d.systemicallyUnwellFeverFatigue === true,
    recreationalIVDrugUse: d.recreationalIVDrugUse === true,
    nightSweats: d.nightSweats === true,
    weightLoss: d.weightLoss === true,
    thoracicPain: d.thoracicPain === true,
    cancerOrFamilyHistory: d.cancerOrFamilyHistory === true,
    immunocompromised: d.immunocompromised === true,
    none: d.none === true,
  };
}

export function readConditionalRedFlags(value: unknown): ConditionalRedFlags {
  const d = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  const out: ConditionalRedFlags = {};
  for (const group of Object.keys(CONDITIONAL_RED_FLAG_FIELDS) as ConditionGroup[]) {
    const raw = d[group];
    if (typeof raw !== "object" || raw === null) continue;
    const rawFields = raw as Record<string, unknown>;
    const fields: Record<string, boolean> = {};
    for (const key of CONDITIONAL_RED_FLAG_FIELDS[group]) {
      fields[key] = rawFields[key] === true;
    }
    out[group] = fields;
  }
  return out;
}

function readRedFlagAuditLog(value: unknown): RedFlagAuditEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
    .map((v) => ({
      field: typeof v.field === "string" ? v.field : "",
      from: typeof v.from === "boolean" ? v.from : null,
      to: v.to === true,
      changedBy: typeof v.changedBy === "string" ? v.changedBy : "",
      changedAt: typeof v.changedAt === "string" ? v.changedAt : "",
      source: v.source === "admin_session" ? "admin_session" : "patient_form",
    }));
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

function mapAssessmentForm(snap: QueryDocumentSnapshot | DocumentSnapshot): PatientAssessmentFormRecord {
  const data = snap.data() as Record<string, unknown>;
  return {
    id: snap.id,
    version: readString(data, "version") || ASSESSMENT_FORM_VERSION,
    formType: asFormType(data.formType),
    consultationMode: asConsultationMode(data.consultationMode),
    completedVia: asCompletionMethod(data.completedVia),
    patientName: formatPersonName(readString(data, "patientName")),
    patientDob: readString(data, "patientDob"),
    patientAge: readNumber(data, "patientAge", -1) >= 0 ? readNumber(data, "patientAge", -1) : null,
    completedBy: formatPersonName(readString(data, "completedBy"), ""),
    relationshipToPatient: readString(data, "relationshipToPatient"),
    presentingComplaint: readString(data, "presentingComplaint"),
    bodyArea: readString(data, "bodyArea"),
    bodyRegions: readStringArray(data, "bodyRegions"),
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
    conditionalFlags: readConditionalRedFlags(data.conditionalFlags),
    redFlagAuditLog: readRedFlagAuditLog(data.redFlagAuditLog),
  };
}

export function hasUrgentRedFlags(flags: AssessmentRedFlags): boolean {
  return flags.majorTrauma ||
    flags.chestPainBreathlessness ||
    flags.bladderBowelSaddle ||
    flags.progressiveWeakness ||
    flags.unexplainedFeverWeightLoss ||
    flags.nightPain ||
    flags.cancerOrFamilyHistory ||
    flags.thoracicPain ||
    (flags.nightSweats && flags.weightLoss);
}

function countTrue(fields: Record<string, boolean> | undefined): number {
  if (!fields) return 0;
  return Object.values(fields).filter(Boolean).length;
}

/**
 * Overall triage tier mirroring the NHS Lothian MSK document's structure:
 * "emergency" for anything that should stop the session and prompt urgent
 * care, "some"/"few" for a growing number of lower-severity flags, "none"
 * otherwise. Deliberately simple/rule-based, not a diagnosis.
 */
export function levelOfConcern(
  flags: AssessmentRedFlags,
  conditionalFlags: ConditionalRedFlags,
): "none" | "few" | "some" | "emergency" {
  // Any cauda equina, cervical vascular, or cancer/MSCC conditional flag is
  // an immediate emergency tier, same as the common urgent flags.
  const emergencyGroups: ConditionGroup[] = ["caudaEquina", "cervicalVascular", "cancerMSCC"];
  const hasEmergencyConditional = emergencyGroups.some((g) => countTrue(conditionalFlags[g]) > 0);
  if (hasUrgentRedFlags(flags) || hasEmergencyConditional) return "emergency";

  const commonCount = [
    flags.steroidUseOrOsteoporosis,
    flags.anticoagulantMedication,
    flags.persistentCough,
    flags.smoker,
    flags.systemicallyUnwellFeverFatigue,
    flags.recreationalIVDrugUse,
    flags.nightSweats,
    flags.weightLoss,
    flags.immunocompromised,
  ].filter(Boolean).length;

  const conditionalCount =
    countTrue(conditionalFlags.spinalFragilityFracture) + countTrue(conditionalFlags.inflammatoryArthritisAxSpA);

  const total = commonCount + conditionalCount;
  if (total === 0) return "none";
  if (total <= 2) return "few";
  return "some";
}

export async function submitPatientAssessmentForm(
  uid: string,
  personId: string,
  input: PatientAssessmentFormInput
): Promise<string> {
  if (!input.emergencyContactName.trim() || !input.emergencyContactPhone.trim()) {
    throw new Error("Emergency contact name and phone are required.");
  }
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

/** Fetch one assessment by id — used by the admin bookings table to show what a patient submitted pre-payment. */
export async function getPatientAssessmentFormById(
  uid: string,
  personId: string,
  formId: string,
): Promise<PatientAssessmentFormRecord | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "patients", uid, "people", personId, "assessmentForms", formId));
  if (!snap.exists()) return null;
  return mapAssessmentForm(snap);
}

/**
 * Applies red-flag edits made during the "Start Session" wizard's Screening
 * step and appends each change to the audit log. Read-modify-write (rather
 * than a blind arrayUnion) so `updatedFlags`/`updatedConditionalFlags` and the
 * log stay consistent with each other in one write.
 */
export async function recordRedFlagChange(
  uid: string,
  personId: string,
  formId: string,
  entries: RedFlagAuditEntry[],
  updatedFlags: AssessmentRedFlags,
  updatedConditionalFlags: ConditionalRedFlags,
): Promise<void> {
  if (!db) throw new Error("Firestore not available");
  if (entries.length === 0) return;
  const ref = doc(db, "patients", uid, "people", personId, "assessmentForms", formId);
  const snap = await getDoc(ref);
  const existingLog = snap.exists() ? readRedFlagAuditLog(snap.data()?.redFlagAuditLog) : [];
  await updateDoc(ref, {
    redFlags: updatedFlags,
    conditionalFlags: updatedConditionalFlags,
    redFlagAuditLog: [...existingLog, ...entries],
    updatedAt: serverTimestamp(),
  });
}

/**
 * Lightweight partial update for the "document reasoning for positive red
 * flags" nudge in the Start Session wizard (components/start-session-flow.tsx)
 * — deliberately just the one field, not the full clinician-review payload
 * `updateAssessmentReview` writes, so it doesn't touch `reviewStatus` etc.
 */
export async function updateAssessmentRiskPlan(
  uid: string,
  personId: string,
  formId: string,
  riskPlan: string,
): Promise<void> {
  if (!db) throw new Error("Firestore not available");
  await updateDoc(doc(db, "patients", uid, "people", personId, "assessmentForms", formId), {
    riskPlan,
    updatedAt: serverTimestamp(),
  });
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
