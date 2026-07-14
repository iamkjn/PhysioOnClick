import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getExerciseLogsMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getExerciseLogs: (...args: unknown[]) => getExerciseLogsMock(...args),
}))

import { AdherenceBar } from '@/components/adherence-bar'

describe('AdherenceBar', () => {
  it('shows a skeleton while loading, then the adherence copy once resolved', async () => {
    let resolveLogs: (v: unknown[]) => void = () => {}
    getExerciseLogsMock.mockReturnValue(new Promise((resolve) => { resolveLogs = resolve }))

    render(<AdherenceBar uid="u1" personId="p1" />)
    expect(document.querySelector('.skeleton')).toBeInTheDocument()

    resolveLogs([{ completions: { a: true } }, { completions: { a: false } }])

    await waitFor(() => {
      expect(screen.getByText(/of 7 days/)).toBeInTheDocument()
    })
    expect(document.querySelector('.skeleton')).not.toBeInTheDocument()
  })
})
