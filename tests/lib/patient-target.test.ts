import { describe, expect, it } from 'vitest'

import {
  carerOptionValue,
  parseCarerOptionValue,
  resolvePatientTarget,
} from '@/lib/patient-target'

describe('resolvePatientTarget', () => {
  it('defaults to the signed-in user’s own record', () => {
    expect(resolvePatientTarget('me', null)).toEqual({ ownerUid: 'me', personId: 'me', mode: 'self' })
    expect(resolvePatientTarget('me', { personId: null, careForUid: null })).toEqual({
      ownerUid: 'me',
      personId: 'me',
      mode: 'self',
    })
  })

  it('treats personId === authUid as self', () => {
    expect(resolvePatientTarget('me', { personId: 'me', careForUid: null }).mode).toBe('self')
  })

  it('keeps a dependent inside the signed-in account’s own tree', () => {
    expect(resolvePatientTarget('me', { personId: 'dep-1', careForUid: null })).toEqual({
      ownerUid: 'me',
      personId: 'dep-1',
      mode: 'dependent',
    })
  })

  it('carer mode targets the patient’s OWN record in the patient’s tree', () => {
    expect(
      resolvePatientTarget('carer', { personId: null, careForUid: 'patient-1', careForViewerUid: 'carer' })
    ).toEqual({ ownerUid: 'patient-1', personId: 'patient-1', mode: 'carer' })
  })

  it('carer mode wins over a stale dependent id, and never targets the patient’s dependents', () => {
    const t = resolvePatientTarget('carer', { personId: 'dep-1', careForUid: 'patient-1', careForViewerUid: 'carer' })
    expect(t.ownerUid).toBe('patient-1')
    expect(t.personId).toBe('patient-1')
  })

  it('ignores a carer selection saved by a different account on this browser', () => {
    expect(
      resolvePatientTarget('someone-else', { personId: null, careForUid: 'patient-1', careForViewerUid: 'carer' })
    ).toEqual({ ownerUid: 'someone-else', personId: 'someone-else', mode: 'self' })
  })

  it('accepts a carer selection with no recorded viewer (older stored value)', () => {
    expect(resolvePatientTarget('carer', { personId: null, careForUid: 'patient-1' }).mode).toBe('carer')
  })

  it('caring for yourself is just self', () => {
    expect(resolvePatientTarget('me', { personId: null, careForUid: 'me', careForViewerUid: 'me' }).mode).toBe('self')
  })
})

describe('carer option values', () => {
  it('round-trips', () => {
    expect(parseCarerOptionValue(carerOptionValue('patient-1'))).toBe('patient-1')
  })

  it('returns null for plain person ids and an empty carer value', () => {
    expect(parseCarerOptionValue('dep-1')).toBeNull()
    expect(parseCarerOptionValue('carer:')).toBeNull()
  })
})
