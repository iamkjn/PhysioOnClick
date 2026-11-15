import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestEmailVerification = vi.fn()
const resetCaredForCache = vi.fn()
vi.mock('@/lib/email-verification', () => ({
  requestEmailVerification: (...a: unknown[]) => requestEmailVerification(...a),
}))
vi.mock('@/hooks/use-cared-for-patients', () => ({ resetCaredForCache: () => resetCaredForCache() }))

import { CarerVerifyEmailCard } from '@/components/carer-verify-email-card'

function makeUser(verified = false) {
  return {
    email: 'carer@example.com',
    emailVerified: verified,
    getIdToken: vi.fn(async () => 't'),
    reload: vi.fn(async () => {}),
  }
}

beforeEach(() => {
  requestEmailVerification.mockReset()
  resetCaredForCache.mockClear()
})

describe('CarerVerifyEmailCard', () => {
  it('sends a confirmation link and tells the carer what to do next', async () => {
    requestEmailVerification.mockResolvedValue({ ok: true })
    const user = makeUser()
    render(<CarerVerifyEmailCard user={user} reload={vi.fn()} />)
    expect(screen.getByText('Someone has given you access to help with their recovery.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Email me a confirmation link' }))
    expect(await screen.findByText(/We've sent a link to carer@example.com/)).toBeInTheDocument()
    expect(requestEmailVerification).toHaveBeenCalledWith(user)
  })

  it('"I’ve confirmed it" refreshes the token and reloads once verified', async () => {
    requestEmailVerification.mockResolvedValue({ ok: true })
    const user = makeUser()
    const reload = vi.fn()
    render(<CarerVerifyEmailCard user={user} reload={reload} />)
    fireEvent.click(screen.getByRole('button', { name: 'Email me a confirmation link' }))
    const confirmed = await screen.findByRole('button', { name: 'I’ve confirmed it' })

    user.reload.mockImplementation(async () => { user.emailVerified = true })
    fireEvent.click(confirmed)

    await waitFor(() => expect(reload).toHaveBeenCalled())
    expect(user.getIdToken).toHaveBeenCalledWith(true)
    expect(resetCaredForCache).toHaveBeenCalled()
  })

  it('says so when it is not confirmed yet', async () => {
    requestEmailVerification.mockResolvedValue({ ok: true })
    const user = makeUser()
    const reload = vi.fn()
    render(<CarerVerifyEmailCard user={user} reload={reload} />)
    fireEvent.click(screen.getByRole('button', { name: 'Email me a confirmation link' }))
    fireEvent.click(await screen.findByRole('button', { name: 'I’ve confirmed it' }))
    expect(await screen.findByText(/Not confirmed yet/)).toBeInTheDocument()
    expect(reload).not.toHaveBeenCalled()
  })

  it('shows the server error', async () => {
    requestEmailVerification.mockResolvedValue({ ok: false, error: 'Please wait a minute' })
    render(<CarerVerifyEmailCard user={makeUser()} reload={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Email me a confirmation link' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Please wait a minute')
  })
})
