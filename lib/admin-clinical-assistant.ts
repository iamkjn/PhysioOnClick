export type AdminClinicalSummaryPatch = {
  workedOn?: string;
  nextSteps?: string;
  safetyNettingNotes?: string;
};

export type AdminClinicalAssistantResponse = {
  reply: string;
  checks?: string[];
  priority?: "routine" | "attention" | "urgent";
  summaryPatch?: AdminClinicalSummaryPatch | null;
};

export type AdminClinicalAssistantContext = {
  bookingId: string;
  currentStep: string;
  booking: {
    patientName: string;
    service: string;
    sessionDate: string;
  };
  assessment?: {
    patientAge?: number | null;
    bodyArea?: string;
    bodyRegions?: string[];
    presentingComplaint?: string;
    symptoms?: string;
    functionalImpact?: string;
    goals?: string;
    painScore?: number;
    clinicalArea?: string;
    irritability?: number;
    severity?: number;
    yellowFlags?: string;
    medicalHistory?: string;
    medications?: string;
    previousTreatment?: string;
  } | null;
  screening: {
    concern: string;
    positiveFlags: string[];
    riskPlanText: string;
    screeningGateSatisfied: boolean;
  };
  selfTests: {
    selected: string[];
    results: Array<{ name: string; result: string; notes?: string }>;
  };
  clinicalImpression: Array<{ label: string; confirmed: boolean }>;
  exercises: {
    assigned: string[];
    suggested: Array<{ title: string; reason: string; stage?: string; bodyArea?: string }>;
  };
  summary: {
    painScore: number;
    recoveryPercent: number;
    sessionOutcome: string;
    workedOn: string;
    nextSteps: string;
    followUpWeeks: number;
    safetyNettingProvided: boolean;
    safetyNettingNotes: string;
  };
};
