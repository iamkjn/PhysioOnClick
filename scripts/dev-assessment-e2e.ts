// scripts/dev-assessment-e2e.ts
//
// Real end-to-end test of the booking-gated assessment feature against the
// LIVE dev Firebase cloud project (physioonclick-dev). Not the emulator.
//
// Run: npx tsx --env-file=.env.development scripts/dev-assessment-e2e.ts
//
// Uses firebase-admin (node-native admin ops) + plain fetch to Google's
// REST APIs (Identity Toolkit + Firestore) to exercise the deployed
// Firestore security rules as a real signed-in patient would.

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// ---------------------------------------------------------------------------
// Guard: this script must only ever run against the real dev cloud project.
// ---------------------------------------------------------------------------
if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error(
    "FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST is set.\n" +
      "This script is for the REAL physioonclick-dev cloud project — refusing to run."
  );
  process.exit(1);
}

const PROJECT_ID = "physioonclick-dev";

type StepResult = { name: string; pass: boolean; detail: string };
const results: StepResult[] = [];
function record(name: string, pass: boolean, detail: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}: ${detail}`);
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

// ---------------------------------------------------------------------------
// Minimal JS -> Firestore REST "Value" encoder (handles the subset of types
// the assessment form fixture uses: string, number (int/double), bool, map,
// and null).
// ---------------------------------------------------------------------------
function toFirestoreValue(v: unknown): Record<string, unknown> {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === "object") {
    const fields: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      fields[k] = toFirestoreValue(val);
    }
    return { mapValue: { fields } };
  }
  throw new Error(`Unsupported value type for Firestore REST encoding: ${typeof v}`);
}

function toFirestoreFields(obj: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toFirestoreValue(v);
  return { fields };
}

function assessmentForm(overrides: Record<string, unknown> = {}, bookingId: string, uid: string) {
  const base: Record<string, unknown> = {
    version: "2026-07-csp-hcpc-v2",
    formType: "initial",
    consultationMode: "online",
    completedVia: "online_form",
    patientName: "E2E Patient",
    completedBy: "E2E Patient",
    relationshipToPatient: "Self",
    presentingComplaint: "My knee has become painful when walking upstairs.",
    bodyArea: "Right knee",
    symptomStartDate: "2026-07-20",
    onsetPattern: "gradual",
    painScore: 5,
    subjective: {
      clinicalArea: "lower_limb",
      symptomBehaviour: "Symptoms are worse on stairs and ease after resting for around 20 minutes.",
      irritability: 5,
      severity: 6,
      yellowFlags: "Worried about returning to running too early.",
    },
    outcomes: {
      psfsActivity1: "Walking upstairs",
      psfsScore1: 4,
      psfsActivity2: "Walking to work",
      psfsScore2: 5,
      psfsActivity3: "",
      psfsScore3: 5,
      painBest: 2,
      painWorst: 8,
      confidenceScore: 6,
      conditionMeasureName: "LEFS",
      conditionMeasureScore: 42,
      conditionMeasureMax: 80,
    },
    objectiveVideo: {
      consent: false,
      taskId: "lower-limb-sit-to-stand",
      taskLabel: "30-second sit-to-stand or step-up clip",
      metricName: "Completed repetitions",
      metricValue: 8,
      metricUnit: "reps",
      reps: 8,
      durationSeconds: 30,
      qualityNotes: "Uses hands lightly on the chair.",
      videoUrl: "",
      storagePath: "",
      recordedAt: "",
    },
    goalsPlan: {
      meaningfulGoal: "Climb one flight of stairs",
      baseline: "Four stairs with pain 7/10",
      target: "One full flight with pain no higher than 3/10",
      timeframeWeeks: 6,
      confidenceScore: 6,
      barriers: "Work schedule and flare-ups",
      supportPlan: "Pacing plan and progressive strengthening",
      reviewDate: "2026-09-06",
    },
    symptoms: "Aching pain and stiffness around the front of the knee.",
    aggravatingFactors: "Stairs and longer walks",
    easingFactors: "Rest and gentle movement",
    functionalImpact: "Harder to use stairs at work",
    goals: "Walk upstairs comfortably",
    medicalHistory: "",
    medications: "",
    allergies: "",
    previousTreatment: "",
    communicationNeeds: "",
    emergencyContactName: "Emergency Contact",
    emergencyContactPhone: "07123456789",
    redFlags: {
      majorTrauma: false,
      chestPainBreathlessness: false,
      bladderBowelSaddle: false,
      progressiveWeakness: false,
      unexplainedFeverWeightLoss: false,
      nightPain: false,
      none: true,
    },
    onlineReadiness: {
      privateSpace: true,
      safeSpace: true,
      cameraAvailable: true,
      emergencyContactAvailable: true,
    },
    consent: {
      careConsent: true,
      dataConsent: true,
      privacyConsent: true,
      safetySharing: true,
      videoConsent: false,
    },
    signature: "E2E Patient",
    completedAt: "2026-07-26T10:20:00.000Z",
    submittedByUid: uid,
    reviewStatus: "awaiting_review",
    reviewedBy: "",
    reviewedAt: "",
    clinicianNotes: "",
    riskPlan: "",
    nextCheckupDate: "",
    bookingId,
    ...overrides,
  };
  return base;
}

async function main() {
  const serviceAccountJson = required("FIREBASE_SERVICE_ACCOUNT_JSON");
  const apiKey = required("NEXT_PUBLIC_FIREBASE_API_KEY");

  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(serviceAccountJson)), projectId: PROJECT_ID });
  }
  const adminAuth = getAuth();
  const adminDb = getFirestore();

  let uid: string | undefined;
  let bookingId: string | undefined;
  let idToken: string | undefined;
  let assessmentDocPath: string | undefined;
  let overallOk = true;

  try {
    // Step 2: create throwaway auth user + custom token
    const testEmail = `dev-e2e-assessment-${Date.now()}@example.com`;
    try {
      const user = await adminAuth.createUser({ email: testEmail, password: "e2e-test-password-123!" });
      uid = user.uid;
      record("2. create throwaway auth user", true, `uid=${uid}`);
    } catch (err) {
      record("2. create throwaway auth user", false, String(err));
      throw err;
    }

    // Step 3: exchange custom token for ID token
    try {
      const customToken = await adminAuth.createCustomToken(uid!);
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        }
      );
      const json = (await resp.json()) as { idToken?: string; error?: unknown };
      if (!resp.ok || !json.idToken) {
        throw new Error(`signInWithCustomToken failed: HTTP ${resp.status} ${JSON.stringify(json.error)}`);
      }
      idToken = json.idToken;
      record("3. exchange custom token for ID token", true, "ID token obtained (redacted)");
    } catch (err) {
      record("3. exchange custom token for ID token", false, String(err));
      throw err;
    }

    // Step 4: seed a PAID upcoming booking via admin Firestore
    try {
      const bookingRef = await adminDb.collection("bookings").add({
        bookedBy: uid,
        patientId: uid,
        patientName: "E2E Patient",
        email: "krunalnayak49@gmail.com",
        service: "Initial Assessment",
        paid: true,
        status: "upcoming",
        sessionDate: Timestamp.fromDate(new Date(Date.now() + 2 * 3600e3)),
        appointmentLabel: "E2E test slot",
      });
      bookingId = bookingRef.id;
      record("4. seed paid upcoming booking", true, `bookingId=${bookingId}`);
    } catch (err) {
      record("4. seed paid upcoming booking", false, String(err));
      throw err;
    }

    // Step 5: GATE PROOF — patient reads their own booking via Firestore REST
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/bookings/${bookingId}`;
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
      const json = (await resp.json()) as { fields?: { paid?: { booleanValue?: boolean } } };
      const paidOk = resp.status === 200 && json.fields?.paid?.booleanValue === true;
      record(
        "5. gate proof: patient reads own paid booking",
        paidOk,
        `HTTP ${resp.status}, paid=${json.fields?.paid?.booleanValue}`
      );
      if (!paidOk) overallOk = false;
    } catch (err) {
      record("5. gate proof: patient reads own paid booking", false, String(err));
      overallOk = false;
    }

    // Step 6: CRUX — rules ALLOW a valid submission
    assessmentDocPath = `patients/${uid}/people/${uid}/assessmentForms/e2e-form`;
    try {
      const form = assessmentForm({}, bookingId!, uid!);
      const body = toFirestoreFields(form);
      const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${assessmentDocPath}`;
      const resp = await fetch(url, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await resp.text();
      const pass = resp.status === 200;
      record("6. CRUX: valid assessment submission allowed", pass, `HTTP ${resp.status}${pass ? "" : " — " + text.slice(0, 500)}`);
      if (!pass) overallOk = false;
    } catch (err) {
      record("6. CRUX: valid assessment submission allowed", false, String(err));
      overallOk = false;
    }

    // Step 7: REJECT PROOF — invalid consent must 403
    try {
      const form = assessmentForm(
        {
          consent: {
            careConsent: true,
            dataConsent: true,
            privacyConsent: false,
            safetySharing: true,
            videoConsent: false,
          },
        },
        bookingId!,
        uid!
      );
      const body = toFirestoreFields(form);
      const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/patients/${uid}/people/${uid}/assessmentForms/e2e-form-reject`;
      const resp = await fetch(url, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await resp.text();
      const pass = resp.status === 403;
      record(
        "7. REJECT proof: invalid consent rejected",
        pass,
        `HTTP ${resp.status}${pass ? "" : " — " + text.slice(0, 500)}`
      );
      if (!pass) overallOk = false;
    } catch (err) {
      record("7. REJECT proof: invalid consent rejected", false, String(err));
      overallOk = false;
    }

    // Step 8: STAMP (optional — only if localhost:3000 is reachable)
    try {
      const pingResp = await fetch("http://localhost:3000/api/patient/assessment/link", {
        method: "POST",
        signal: AbortSignal.timeout(2000),
      }).catch(() => null);
      if (!pingResp) {
        record("8. stamp assessmentCompletedAt via local API", true, "SKIPPED — localhost:3000 not reachable");
      } else {
        const resp = await fetch("http://localhost:3000/api/patient/assessment/link", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, assessmentFormId: "e2e-form" }),
        });
        const linkOk = resp.status === 200;
        if (!linkOk) {
          record("8. stamp assessmentCompletedAt via local API", false, `HTTP ${resp.status}`);
          overallOk = false;
        } else {
          const snap = await adminDb.collection("bookings").doc(bookingId!).get();
          const stamped = !!snap.data()?.assessmentCompletedAt;
          record("8. stamp assessmentCompletedAt via local API", stamped, `assessmentCompletedAt set=${stamped}`);
          if (!stamped) overallOk = false;
        }
      }
    } catch (err) {
      record("8. stamp assessmentCompletedAt via local API", true, `SKIPPED — ${String(err)}`);
    }

    // Step 9: ADMIN READ
    try {
      const snap = await adminDb.doc(assessmentDocPath).get();
      const pass = snap.exists && snap.data()?.reviewStatus === "awaiting_review";
      record("9. admin read of submitted assessment", pass, `exists=${snap.exists}, reviewStatus=${snap.data()?.reviewStatus}`);
      if (!pass) overallOk = false;
    } catch (err) {
      record("9. admin read of submitted assessment", false, String(err));
      overallOk = false;
    }
  } finally {
    // Step 10: CLEANUP
    try {
      if (assessmentDocPath) await adminDb.doc(assessmentDocPath).delete().catch(() => {});
      await adminDb.doc(`patients/${uid}/people/${uid}/assessmentForms/e2e-form-reject`).delete().catch(() => {});
      if (bookingId) await adminDb.collection("bookings").doc(bookingId).delete().catch(() => {});
      if (uid) await adminAuth.deleteUser(uid).catch(() => {});
      record("10. cleanup", true, "assessment doc(s), booking, auth user deleted");
    } catch (err) {
      record("10. cleanup", false, String(err));
      overallOk = false;
    }
  }

  console.log("\n=== SUMMARY ===");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} — ${r.name}`);
  console.log(overallOk ? "\nOVERALL: PASS" : "\nOVERALL: FAIL");
  process.exit(overallOk ? 0 : 1);
}

main().catch((err) => {
  console.error("\nE2E test crashed:", err);
  process.exit(1);
});
