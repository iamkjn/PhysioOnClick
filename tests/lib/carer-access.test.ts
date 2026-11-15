import { describe, expect, it } from 'vitest'

import {
  MAX_CARER_EMAILS,
  carerRelationshipFor,
  normalizeCarerEmail,
  normalizeCarerEmails,
  readCarerContact,
  readCarerEmails,
} from '@/lib/carer-access'

describe('normalizeCarerEmail', () => {
  it('trims and lower-cases (firestore.rules compares token.email.lower())', () => {
    expect(normalizeCarerEmail('  Partner@Example.COM ')).toBe('partner@example.com')
  })

  it('returns "" for non-strings', () => {
    expect(normalizeCarerEmail(undefined)).toBe('')
    expect(normalizeCarerEmail(42)).toBe('')
  })
})

describe('normalizeCarerEmails', () => {
  it('normalises, de-duplicates and drops blanks', () => {
    expect(normalizeCarerEmails(['A@x.com', 'a@x.com ', '', 'b@y.co.uk'])).toEqual({
      emails: ['a@x.com', 'b@y.co.uk'],
      error: null,
    })
  })

  it('rejects an invalid address', () => {
    const r = normalizeCarerEmails(['not-an-email'])
    expect(r.error).toMatch(/not a valid email/)
    expect(r.emails).toEqual([])
  })

  it('rejects the patient’s own email', () => {
    expect(normalizeCarerEmails(['Pat@Example.com'], 'pat@example.com').error).toMatch(/own email/)
  })

  it(`caps the list at ${MAX_CARER_EMAILS}`, () => {
    const many = Array.from({ length: MAX_CARER_EMAILS + 1 }, (_, i) => `c${i}@example.com`)
    expect(normalizeCarerEmails(many).error).toMatch(/at most/)
    expect(normalizeCarerEmails(many.slice(0, MAX_CARER_EMAILS)).error).toBeNull()
  })

  it('rejects a non-list', () => {
    expect(normalizeCarerEmails('a@x.com').error).toMatch(/list/)
  })

  it('allows an empty list (removes every carer)', () => {
    expect(normalizeCarerEmails([])).toEqual({ emails: [], error: null })
  })
})

describe('patient doc readers', () => {
  it('readCarerEmails tolerates missing / malformed data', () => {
    expect(readCarerEmails(undefined)).toEqual([])
    expect(readCarerEmails({ carerEmails: 'x' })).toEqual([])
    expect(readCarerEmails({ carerEmails: ['B@x.com', 7, 'b@x.com'] })).toEqual(['b@x.com'])
  })

  it('readCarerContact reads the existing carerContact field', () => {
    expect(
      readCarerContact({ carerContact: { name: 'Sam', email: 'Sam@X.com', relationship: 'Partner' } })
    ).toEqual({ name: 'Sam', email: 'sam@x.com', relationship: 'Partner' })
    expect(readCarerContact({})).toBeNull()
  })

  it('carerRelationshipFor only answers for the matching carer', () => {
    const data = { carerContact: { name: 'Sam', email: 'sam@x.com', relationship: 'Partner' } }
    expect(carerRelationshipFor(data, 'SAM@x.com')).toBe('Partner')
    expect(carerRelationshipFor(data, 'other@x.com')).toBe('')
    expect(carerRelationshipFor({}, 'sam@x.com')).toBe('')
  })
})
