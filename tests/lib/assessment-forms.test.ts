import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/firebase", () => ({ db: {} }));

const addDocMock = vi.fn();

const getDocsMock = vi.fn();

vi.mock("firebase/firestore", () => ({
  addDoc: (...args: unknown[]) => addDocMock(...args),
  collection: vi.fn(() => ({})),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
  updateDoc: vi.fn(),
  doc: vi.fn(() => ({})),
}));

import {
  ASSESSMENT_FORM_VERSION,
  getPatientAssessmentForms,
  submitPatientAssessmentForm,
  defaultRedFlags,
  defaultOnlineReadiness,
  defaultAssessmentConsent,
  defaultSubjectiveProfile,
  defaultOutcomeMeasures,
  defaultObjectiveVideo,
  defaultGoalSetting,
  type PatientAssessmentFormInput,
} from "@/lib/assessment-forms";

function buildInput(overrides: Partial<PatientAssessmentFormInput> = {}): PatientAssessmentFormInput {
  return {
    formType: "initial",
    consultationMode: "online",
    completedVia: "online_form",
    patientName: "Jane Doe",
    completedBy: "Jane Doe",
    relationshipToPatient: "self",
    presentingComplaint: "Lower back pain",
    bodyArea: "lower back",
    symptomStartDate: "2026-07-01",
    onsetPattern: "gradual",
    painScore: 4,
    subjective: defaultSubjectiveProfile,
    outcomes: defaultOutcomeMeasures,
    objectiveVideo: defaultObjectiveVideo,
    goalsPlan: defaultGoalSetting,
    symptoms: "Aching pain",
    aggravatingFactors: "Sitting",
    easingFactors: "Walking",
    functionalImpact: "Hard to sit for long",
    goals: "Sit without pain",
    medicalHistory: "None",
    medications: "None",
    allergies: "None",
    previousTreatment: "None",
    communicationNeeds: "None",
    emergencyContactName: "John Doe",
    emergencyContactPhone: "07000000000",
    redFlags: defaultRedFlags,
    onlineReadiness: defaultOnlineReadiness,
    consent: defaultAssessmentConsent,
    signature: "Jane Doe",
    completedAt: "2026-08-02",
    submittedByUid: "u1",
    ...overrides,
  };
}

describe("submitPatientAssessmentForm", () => {
  beforeEach(() => {
    addDocMock.mockReset();
    addDocMock.mockResolvedValue({ id: "form1" });
  });

  it("persists the provided bookingId", async () => {
    await submitPatientAssessmentForm("u1", "self", buildInput({ bookingId: "bk1" }));

    const written = addDocMock.mock.calls[0][1] as Record<string, unknown>;
    expect(written.bookingId).toBe("bk1");
  });

  it("defaults bookingId to an empty string when omitted", async () => {
    await submitPatientAssessmentForm("u1", "self", buildInput());

    const written = addDocMock.mock.calls[0][1] as Record<string, unknown>;
    expect(written.bookingId).toBe("");
  });

  it("forwards bodyRegions", async () => {
    await submitPatientAssessmentForm("u1", "self", buildInput({ bodyRegions: ["neck", "lower-back"] }));
    const written = addDocMock.mock.calls[0][1] as Record<string, unknown>;
    expect(written.bodyRegions).toEqual(["neck", "lower-back"]);
  });
});

describe("getPatientAssessmentForms / bodyRegions", () => {
  it("reads a stored bodyRegions array", async () => {
    getDocsMock.mockResolvedValue({
      docs: [{ id: "f1", data: () => ({ bodyRegions: ["neck", "knee-left"], version: ASSESSMENT_FORM_VERSION }) }],
    });
    const [rec] = await getPatientAssessmentForms("u1", "self");
    expect(rec.bodyRegions).toEqual(["neck", "knee-left"]);
  });

  it("defaults bodyRegions to [] for legacy docs", async () => {
    getDocsMock.mockResolvedValue({
      docs: [{ id: "f2", data: () => ({ version: "old" }) }],
    });
    const [rec] = await getPatientAssessmentForms("u1", "self");
    expect(rec.bodyRegions).toEqual([]);
  });

  it("ASSESSMENT_FORM_VERSION marks the short-form generation", () => {
    expect(ASSESSMENT_FORM_VERSION).toBe("2.0");
  });
});
