import { readFileSync } from 'node:fs'
import path from 'node:path'

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

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
