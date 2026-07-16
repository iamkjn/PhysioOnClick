import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getExerciseLogsMock = vi.fn()
vi.mock('@/lib/recovery', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/recovery')>()
  return {
    ...actual,
    getExerciseLogs: (...args: unknown[]) => getExerciseLogsMock(...args),
  }
})

import { AdherenceBar } from '@/components/adherence-bar'
import { todayKey, dateKeyDaysAgo } from '@/lib/recovery'

describe('AdherenceBar', () => {
  it('shows a skeleton while loading, then the adherence copy once resolved', async () => {
    let resolveLogs: (v: unknown[]) => void = () => {}
    getExerciseLogsMock.mockReturnValue(new Promise((resolve) => { resolveLogs = resolve }))

    render(<AdherenceBar uid="u1" personId="p1" />)
    expect(document.querySelector('.skeleton')).toBeInTheDocument()

    resolveLogs([
      { date: todayKey(), completions: { a: true } },
      { date: dateKeyDaysAgo(1), completions: { a: false } },
    ])

    await waitFor(() => {
      expect(screen.getByText(/of 7 days/)).toBeInTheDocument()
    })
    expect(document.querySelector('.skeleton')).not.toBeInTheDocument()
  })
})
