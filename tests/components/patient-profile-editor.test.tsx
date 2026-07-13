import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: null, db: null }))
vi.mock('@/lib/patient-account', () => ({
  ensurePatientRecord: vi.fn().mockResolvedValue(undefined),
  mergePatientProfileDetails: vi.fn(),
}))

import { PatientProfileEditor } from '@/components/patient-profile-editor'

describe('PatientProfileEditor', () => {
  it('shows a skeleton form before auth resolves', async () => {
    render(<PatientProfileEditor />)
    expect(document.querySelector('.skeleton-form')).toBeInTheDocument()
  })
})
