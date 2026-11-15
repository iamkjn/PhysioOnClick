import { act, render, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { PersonProvider, usePatientTarget, usePerson } from '@/components/person-provider'

const KEY = 'pooc:activePerson'

function wrapper({ children }: { children: ReactNode }) {
  return <PersonProvider>{children}</PersonProvider>
}

function useBoth(authUid: string | null) {
  return { ctx: usePerson()!, target: usePatientTarget(authUid, 'Krunal Nayak') }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('PersonProvider carer mode', () => {
  it('starts on self, and reports no stored choice once hydrated', async () => {
    const { result } = renderHook(() => useBoth('carer'), { wrapper })
    await waitFor(() => expect(result.current.ctx.hasStoredChoice).toBe(false))
    expect(result.current.target).toEqual({ ownerUid: 'carer', personId: 'carer', mode: 'self', name: 'Krunal Nayak' })
  })

  it('setCareFor resolves the target to the patient’s own record and persists it', async () => {
    const { result } = renderHook(() => useBoth('carer'), { wrapper })
    await waitFor(() => expect(result.current.ctx.hasStoredChoice).toBe(false))

    act(() => result.current.ctx.setCareFor('patient-1', 'mary smith', 'carer'))

    expect(result.current.target).toEqual({
      ownerUid: 'patient-1',
      personId: 'patient-1',
      mode: 'carer',
      name: 'Mary Smith',
    })
    expect(result.current.ctx.personId).toBeNull()
    expect(result.current.ctx.hasStoredChoice).toBe(true)
    expect(JSON.parse(window.localStorage.getItem(KEY)!)).toMatchObject({
      careForUid: 'patient-1',
      careForViewerUid: 'carer',
      personId: null,
    })
  })

  it('setPerson leaves carer mode', async () => {
    const { result } = renderHook(() => useBoth('carer'), { wrapper })
    act(() => result.current.ctx.setCareFor('patient-1', 'Mary', 'carer'))
    act(() => result.current.ctx.setPerson('dep-1', 'Kid'))
    expect(result.current.target).toMatchObject({ ownerUid: 'carer', personId: 'dep-1', mode: 'dependent' })
    expect(result.current.ctx.careForUid).toBeNull()
  })

  it('hydrates a saved carer selection after mount', async () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ personId: null, personName: '', careForUid: 'patient-1', careForName: 'Mary', careForViewerUid: 'carer' })
    )
    const { result } = renderHook(() => useBoth('carer'), { wrapper })
    await waitFor(() => expect(result.current.target?.mode).toBe('carer'))
    expect(result.current.ctx.hasStoredChoice).toBe(true)
  })

  it('ignores a saved carer selection made by another account', async () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ personId: null, personName: '', careForUid: 'patient-1', careForName: 'Mary', careForViewerUid: 'carer' })
    )
    const { result } = renderHook(() => useBoth('someone-else'), { wrapper })
    await waitFor(() => expect(result.current.ctx.careForUid).toBe('patient-1'))
    expect(result.current.target).toMatchObject({ ownerUid: 'someone-else', mode: 'self' })
  })

  it('reconcileCareFor drops carer mode once access is removed', async () => {
    const { result } = renderHook(() => useBoth('carer'), { wrapper })
    act(() => result.current.ctx.setCareFor('patient-1', 'Mary', 'carer'))

    act(() => result.current.ctx.reconcileCareFor('carer', ['patient-1']))
    expect(result.current.target?.mode).toBe('carer')

    act(() => result.current.ctx.reconcileCareFor('carer', []))
    expect(result.current.target).toMatchObject({ ownerUid: 'carer', mode: 'self' })
    expect(JSON.parse(window.localStorage.getItem(KEY)!).careForUid).toBeNull()
  })

  it('the dependent reconcile guard leaves carer mode alone', async () => {
    const { result } = renderHook(() => useBoth('carer'), { wrapper })
    act(() => result.current.ctx.setCareFor('patient-1', 'Mary', 'carer'))
    act(() => result.current.ctx.reconcile('carer', []))
    expect(result.current.target?.mode).toBe('carer')
  })

  it('usePatientTarget is null until signed in', () => {
    const { result } = renderHook(() => usePatientTarget(null), { wrapper })
    expect(result.current).toBeNull()
  })

  it('still renders children without storage', () => {
    const { getByText } = render(
      <PersonProvider>
        <span>child</span>
      </PersonProvider>
    )
    expect(getByText('child')).toBeInTheDocument()
  })
})
