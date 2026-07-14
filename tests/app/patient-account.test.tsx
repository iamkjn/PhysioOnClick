import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(() => () => {}),
  signOut: vi.fn(),
}))
vi.mock('@/components/patient-profile-editor', () => ({ PatientProfileEditor: () => null }))
vi.mock('@/components/rehab-programs-section', () => ({ RehabProgramsSection: () => null }))
vi.mock('@/components/saved-blogs-section', () => ({ SavedBlogsSection: () => null }))
vi.mock('@/components/upload-panel', () => ({ UploadPanel: () => null }))

import AccountPage from '@/app/patient/account/page'

describe('AccountPage', () => {
  it('renders a skeleton shell instead of nothing before auth resolves', () => {
    const { container } = render(<AccountPage />)
    expect(container.querySelector('.skeleton, .skeleton-form, .skeleton-row-group')).toBeInTheDocument()
  })
})
