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
