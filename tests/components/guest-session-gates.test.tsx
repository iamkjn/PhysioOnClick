import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Guest checkout (lib/guest-booking.ts) leaves an anonymous Firebase session
// behind. The /patient gates must still ask it to sign in, and must NOT write
// a users/patients record for it (that only happens when the guest claims an
// account via /auth/verify).

const mocks = vi.hoisted(() => ({
  user: null as unknown,
  ensurePatientRecord: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: unknown) => void) => {
    cb(mocks.user)
    return () => {}
  },
}))
vi.mock('@/lib/patient-account', () => ({ ensurePatientRecord: mocks.ensurePatientRecord }))
vi.mock('@/components/auth-panel', () => ({ AuthPanel: () => <div>Sign-in panel</div> }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }))

import { PatientAuthGate } from '@/components/patient-auth-gate'
import { PatientHome } from '@/components/patient-home'

beforeEach(() => {
  mocks.ensurePatientRecord.mockReset().mockResolvedValue(undefined)
  mocks.replace.mockReset()
})

describe('PatientAuthGate', () => {
  it('asks an anonymous guest-checkout session to sign in', () => {
    mocks.user = { uid: 'anon-1', isAnonymous: true }
    render(<PatientAuthGate />)
    expect(screen.getByText('Sign-in panel')).toBeInTheDocument()
  })

  it('hides the sign-in panel for a real account', () => {
    mocks.user = { uid: 'u-1', isAnonymous: false }
    render(<PatientAuthGate />)
    expect(screen.queryByText('Sign-in panel')).not.toBeInTheDocument()
  })
})

describe('PatientHome', () => {
  it('shows the sign-in panel to a guest session without creating a patient record', () => {
    mocks.user = { uid: 'anon-1', isAnonymous: true }
    render(<PatientHome />)
    expect(screen.getByText('Sign-in panel')).toBeInTheDocument()
    expect(mocks.ensurePatientRecord).not.toHaveBeenCalled()
    expect(mocks.replace).not.toHaveBeenCalled()
  })

  it('still ensures the record and redirects home for a real account', () => {
    mocks.user = { uid: 'u-1', isAnonymous: false }
    render(<PatientHome />)
    expect(mocks.ensurePatientRecord).toHaveBeenCalledWith(mocks.user)
    expect(mocks.replace).toHaveBeenCalledWith('/')
  })
})
