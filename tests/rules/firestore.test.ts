import { readFileSync } from 'node:fs'
import path from 'node:path'

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Covers the two subcollections the mobile app writes through the client SDK
// (patients/{uid}/favoriteBlogs and patients/{uid}/uploads) plus the surrounding
// hardening: the patients/** catch-all must stay read-only, so a new subcollection
// is denied by default rather than silently allowed.

const PATIENT = 'patient-uid'
const OTHER = 'other-uid'
const ADMIN = 'admin-uid'
const PERSON = 'person-1'

let testEnv: RulesTestEnvironment

// Mirrors the set() in mobile blog_screen.dart / blog_detail_screen.dart.
function favourite(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'knee-pain-guide',
    title: 'Knee pain and rehab: a practical UK physiotherapy guide',
    category: 'Rehab',
    excerpt: 'A clear, evidence-based guide covering symptoms and rehab planning.',
    image: '',
    publishedAt: '2025-01-01T00:00:00.000',
    savedAt: serverTimestamp(),
    userId: PATIENT,
    userEmail: 'patient@example.com',
    ...overrides,
  }
}

// Mirrors the add() in mobile profile_screen.dart.
function upload(overrides: Record<string, unknown> = {}) {
  return {
    fileName: 'referral.pdf',
    downloadUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/referral.pdf?alt=media',
    storagePath: `patient-uploads/${PATIENT}/1700000000000_referral.pdf`,
    size: 2048,
    uploadedAt: serverTimestamp(),
    uploadedBy: 'patient@example.com',
    extension: 'pdf',
    ...overrides,
  }
}

const favouriteDoc = (db: unknown, uid = PATIENT) =>
  doc(db as never, `patients/${uid}/favoriteBlogs/knee-pain-guide`)

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'physioonclick',
    firestore: {
      rules: readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv?.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

describe('patients/{uid}/favoriteBlogs', () => {
  it('lets the owner save a favourite in the shape the mobile app writes', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(favouriteDoc(db), favourite()))
  })

  it('lets the owner read and un-favourite', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(favouriteDoc(db), favourite()))
    await assertSucceeds(getDoc(favouriteDoc(db)))
    await assertSucceeds(deleteDoc(favouriteDoc(db)))
  })

  it('denies another signed-in patient', async () => {
    const db = testEnv.authenticatedContext(OTHER).firestore()
    await assertFails(setDoc(favouriteDoc(db), favourite({ userId: OTHER })))
    await assertFails(getDoc(favouriteDoc(db)))
  })

  it('denies unauthenticated writes', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(setDoc(favouriteDoc(db), favourite()))
  })

  it('rejects an injected extra field', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(favouriteDoc(db), favourite({ isAdmin: true })))
  })

  it('rejects a userId that does not match the path', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(favouriteDoc(db), favourite({ userId: OTHER })))
  })

  it('rejects an oversized excerpt', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(favouriteDoc(db), favourite({ excerpt: 'x'.repeat(2001) })))
  })

  it('rejects a non-string publishedAt', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(favouriteDoc(db), favourite({ publishedAt: 20250101 })))
  })
})

describe('patients/{uid}/uploads', () => {
  const ref = (db: unknown) => doc(db as never, `patients/${PATIENT}/uploads/upload-1`)

  it('lets the owner record an upload in the shape the mobile app writes', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(ref(db), upload()))
  })

  it('lets the owner read and delete their upload record', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(ref(db), upload()))
    await assertSucceeds(getDoc(ref(db)))
    await assertSucceeds(deleteDoc(ref(db)))
  })

  it('denies another signed-in patient', async () => {
    const db = testEnv.authenticatedContext(OTHER).firestore()
    await assertFails(setDoc(ref(db), upload()))
    await assertFails(getDoc(ref(db)))
  })

  it('rejects a size over the 10MB storage.rules cap', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(ref(db), upload({ size: 10 * 1024 * 1024 + 1 })))
  })

  it('rejects a non-integer size', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(ref(db), upload({ size: 'big' })))
  })

  it('rejects an injected extra field', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(ref(db), upload({ ownerId: OTHER })))
  })
})

function assessmentForm(overrides: Record<string, unknown> = {}) {
  return {
    version: '2026-07-csp-hcpc-v2',
    formType: 'initial',
    consultationMode: 'online',
    completedVia: 'online_form',
    patientName: 'Patient One',
    completedBy: 'Patient One',
    relationshipToPatient: 'Self',
    presentingComplaint: 'My knee has become painful when walking upstairs.',
    bodyArea: 'Right knee',
    symptomStartDate: '2026-07-20',
    onsetPattern: 'gradual',
    painScore: 5,
    subjective: {
      clinicalArea: 'lower_limb',
      symptomBehaviour: 'Symptoms are worse on stairs and ease after resting for around 20 minutes.',
      irritability: 5,
      severity: 6,
      yellowFlags: 'Worried about returning to running too early.',
    },
    outcomes: {
      psfsActivity1: 'Walking upstairs',
      psfsScore1: 4,
      psfsActivity2: 'Walking to work',
      psfsScore2: 5,
      psfsActivity3: '',
      psfsScore3: 5,
      painBest: 2,
      painWorst: 8,
      confidenceScore: 6,
      conditionMeasureName: 'LEFS',
      conditionMeasureScore: 42,
      conditionMeasureMax: 80,
    },
    objectiveVideo: {
      consent: false,
      taskId: 'lower-limb-sit-to-stand',
      taskLabel: '30-second sit-to-stand or step-up clip',
      metricName: 'Completed repetitions',
      metricValue: 8,
      metricUnit: 'reps',
      reps: 8,
      durationSeconds: 30,
      qualityNotes: 'Uses hands lightly on the chair.',
      videoUrl: '',
      storagePath: '',
      recordedAt: '',
    },
    goalsPlan: {
      meaningfulGoal: 'Climb one flight of stairs',
      baseline: 'Four stairs with pain 7/10',
      target: 'One full flight with pain no higher than 3/10',
      timeframeWeeks: 6,
      confidenceScore: 6,
      barriers: 'Work schedule and flare-ups',
      supportPlan: 'Pacing plan and progressive strengthening',
      reviewDate: '2026-09-06',
    },
    symptoms: 'Aching pain and stiffness around the front of the knee.',
    aggravatingFactors: 'Stairs and longer walks',
    easingFactors: 'Rest and gentle movement',
    functionalImpact: 'Harder to use stairs at work',
    goals: 'Walk upstairs comfortably',
    medicalHistory: '',
    medications: '',
    allergies: '',
    previousTreatment: '',
    communicationNeeds: '',
    emergencyContactName: 'Emergency Contact',
    emergencyContactPhone: '07123456789',
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
    signature: 'Patient One',
    completedAt: '2026-07-26T10:20:00.000Z',
    submittedByUid: PATIENT,
    reviewStatus: 'awaiting_review',
    reviewedBy: '',
    reviewedAt: '',
    clinicianNotes: '',
    riskPlan: '',
    nextCheckupDate: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    bookingId: '',
    ...overrides,
  }
}

describe('patients/{uid}/people/{personId}/assessmentForms', () => {
  const formDoc = (db: unknown, uid = PATIENT) =>
    doc(db as never, `patients/${uid}/people/${PERSON}/assessmentForms/form-1`)

  it('lets the owning patient create and read a submitted assessment form', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(formDoc(db), assessmentForm()))
    await assertSucceeds(getDoc(formDoc(db)))
  })

  it('denies the patient amending a submitted assessment record', async () => {
    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(formDoc(owner), assessmentForm()))
    await assertFails(updateDoc(formDoc(owner), { symptoms: 'Changed after submission.' }))
  })

  it('lets an admin review an assessment form', async () => {
    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(formDoc(owner), assessmentForm()))

    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(updateDoc(formDoc(admin), {
      reviewStatus: 'reviewed',
      reviewedBy: 'Admin Physio',
      reviewedAt: '2026-07-26T10:30:00.000Z',
      clinicianNotes: 'Reviewed before the appointment.',
      riskPlan: 'Proceed with online assessment and monitor symptoms.',
      nextCheckupDate: '2026-08-02',
      updatedAt: serverTimestamp(),
    }))
  })

  it('denies another signed-in patient reading or writing the form', async () => {
    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(formDoc(owner), assessmentForm()))

    const other = testEnv.authenticatedContext(OTHER).firestore()
    await assertFails(getDoc(formDoc(other)))
    await assertFails(setDoc(formDoc(other, PATIENT), assessmentForm({ submittedByUid: OTHER })))
  })

  it('rejects incomplete consent', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(formDoc(db), assessmentForm({
      consent: {
        careConsent: true,
        dataConsent: true,
        privacyConsent: false,
        safetySharing: true,
      },
    })))
  })

  it('rejects invalid outcome measure scoring', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    const base = assessmentForm()
    await assertFails(setDoc(formDoc(db), {
      ...base,
      outcomes: {
        ...base.outcomes,
        conditionMeasureScore: 120,
        conditionMeasureMax: 80,
      },
    }))
  })

  it('rejects video evidence without video consent', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    const base = assessmentForm()
    await assertFails(setDoc(formDoc(db), {
      ...base,
      objectiveVideo: {
        ...base.objectiveVideo,
        videoUrl: 'https://firebasestorage.googleapis.com/v0/b/physioonclick/o/patient-assessment-videos%2Fpatient-uid%2Fperson-1%2Fclip.webm?alt=media',
        storagePath: 'patient-assessment-videos/patient-uid/person-1/clip.webm',
        recordedAt: '2026-07-26T10:25:00.000Z',
      },
    }))
  })

  it('allows video evidence when consent and owner storage path match', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    const base = assessmentForm()
    await assertSucceeds(setDoc(formDoc(db), {
      ...base,
      consent: {
        ...base.consent,
        videoConsent: true,
      },
      objectiveVideo: {
        ...base.objectiveVideo,
        consent: true,
        videoUrl: 'https://firebasestorage.googleapis.com/v0/b/physioonclick/o/patient-assessment-videos%2Fpatient-uid%2Fperson-1%2Fclip.webm?alt=media',
        storagePath: 'patient-assessment-videos/patient-uid/person-1/clip.webm',
        recordedAt: '2026-07-26T10:25:00.000Z',
      },
    }))
  })

  it('rejects patient-created forged review fields', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(formDoc(db), assessmentForm({
      reviewStatus: 'reviewed',
      reviewedBy: 'Patient pretending to be a clinician',
    })))
  })

  it('rejects oversized clinical review notes', async () => {
    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(formDoc(owner), assessmentForm()))

    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertFails(updateDoc(formDoc(admin), {
      clinicianNotes: 'x'.repeat(2001),
      updatedAt: serverTimestamp(),
    }))
  })
})

describe('patients/{uid} catch-all stays read-only', () => {
  const strayRef = (db: unknown) => doc(db as never, `patients/${PATIENT}/somethingElse/doc-1`)

  it('denies the owner writing an unmatched subcollection', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(strayRef(db), { anything: true }))
  })

  it('denies an admin writing an unmatched subcollection', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertFails(setDoc(strayRef(db), { anything: true }))
  })

  it('still lets the owner and admin read', async () => {
    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(getDoc(strayRef(owner)))
    await assertSucceeds(getDoc(strayRef(admin)))
  })

  it('denies an admin bypassing the favourite caps', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertFails(setDoc(favouriteDoc(db, ADMIN), favourite({ userId: ADMIN, excerpt: 'x'.repeat(2001) })))
  })
})

// "Check your motion" feature: per-patient motion capture sessions, scored against
// admin-authored joint-angle targets per exercise.

function motionSession(overrides: Record<string, unknown> = {}) {
  return {
    exerciseId: 'squat',
    recordedAt: serverTimestamp(),
    jointAngles: { knee: 92, hip: 88 },
    score: 76,
    ...overrides,
  }
}

function motionTarget(overrides: Record<string, unknown> = {}) {
  return {
    exerciseId: 'squat',
    minAngle: 70,
    maxAngle: 170,
    jointName: 'knee',
    ...overrides,
  }
}

describe('patients/{uid}/people/{personId}/motionSessions', () => {
  const sessionDoc = (db: unknown, uid = PATIENT) =>
    doc(db as never, `patients/${uid}/people/${PERSON}/motionSessions/session-1`)

  it('lets the owning patient write a motion session', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(sessionDoc(db), motionSession()))
  })

  it('lets the owning patient read their motion session', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await setDoc(sessionDoc(admin), motionSession())

    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(getDoc(sessionDoc(db)))
  })

  it('lets an admin read and write a motion session', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(sessionDoc(db), motionSession()))
    await assertSucceeds(getDoc(sessionDoc(db)))
  })

  it('denies another signed-in patient reading or writing', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await setDoc(sessionDoc(admin), motionSession())

    const db = testEnv.authenticatedContext(OTHER).firestore()
    await assertFails(getDoc(sessionDoc(db)))
    await assertFails(setDoc(sessionDoc(db, PATIENT), motionSession()))
  })

  it('denies an unauthenticated write', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(setDoc(sessionDoc(db), motionSession()))
  })
})

describe('exerciseMotionTargets', () => {
  const targetDoc = (db: unknown) => doc(db as never, 'exerciseMotionTargets/squat')

  it('lets any signed-in user read', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await setDoc(targetDoc(admin), motionTarget())

    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(getDoc(targetDoc(db)))
  })

  it('denies an unauthenticated read', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await setDoc(targetDoc(admin), motionTarget())

    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(targetDoc(db)))
  })

  it('lets an admin create, update and delete', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(targetDoc(db), motionTarget()))
    await assertSucceeds(setDoc(targetDoc(db), motionTarget({ maxAngle: 175 })))
    await assertSucceeds(deleteDoc(targetDoc(db)))
  })

  it('denies a non-admin signed-in user writing', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(targetDoc(db), motionTarget()))
  })
})

describe('patients/{uid}/people/{personId}/goals (admin-set daily streak goal)', () => {
  const PERSON = 'person-1'
  const goalDoc = (db: unknown, uid = PATIENT) =>
    doc(db as never, `patients/${uid}/people/${PERSON}/goals/current`)
  const goal = (overrides: Record<string, unknown> = {}) => ({
    streakTarget: 14,
    updatedBy: ADMIN,
    updatedAt: serverTimestamp(),
    ...overrides,
  })

  it('lets the owner read their own goal', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(goalDoc(admin), goal()))

    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(getDoc(goalDoc(owner)))
  })

  it('denies the owner writing their own goal', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(goalDoc(db), goal()))
  })

  it('lets an admin create and update the goal', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(goalDoc(db), goal()))
    await assertSucceeds(setDoc(goalDoc(db), goal({ streakTarget: 21 }), { merge: true }))
  })

  it('denies a different signed-in user reading the goal', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(goalDoc(admin), goal()))

    const other = testEnv.authenticatedContext(OTHER).firestore()
    await assertFails(getDoc(goalDoc(other)))
  })

  it('denies an admin write with streakTarget 0', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertFails(setDoc(goalDoc(db), goal({ streakTarget: 0 })))
  })

  it('denies an admin write with a negative streakTarget', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertFails(setDoc(goalDoc(db), goal({ streakTarget: -3 })))
  })

  it('denies an admin write with a non-integer streakTarget', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertFails(setDoc(goalDoc(db), goal({ streakTarget: 3.5 })))
  })

  it('allows an admin write with a valid streakTarget', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(goalDoc(db), goal({ streakTarget: 7 })))
  })

  it('allows an admin write that includes a valid painCheckinInterval', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(goalDoc(db), goal({ streakTarget: 18, painCheckinInterval: 3 })))
  })

  it('allows an admin write that explicitly clears painCheckinInterval to null', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(goalDoc(db), goal({ streakTarget: 18, painCheckinInterval: null })))
  })

  it('denies painCheckinInterval equal to 1', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertFails(setDoc(goalDoc(db), goal({ streakTarget: 18, painCheckinInterval: 1 })))
  })

  it('denies painCheckinInterval equal to streakTarget', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertFails(setDoc(goalDoc(db), goal({ streakTarget: 18, painCheckinInterval: 18 })))
  })

  it('denies painCheckinInterval that does not evenly divide streakTarget', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertFails(setDoc(goalDoc(db), goal({ streakTarget: 18, painCheckinInterval: 5 })))
  })
})

describe('patients/{uid}/people/{personId}/painCheckins (doctor-interval pain checkpoints)', () => {
  const PERSON = 'person-1'
  const checkinDoc = (db: unknown, id = '0_3', uid = PATIENT) =>
    doc(db as never, `patients/${uid}/people/${PERSON}/painCheckins/${id}`)
  const pendingCheckin = (overrides: Record<string, unknown> = {}) => ({
    runNumber: 0,
    streakDay: 3,
    status: 'pending',
    createdAt: serverTimestamp(),
    ...overrides,
  })

  it('lets an admin create a pending checkpoint', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(db), pendingCheckin()))
  })

  it('denies a patient creating a checkpoint directly', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(checkinDoc(db), pendingCheckin()))
  })

  it('lets the owner read their own checkpoints', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(admin), pendingCheckin()))

    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(getDoc(checkinDoc(owner)))
  })

  it('denies a different signed-in user reading the checkpoint', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(admin), pendingCheckin()))

    const other = testEnv.authenticatedContext(OTHER).firestore()
    await assertFails(getDoc(checkinDoc(other)))
  })

  it('lets the owner log a valid score against their own pending checkpoint', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(admin), pendingCheckin()))

    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(
      updateDoc(checkinDoc(owner), {
        status: 'logged',
        score: 4,
        note: 'sharp twinge',
        loggedAt: serverTimestamp(),
      })
    )
  })

  it('denies the owner logging a score outside 0-10', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(admin), pendingCheckin()))

    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(
      updateDoc(checkinDoc(owner), {
        status: 'logged',
        score: 11,
        note: '',
        loggedAt: serverTimestamp(),
      })
    )
  })

  it('denies the owner updating a checkpoint that is already logged', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(
      setDoc(checkinDoc(admin), pendingCheckin({ status: 'logged', score: 2, note: '', loggedAt: serverTimestamp() }))
    )

    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(
      updateDoc(checkinDoc(owner), { status: 'logged', score: 9, note: '', loggedAt: serverTimestamp() })
    )
  })

  it('denies the owner updating a checkpoint that is already missed', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(admin), pendingCheckin({ status: 'missed' })))

    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(
      updateDoc(checkinDoc(owner), { status: 'logged', score: 5, note: '', loggedAt: serverTimestamp() })
    )
  })

  it('denies the owner writing extra fields not in the allowed set', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(admin), pendingCheckin()))

    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(
      updateDoc(checkinDoc(owner), {
        status: 'logged',
        score: 4,
        note: '',
        loggedAt: serverTimestamp(),
        runNumber: 99,
      })
    )
  })

  it('lets an admin delete a checkpoint', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(db), pendingCheckin()))
    await assertSucceeds(deleteDoc(checkinDoc(db)))
  })
})

describe('patients/{uid}/people/{personId}/patientExerciseVideos (patient-added YouTube link)', () => {
  const PERSON = 'person-1'
  const videoDoc = (db: unknown, uid = PATIENT) =>
    doc(db as never, `patients/${uid}/people/${PERSON}/patientExerciseVideos/ex-1`)
  const video = (overrides: Record<string, unknown> = {}) => ({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    updatedAt: serverTimestamp(),
    ...overrides,
  })

  it('lets the owner write their own link', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(videoDoc(db), video()))
  })

  it('lets the owner read and remove their own link', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(videoDoc(db), video()))
    await assertSucceeds(getDoc(videoDoc(db)))
    await assertSucceeds(deleteDoc(videoDoc(db)))
  })

  it('denies a different signed-in user reading or writing', async () => {
    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(videoDoc(owner), video()))

    const other = testEnv.authenticatedContext(OTHER).firestore()
    await assertFails(setDoc(videoDoc(other), video()))
    await assertFails(getDoc(videoDoc(other)))
  })

  it('denies unauthenticated writes', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(setDoc(videoDoc(db), video()))
  })

  it('lets an admin read the link', async () => {
    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(videoDoc(owner), video()))

    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(getDoc(videoDoc(admin)))
  })

  it('denies a javascript: url', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(videoDoc(db), video({ url: 'javascript:alert(1)' })))
  })

  it('denies a non-YouTube https url', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(videoDoc(db), video({ url: 'https://vimeo.com/12345' })))
  })

  it('allows a valid youtu.be url', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(videoDoc(db), video({ url: 'https://youtu.be/dQw4w9WgXcQ' })))
  })
})

describe('patients/{uid}/followUps (admin-scheduled follow-up)', () => {
  const followUpDoc = (db: unknown, uid = PATIENT) =>
    doc(db as never, `patients/${uid}/followUps/follow-up-1`)
  const followUp = (overrides: Record<string, unknown> = {}) => ({
    dueDate: '2026-08-12',
    note: 'Check knee progress',
    service: 'Physiotherapy',
    personId: PATIENT,
    createdBy: ADMIN,
    createdAt: serverTimestamp(),
    ...overrides,
  })

  it('lets the owner read their own follow-up', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(followUpDoc(admin), followUp()))

    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(getDoc(followUpDoc(owner)))
  })

  it('denies the owner writing their own follow-up', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(followUpDoc(db), followUp()))
  })

  it('lets an admin create, update, and delete a follow-up', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(followUpDoc(db), followUp()))
    await assertSucceeds(setDoc(followUpDoc(db), followUp({ note: 'Updated note' }), { merge: true }))
    await assertSucceeds(deleteDoc(followUpDoc(db)))
  })

  it('denies a different signed-in user reading the follow-up', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(followUpDoc(admin), followUp()))

    const other = testEnv.authenticatedContext(OTHER).firestore()
    await assertFails(getDoc(followUpDoc(other)))
  })

  it('denies unauthenticated reads and writes', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(followUpDoc(db)))
    await assertFails(setDoc(followUpDoc(db), followUp()))
  })

  it('denies an admin write with an over-long note', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertFails(setDoc(followUpDoc(db), followUp({ note: 'x'.repeat(2001) })))
  })

  it('denies an admin write with a non-string dueDate', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertFails(setDoc(followUpDoc(db), followUp({ dueDate: 20260812 })))
  })

  it('allows an admin write with a valid dueDate and note', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(followUpDoc(db), followUp()))
  })
})

describe('patientAddresses', () => {
  const addr = (overrides: Record<string, unknown> = {}) => ({
    ownerUid: PATIENT,
    label: 'Home',
    line: '1 High Street',
    postcode: 'G31 4HS',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  })
  const ref = (db: unknown) => doc(db as never, 'patientAddresses/addr-1')

  it('lets the owner create, read, update and delete', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(ref(db), addr()))
    await assertSucceeds(getDoc(ref(db)))
    await assertSucceeds(updateDoc(ref(db), { label: 'Flat', updatedAt: serverTimestamp() }))
    await assertSucceeds(deleteDoc(ref(db)))
  })

  it('lets an anonymous-auth user touch only their own', async () => {
    const anon = testEnv
      .authenticatedContext('anon-uid', { firebase: { sign_in_provider: 'anonymous' } })
      .firestore()
    await assertSucceeds(setDoc(ref(anon), addr({ ownerUid: 'anon-uid' })))
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as never, 'patientAddresses/other'), addr())
    })
    await assertFails(getDoc(doc(anon as never, 'patientAddresses/other')))
    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(getDoc(ref(owner)))
  })

  it('denies another user reading or writing it', async () => {
    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(ref(owner), addr()))
    const other = testEnv.authenticatedContext(OTHER).firestore()
    await assertFails(getDoc(ref(other)))
    await assertFails(updateDoc(ref(other), { label: 'x' }))
    await assertFails(deleteDoc(ref(other)))
  })

  it('denies unauthenticated access', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(setDoc(ref(db), addr()))
  })

  it('rejects invalid documents', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(ref(db), addr({ line: 'x'.repeat(121) })))
    await assertFails(setDoc(ref(db), addr({ label: 'x'.repeat(41) })))
    await assertFails(setDoc(ref(db), addr({ extra: 1 })))
    await assertFails(setDoc(ref(db), addr({ ownerUid: OTHER })))
  })

  it('allows listing only your own addresses', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as never, 'patientAddresses/addr-1'), addr())
    })
    const own = testEnv.authenticatedContext(PATIENT).firestore()
    const col = (db: unknown) => collection(db as never, 'patientAddresses')
    await assertSucceeds(getDocs(query(col(own), where('ownerUid', '==', PATIENT))))
    const other = testEnv.authenticatedContext(OTHER).firestore()
    await assertFails(getDocs(query(col(other), where('ownerUid', '==', PATIENT))))
    await assertFails(getDocs(col(other)))
  })

  it('lets an admin read any address', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as never, 'patientAddresses/addr-1'), addr())
    })
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(getDoc(ref(admin)))
  })

  it('rejects invalid values on update', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(ref(db), addr()))
    await assertFails(updateDoc(ref(db), { line: '' }))
    await assertFails(updateDoc(ref(db), { line: 'x'.repeat(121) }))
    await assertFails(updateDoc(ref(db), { postcode: 'G1' }))
    await assertFails(updateDoc(ref(db), { label: 'x'.repeat(41) }))
    await assertFails(updateDoc(ref(db), { extra: 1 }))
  })

  it('pins ownerUid on update', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(ref(db), addr()))
    await assertFails(updateDoc(ref(db), { ownerUid: OTHER }))
  })
})

describe('dependents defaultAddressId', () => {
  const dep = (overrides: Record<string, unknown> = {}) => ({
    ownerId: PATIENT,
    name: 'Child One',
    dob: '2015-01-01',
    relationship: 'child',
    notes: '',
    createdAt: serverTimestamp(),
    ...overrides,
  })
  const ref = (db: unknown) => doc(db as never, 'dependents/dep-1')

  it('allows the owner to set defaultAddressId', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(ref(db), dep()))
    await assertSucceeds(updateDoc(ref(db), { defaultAddressId: 'addr-1' }))
  })

  it("denies a non-owner setting another user's dependent defaultAddressId", async () => {
    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(ref(owner), dep()))
    const other = testEnv.authenticatedContext(OTHER).firestore()
    await assertFails(updateDoc(ref(other), { defaultAddressId: 'addr-1' }))
  })

  it('rejects a 200-char defaultAddressId', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(ref(db), dep()))
    await assertFails(updateDoc(ref(db), { defaultAddressId: 'x'.repeat(200) }))
  })
})

describe('users defaultAddressId', () => {
  const userRef = (db: unknown, uid = PATIENT) => doc(db as never, `users/${uid}`)

  it('lets the account holder set and clear it', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(setDoc(userRef(db), { defaultAddressId: 'addr-1' }, { merge: true }))
    await assertSucceeds(updateDoc(userRef(db), { defaultAddressId: 'addr-2' }))
  })

  it("denies setting another user's", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(userRef(ctx.firestore()), { name: 'Pat' })
    })
    const other = testEnv.authenticatedContext(OTHER).firestore()
    await assertFails(updateDoc(userRef(other), { defaultAddressId: 'addr-1' }))
    await assertFails(setDoc(userRef(other), { defaultAddressId: 'addr-1' }, { merge: true }))
  })
})

// Carer access (lib/carer-access.ts): an admin lists a second person's email in
// patients/{uid}.carerEmails; that person, signed in with their OWN verified
// email, may act on the patient's own recovery record and nothing else.
describe('carer access', () => {
  const CARER = 'carer-uid'
  const CARER_EMAIL = 'carer@example.com'
  const DEP = 'dep-1'
  const PATIENT_DOC = `patients/${PATIENT}`
  const SELF = `patients/${PATIENT}/people/${PATIENT}`
  const DEPENDENT = `patients/${PATIENT}/people/${DEP}`
  const AT = Timestamp.fromDate(new Date('2026-11-14T09:00:00Z'))

  const carerDb = (tokenOptions: Record<string, unknown> = {}) =>
    testEnv
      .authenticatedContext(CARER, { email: CARER_EMAIL, email_verified: true, ...tokenOptions })
      .firestore()
  const ownerDb = () =>
    testEnv.authenticatedContext(PATIENT, { email: 'patient@example.com', email_verified: true }).firestore()
  const adminDb = () => testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
  const at = (db: unknown, p: string) => doc(db as never, p)
  const list = (db: unknown, p: string) => getDocs(query(collection(db as never, p), orderBy('__name__')))

  async function seed(docs: Record<string, Record<string, unknown>>) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore()
      for (const [p, data] of Object.entries(docs)) await setDoc(doc(db as never, p), data)
    })
  }

  async function readRaw(p: string) {
    let data: Record<string, unknown> | undefined
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      data = (await getDoc(doc(ctx.firestore() as never, p))).data()
    })
    return data
  }

  const seedPatient = (data: Record<string, unknown> = { name: 'Pat', carerEmails: [CARER_EMAIL] }) =>
    seed({ [PATIENT_DOC]: data })

  // The 8 recovery subcollections a carer may read, with a doc in each.
  const GRANTED: Record<string, [string, Record<string, unknown>]> = {
    clinicalAssessments: ['2026-11-14', { painScore: 4, mobilityScore: 6, physioNotes: '', sessionId: 's1' }],
    painLogs: ['2026-11-14', { score: 3, note: '', loggedAt: AT }],
    assignedExercises: ['ex1', { assignedBy: ADMIN, active: true }],
    patientExerciseVideos: ['ex1', { url: 'https://youtu.be/dQw4w9WgXcQ' }],
    exerciseLogs: ['2026-11-14', { completions: { ex1: true }, loggedAt: AT }],
    painCheckins: ['0_3', { runNumber: 0, streakDay: 3, status: 'pending' }],
    motionSessions: ['session-1', { exerciseId: 'squat', score: 76 }],
    goals: ['current', { streakTarget: 7 }],
  }
  const GRANTED_NAMES = Object.keys(GRANTED)

  async function seedRecord(base: string) {
    const docs: Record<string, Record<string, unknown>> = {}
    for (const [name, [id, data]] of Object.entries(GRANTED)) docs[`${base}/${name}/${id}`] = data
    await seed(docs)
  }

  describe('reads on the patient’s own recovery record', () => {
    beforeEach(async () => {
      await seedPatient()
      await seedRecord(SELF)
    })

    it.each(GRANTED_NAMES)('lets the carer get and list %s', async (name) => {
      const [id] = GRANTED[name]
      const db = carerDb()
      await assertSucceeds(getDoc(at(db, `${SELF}/${name}/${id}`)))
      await assertSucceeds(list(db, `${SELF}/${name}`))
      await assertSucceeds(getDocs(collection(db as never, `${SELF}/${name}`)))
    })

    it.each(GRANTED_NAMES)('denies the carer %s on a dependent’s record', async (name) => {
      await seedRecord(DEPENDENT)
      const [id] = GRANTED[name]
      const db = carerDb()
      await assertFails(getDoc(at(db, `${DEPENDENT}/${name}/${id}`)))
      await assertFails(list(db, `${DEPENDENT}/${name}`))
    })

    it('still lets the owner and admin read every granted collection', async () => {
      for (const name of GRANTED_NAMES) {
        await assertSucceeds(list(ownerDb(), `${SELF}/${name}`))
        await assertSucceeds(list(adminDb(), `${SELF}/${name}`))
      }
    })

    it('denies a different signed-in user who is not a carer', async () => {
      const other = testEnv.authenticatedContext(OTHER, { email: 'other@example.com', email_verified: true }).firestore()
      await assertFails(getDoc(at(other, `${SELF}/painLogs/2026-11-14`)))
      await assertFails(list(other, `${SELF}/painLogs`))
    })

    it('denies an unauthenticated read', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(getDoc(at(db, `${SELF}/painLogs/2026-11-14`)))
    })
  })

  describe('reads a carer never gets', () => {
    beforeEach(async () => {
      await seedPatient()
      await seed({
        [`${SELF}`]: { name: 'Pat' },
        [`${SELF}/assessmentForms/form-1`]: { reviewStatus: 'awaiting_review' },
        [`${SELF}/somethingNew/doc-1`]: { anything: true },
        [`${PATIENT_DOC}/notifications/n1`]: { title: 'Hi', read: false },
        [`${PATIENT_DOC}/followUps/f1`]: { dueDate: '2026-11-20', note: '' },
        [`${PATIENT_DOC}/uploads/u1`]: { fileName: 'referral.pdf' },
        [`${PATIENT_DOC}/favoriteBlogs/knee-pain-guide`]: { slug: 'knee-pain-guide' },
        [`${PATIENT_DOC}/chatSessions/c1`]: { messages: [] },
        [`${DEPENDENT}`]: { name: 'Child' },
        [`${DEPENDENT}/assessmentForms/form-1`]: { reviewStatus: 'awaiting_review' },
        'admin/clinicalHistory/entries/x': { patientUid: PATIENT, note: 'sensitive' },
        'bookings/b1': { email: 'patient@example.com', bookedBy: PATIENT },
        'payments/p1': { amount: 8000, uid: PATIENT },
      })
    })

    it.each([
      PATIENT_DOC,
      `${SELF}`,
      `${SELF}/assessmentForms/form-1`,
      `${SELF}/somethingNew/doc-1`,
      `${PATIENT_DOC}/notifications/n1`,
      `${PATIENT_DOC}/followUps/f1`,
      `${PATIENT_DOC}/uploads/u1`,
      `${PATIENT_DOC}/favoriteBlogs/knee-pain-guide`,
      `${PATIENT_DOC}/chatSessions/c1`,
      `${DEPENDENT}`,
      `${DEPENDENT}/assessmentForms/form-1`,
      'admin/clinicalHistory/entries/x',
      'bookings/b1',
      'payments/p1',
    ])('denies the carer reading %s', async (p) => {
      await assertFails(getDoc(at(carerDb(), p)))
    })

    it.each([
      `${SELF}/assessmentForms`,
      `${PATIENT_DOC}/notifications`,
      `${PATIENT_DOC}/followUps`,
      `${PATIENT_DOC}/uploads`,
      `${PATIENT_DOC}/favoriteBlogs`,
      `${PATIENT_DOC}/chatSessions`,
      `patients/${PATIENT}/people`,
      'admin/clinicalHistory/entries',
    ])('denies the carer listing %s', async (p) => {
      await assertFails(list(carerDb(), p))
    })

    it('denies the carer querying the patient’s bookings', async () => {
      const db = carerDb()
      await assertFails(getDocs(query(collection(db as never, 'bookings'), where('bookedBy', '==', PATIENT))))
      await assertFails(
        getDocs(query(collection(db as never, 'bookings'), where('email', '==', 'patient@example.com')))
      )
    })

    it('still lets the owner read their own booking (sanity check of the seed)', async () => {
      await assertSucceeds(getDoc(at(ownerDb(), 'bookings/b1')))
    })
  })

  describe('painLogs writes', () => {
    const TODAY = `${SELF}/painLogs/2026-11-15`

    beforeEach(async () => {
      await seedPatient()
    })

    it('lets the carer log today’s score in the logPainScore shape (merge set)', async () => {
      const db = carerDb()
      await assertSucceeds(setDoc(at(db, TODAY), { score: 4, note: 'stiff', loggedAt: serverTimestamp() }, { merge: true }))
    })

    it('lets the carer update an existing log', async () => {
      await seed({ [TODAY]: { score: 6, note: '', loggedAt: AT } })
      const db = carerDb()
      await assertSucceeds(setDoc(at(db, TODAY), { score: 3, note: 'better', loggedAt: serverTimestamp() }, { merge: true }))
      await assertSucceeds(updateDoc(at(db, TODAY), { score: 2, note: 'better still', loggedAt: serverTimestamp() }))
    })

    it('rejects an extra field', async () => {
      const db = carerDb()
      await assertFails(
        setDoc(at(db, TODAY), { score: 4, note: '', loggedAt: serverTimestamp(), loggedBy: CARER }, { merge: true })
      )
    })

    it('rejects an out-of-range score and a non-timestamp loggedAt', async () => {
      const db = carerDb()
      await assertFails(setDoc(at(db, TODAY), { score: 11, note: '', loggedAt: serverTimestamp() }))
      await assertFails(setDoc(at(db, TODAY), { score: 4, note: '', loggedAt: '2026-11-15' }))
    })

    it('denies the carer deleting a log', async () => {
      await seed({ [TODAY]: { score: 6, note: '', loggedAt: AT } })
      await assertFails(deleteDoc(at(carerDb(), TODAY)))
    })

    it('denies the carer writing a dependent’s pain log', async () => {
      await assertFails(
        setDoc(at(carerDb(), `${DEPENDENT}/painLogs/2026-11-15`), { score: 4, note: '', loggedAt: serverTimestamp() })
      )
    })
  })

  describe('exerciseLogs writes', () => {
    const TODAY = `${SELF}/exerciseLogs/2026-11-15`

    beforeEach(async () => {
      await seedPatient()
    })

    it('lets the carer tick an exercise on a new day (toggleExerciseCompletion shape)', async () => {
      const db = carerDb()
      await assertSucceeds(
        setDoc(at(db, TODAY), { completions: { ex1: true }, loggedAt: serverTimestamp() }, { merge: true })
      )
    })

    it('lets the carer tick onto a doc the mobile app wrote extra fields to, keeping them', async () => {
      await seed({ [TODAY]: { completions: {}, loggedAt: AT, mobileField: 'x' } })
      const db = carerDb()
      await assertSucceeds(
        setDoc(at(db, TODAY), { completions: { ex1: true }, loggedAt: serverTimestamp() }, { merge: true })
      )
      await assertSucceeds(
        setDoc(at(db, TODAY), { completions: { ex1: false, ex2: true }, loggedAt: serverTimestamp() }, { merge: true })
      )
      const data = await readRaw(TODAY)
      expect(data?.mobileField).toBe('x')
      expect(data?.completions).toEqual({ ex1: false, ex2: true })
    })

    it('denies the carer changing or dropping a mobile-written field', async () => {
      await seed({ [TODAY]: { completions: {}, loggedAt: AT, mobileField: 'x' } })
      const db = carerDb()
      await assertFails(updateDoc(at(db, TODAY), { mobileField: 'y' }))
      await assertFails(
        setDoc(at(db, TODAY), { completions: { ex1: true }, loggedAt: serverTimestamp(), mobileField: 'y' }, { merge: true })
      )
      // A non-merge set replaces the doc, removing mobileField.
      await assertFails(setDoc(at(db, TODAY), { completions: { ex1: true }, loggedAt: serverTimestamp() }))
    })

    it('rejects a create with an extra field or the wrong types', async () => {
      const db = carerDb()
      await assertFails(setDoc(at(db, TODAY), { completions: {}, loggedAt: serverTimestamp(), mobileField: 'x' }))
      await assertFails(setDoc(at(db, TODAY), { completions: 'all', loggedAt: serverTimestamp() }))
      await assertFails(setDoc(at(db, TODAY), { completions: { ex1: true }, loggedAt: '2026-11-15' }))
    })

    it('denies the carer deleting a log', async () => {
      await seed({ [TODAY]: { completions: { ex1: true }, loggedAt: AT } })
      await assertFails(deleteDoc(at(carerDb(), TODAY)))
    })

    it('denies the carer ticking a dependent’s exercises', async () => {
      await assertFails(
        setDoc(
          at(carerDb(), `${DEPENDENT}/exerciseLogs/2026-11-15`),
          { completions: { ex1: true }, loggedAt: serverTimestamp() },
          { merge: true }
        )
      )
    })
  })

  describe('painCheckins writes', () => {
    const CHECKIN = `${SELF}/painCheckins/0_3`
    const logged = () => ({ status: 'logged', score: 4, note: 'ok', loggedAt: serverTimestamp() })

    beforeEach(async () => {
      await seedPatient()
    })

    it('lets the carer log a score against a pending checkpoint', async () => {
      await seed({ [CHECKIN]: { runNumber: 0, streakDay: 3, status: 'pending' } })
      await assertSucceeds(updateDoc(at(carerDb(), CHECKIN), logged()))
    })

    it('denies the carer touching a checkpoint that is already logged', async () => {
      await seed({ [CHECKIN]: { runNumber: 0, streakDay: 3, status: 'logged', score: 2, note: '', loggedAt: AT } })
      await assertFails(updateDoc(at(carerDb(), CHECKIN), logged()))
    })

    it('denies the carer creating or deleting a checkpoint', async () => {
      const db = carerDb()
      await assertFails(setDoc(at(db, CHECKIN), { runNumber: 0, streakDay: 3, status: 'pending' }))
      await seed({ [CHECKIN]: { runNumber: 0, streakDay: 3, status: 'pending' } })
      await assertFails(deleteDoc(at(db, CHECKIN)))
    })

    it('denies the carer writing extra fields', async () => {
      await seed({ [CHECKIN]: { runNumber: 0, streakDay: 3, status: 'pending' } })
      await assertFails(updateDoc(at(carerDb(), CHECKIN), { ...logged(), runNumber: 99 }))
    })
  })

  describe('collections a carer may only read', () => {
    beforeEach(async () => {
      await seedPatient()
      await seedRecord(SELF)
    })

    const writes: Record<string, [string, Record<string, unknown>]> = {
      assignedExercises: ['ex2', { assignedBy: CARER, active: true }],
      goals: ['current', { streakTarget: 14 }],
      motionSessions: ['session-2', { exerciseId: 'squat', score: 99 }],
      clinicalAssessments: ['2026-11-15', { painScore: 1, mobilityScore: 9, physioNotes: '', sessionId: 's2' }],
      patientExerciseVideos: ['ex1', { url: 'https://youtu.be/dQw4w9WgXcQ' }],
    }

    it.each(Object.keys(writes))('denies the carer creating, updating or deleting %s', async (name) => {
      const [newId, data] = writes[name]
      const [seededId] = GRANTED[name]
      const db = carerDb()
      await assertFails(setDoc(at(db, `${SELF}/${name}/${newId}-new`), data))
      await assertFails(setDoc(at(db, `${SELF}/${name}/${seededId}`), data, { merge: true }))
      await assertFails(deleteDoc(at(db, `${SELF}/${name}/${seededId}`)))
    })
  })

  describe('who counts as a carer', () => {
    const LOG = `${SELF}/painLogs/2026-11-14`
    const write = (db: unknown) =>
      setDoc(at(db, `${SELF}/painLogs/2026-11-15`), { score: 4, note: '', loggedAt: serverTimestamp() })

    beforeEach(async () => {
      await seed({ [LOG]: { score: 3, note: '', loggedAt: AT } })
    })

    it('denies a carer whose email is not verified', async () => {
      await seedPatient()
      const db = carerDb({ email_verified: false })
      await assertFails(getDoc(at(db, LOG)))
      await assertFails(write(db))
    })

    it('denies a token with no email_verified claim', async () => {
      await seedPatient()
      const db = testEnv.authenticatedContext(CARER, { email: CARER_EMAIL }).firestore()
      await assertFails(getDoc(at(db, LOG)))
    })

    it('denies a token with no email at all', async () => {
      await seedPatient()
      const db = testEnv.authenticatedContext(CARER).firestore()
      await assertFails(getDoc(at(db, LOG)))
      await assertFails(write(db))
    })

    it('denies a verified email that is not on the list', async () => {
      await seedPatient()
      const db = carerDb({ email: 'stranger@example.com' })
      await assertFails(getDoc(at(db, LOG)))
      await assertFails(write(db))
    })

    it('allows the listed email in a different case (token email is lower-cased)', async () => {
      await seedPatient()
      const db = carerDb({ email: 'CARER@Example.com' })
      await assertSucceeds(getDoc(at(db, LOG)))
      await assertSucceeds(write(db))
    })

    it('denies once the carer is revoked (no carerEmails on the patient doc)', async () => {
      await seedPatient({ name: 'Pat' })
      const db = carerDb()
      await assertFails(getDoc(at(db, LOG)))
      await assertFails(write(db))
    })

    it('denies once the carer is revoked (empty carerEmails)', async () => {
      await seedPatient({ name: 'Pat', carerEmails: [] })
      await assertFails(getDoc(at(carerDb(), LOG)))
    })

    it('denies when there is no patient doc at all', async () => {
      const db = carerDb()
      await assertFails(getDoc(at(db, LOG)))
      await assertFails(list(db, `${SELF}/painLogs`))
      await assertFails(write(db))
    })

    it('denies a carer of one patient on another patient’s record', async () => {
      await seedPatient()
      await seed({
        [`patients/${OTHER}`]: { name: 'Someone else', carerEmails: ['someone@example.com'] },
        [`patients/${OTHER}/people/${OTHER}/painLogs/2026-11-14`]: { score: 3, note: '', loggedAt: AT },
      })
      await assertFails(getDoc(at(carerDb(), `patients/${OTHER}/people/${OTHER}/painLogs/2026-11-14`)))
    })
  })

  describe('patients/{uid} carerEmails', () => {
    it('lets the owner update other fields while keeping carerEmails', async () => {
      await seedPatient()
      const db = ownerDb()
      await assertSucceeds(updateDoc(at(db, PATIENT_DOC), { name: 'Pat Smith' }))
      await assertSucceeds(setDoc(at(db, PATIENT_DOC), { phone: '07123456789' }, { merge: true }))
      await assertSucceeds(setDoc(at(db, PATIENT_DOC), { name: 'Pat', carerEmails: [CARER_EMAIL] }, { merge: true }))
    })

    it('lets the owner update a doc that has no carerEmails', async () => {
      await seedPatient({ name: 'Pat' })
      await assertSucceeds(updateDoc(at(ownerDb(), PATIENT_DOC), { name: 'Pat Smith' }))
    })

    it('lets the owner remove a carer', async () => {
      await seedPatient({ name: 'Pat', carerEmails: [CARER_EMAIL, 'second@example.com'] })
      const db = ownerDb()
      await assertSucceeds(updateDoc(at(db, PATIENT_DOC), { carerEmails: arrayRemove('second@example.com') }))
      await assertSucceeds(updateDoc(at(db, PATIENT_DOC), { carerEmails: [] }))
      expect((await readRaw(PATIENT_DOC))?.carerEmails).toEqual([])
    })

    it('denies the owner adding a carer', async () => {
      await seedPatient()
      const db = ownerDb()
      await assertFails(updateDoc(at(db, PATIENT_DOC), { carerEmails: [CARER_EMAIL, 'new@example.com'] }))
      await assertFails(updateDoc(at(db, PATIENT_DOC), { carerEmails: arrayUnion('new@example.com') }))
      await assertFails(updateDoc(at(db, PATIENT_DOC), { carerEmails: ['new@example.com'] }))
      await assertFails(updateDoc(at(db, PATIENT_DOC), { carerEmails: ['CARER@example.com'] }))
    })

    it('denies the owner adding a first carer to a doc that has none', async () => {
      await seedPatient({ name: 'Pat' })
      await assertFails(updateDoc(at(ownerDb(), PATIENT_DOC), { carerEmails: ['new@example.com'] }))
    })

    it('denies the owner replacing carerEmails with a non-list', async () => {
      await seedPatient()
      await assertFails(updateDoc(at(ownerDb(), PATIENT_DOC), { carerEmails: CARER_EMAIL }))
      await assertFails(updateDoc(at(ownerDb(), PATIENT_DOC), { carerEmails: null }))
    })

    it('denies the owner creating the doc with a carer already on it', async () => {
      const db = ownerDb()
      await assertFails(setDoc(at(db, PATIENT_DOC), { name: 'Pat', carerEmails: [CARER_EMAIL] }))
      await assertFails(setDoc(at(db, PATIENT_DOC), { name: 'Pat', carerEmails: CARER_EMAIL }))
    })

    it('lets the owner create the doc in the normal sign-up shape', async () => {
      const db = ownerDb()
      await assertSucceeds(
        setDoc(at(db, PATIENT_DOC), { name: 'Pat', email: 'patient@example.com', createdAt: serverTimestamp() }, { merge: true })
      )
    })

    it('lets the owner create the doc with an empty carerEmails', async () => {
      await assertSucceeds(setDoc(at(ownerDb(), PATIENT_DOC), { name: 'Pat', carerEmails: [] }))
    })

    it('lets an admin set carerEmails', async () => {
      await seedPatient({ name: 'Pat' })
      const db = adminDb()
      await assertSucceeds(updateDoc(at(db, PATIENT_DOC), { carerEmails: [CARER_EMAIL, 'second@example.com'] }))
      await assertSucceeds(updateDoc(at(db, PATIENT_DOC), { carerEmails: ['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com', 'e@x.com'] }))
    })

    it('rejects a list of 6 even for an admin', async () => {
      await seedPatient({ name: 'Pat' })
      const six = ['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com', 'e@x.com', 'f@x.com']
      await assertFails(updateDoc(at(adminDb(), PATIENT_DOC), { carerEmails: six }))
    })

    it('denies the carer updating or reading the patient doc', async () => {
      await seedPatient()
      const db = carerDb()
      await assertFails(updateDoc(at(db, PATIENT_DOC), { name: 'Hijacked' }))
      await assertFails(updateDoc(at(db, PATIENT_DOC), { carerEmails: [CARER_EMAIL, 'friend@example.com'] }))
      await assertFails(setDoc(at(db, PATIENT_DOC), { carerEmails: [] }, { merge: true }))
      await assertFails(getDoc(at(db, PATIENT_DOC)))
    })

    it('denies another patient writing the doc', async () => {
      await seedPatient()
      const other = testEnv.authenticatedContext(OTHER).firestore()
      await assertFails(updateDoc(at(other, PATIENT_DOC), { carerEmails: [] }))
      await assertFails(setDoc(at(other, `patients/${OTHER}`), { name: 'O', carerEmails: [CARER_EMAIL] }))
    })
  })
})
