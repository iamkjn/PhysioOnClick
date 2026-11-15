import { readFileSync } from 'node:fs'
import path from 'node:path'

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { getBytes, getMetadata, uploadString } from 'firebase/storage'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

// storage.rules, with the focus on carer access (lib/carer-access.ts): carer
// access deliberately adds NO Storage grants, and clinical-history/** is closed
// to every client, including the patient it is about and admin clients.

const PATIENT = 'patient-uid'
const CARER = 'carer-uid'
const ADMIN = 'admin-uid'

const FILES = {
  upload: { path: `patient-uploads/${PATIENT}/x.pdf`, contentType: 'application/pdf' },
  video: { path: `patient-assessment-videos/${PATIENT}/v.mp4`, contentType: 'video/mp4' },
  avatar: { path: `avatars/users/${PATIENT}.jpg`, contentType: 'image/jpeg' },
  invoice: { path: 'invoices/INV-1.pdf', contentType: 'application/pdf' },
  clinical: { path: `clinical-history/${PATIENT}/doc.pdf`, contentType: 'application/pdf' },
}

let testEnv: RulesTestEnvironment

// The context's storage() is a compat instance; its ref()'s delegate is the
// modular StorageReference the modular getBytes/getMetadata/uploadString take.
const fileRef = (ctx: RulesTestContext, p: string) => ctx.storage().ref(p) as never

const carer = () =>
  testEnv.authenticatedContext(CARER, { email: 'carer@example.com', email_verified: true })
const owner = () =>
  testEnv.authenticatedContext(PATIENT, { email: 'patient@example.com', email_verified: true })
const admin = () => testEnv.authenticatedContext(ADMIN, { admin: true })

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'physioonclick',
    storage: {
      rules: readFileSync(path.resolve(__dirname, '../../storage.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  })
})

afterAll(async () => {
  await testEnv?.cleanup()
})

beforeEach(async () => {
  await testEnv.clearStorage()
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    for (const { path: p, contentType } of Object.values(FILES)) {
      await uploadString(fileRef(ctx, p), 'seed', 'raw', { contentType })
    }
  })
})

describe('carer access adds no Storage grants', () => {
  it.each(Object.values(FILES).map((f) => f.path))('denies the carer reading %s', async (p) => {
    const ctx = carer()
    await assertFails(getBytes(fileRef(ctx, p)))
    await assertFails(getMetadata(fileRef(ctx, p)))
  })

  it('denies the carer uploading into the patient’s folders', async () => {
    const ctx = carer()
    await assertFails(
      uploadString(fileRef(ctx, `patient-uploads/${PATIENT}/new.pdf`), 'x', 'raw', { contentType: 'application/pdf' })
    )
    await assertFails(
      uploadString(fileRef(ctx, `clinical-history/${PATIENT}/new.pdf`), 'x', 'raw', { contentType: 'application/pdf' })
    )
  })
})

describe('patient owner', () => {
  it('can read their own patient-uploads file', async () => {
    const ctx = owner()
    await assertSucceeds(getBytes(fileRef(ctx, FILES.upload.path)))
    await assertSucceeds(getMetadata(fileRef(ctx, FILES.upload.path)))
  })

  it('cannot read or write their own clinical history', async () => {
    const ctx = owner()
    await assertFails(getBytes(fileRef(ctx, FILES.clinical.path)))
    await assertFails(getMetadata(fileRef(ctx, FILES.clinical.path)))
    await assertFails(
      uploadString(fileRef(ctx, FILES.clinical.path), 'x', 'raw', { contentType: 'application/pdf' })
    )
    await assertFails(
      uploadString(fileRef(ctx, `clinical-history/${PATIENT}/new.pdf`), 'x', 'raw', { contentType: 'application/pdf' })
    )
  })

  it('cannot read or write invoices', async () => {
    const ctx = owner()
    await assertFails(getBytes(fileRef(ctx, FILES.invoice.path)))
    await assertFails(getMetadata(fileRef(ctx, FILES.invoice.path)))
    await assertFails(
      uploadString(fileRef(ctx, 'invoices/INV-2.pdf'), 'x', 'raw', { contentType: 'application/pdf' })
    )
  })
})

describe('admin client', () => {
  it('cannot read or write clinical history (server-side only)', async () => {
    const ctx = admin()
    await assertFails(getBytes(fileRef(ctx, FILES.clinical.path)))
    await assertFails(getMetadata(fileRef(ctx, FILES.clinical.path)))
    await assertFails(
      uploadString(fileRef(ctx, `clinical-history/${PATIENT}/new.pdf`), 'x', 'raw', { contentType: 'application/pdf' })
    )
  })

  it('can still read a patient upload (sanity check of the seed and admin token)', async () => {
    await assertSucceeds(getMetadata(fileRef(admin(), FILES.upload.path)))
  })
})
