import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getMotionTargetMock = vi.fn()
const saveMotionTargetMock = vi.fn().mockResolvedValue(undefined)
vi.mock('@/lib/motion', () => ({
  getMotionTarget: (...args: unknown[]) => getMotionTargetMock(...args),
  saveMotionTarget: (...args: unknown[]) => saveMotionTargetMock(...args),
}))

import { AdminMotionTargets } from '@/components/admin-motion-targets'

const target = {
  exerciseId: 'ex-1', bodyPart: 'Lower limb',
  joint: { a: 0, vertex: 1, b: 2 },
  targetRomMin: 85, targetRomMax: 170, repEnterAngle: 160, repExitAngle: 100, repTarget: 10,
}

beforeEach(() => {
  getMotionTargetMock.mockReset()
  saveMotionTargetMock.mockClear()
  // Only ex-1 has a target in this test; the rest of the catalogue (ex-2..4)
  // has none, so only one form should render.
  getMotionTargetMock.mockImplementation((exerciseId: string) =>
    Promise.resolve(exerciseId === 'ex-1' ? target : null)
  )
})

describe('AdminMotionTargets', () => {
  it('loads the current target into the form fields', async () => {
    render(<AdminMotionTargets adminUid="admin-1" />)

    expect(await screen.findByDisplayValue('85')).toBeInTheDocument()
    expect(screen.getByDisplayValue('170')).toBeInTheDocument()
    expect(screen.getByDisplayValue('160')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
  })

  it('does not render a form for exercises with no motion target', async () => {
    render(<AdminMotionTargets adminUid="admin-1" />)
    await screen.findByDisplayValue('85')
    // ex-2/ex-3/ex-4 all resolve to null in this test's mock.
    expect(getMotionTargetMock).toHaveBeenCalledTimes(4)
    expect(screen.getAllByRole('button', { name: /save/i })).toHaveLength(1)
  })

  it('saves the edited values via saveMotionTarget on submit', async () => {
    const user = userEvent.setup()
    render(<AdminMotionTargets adminUid="admin-1" />)

    const romMinInput = await screen.findByDisplayValue('85')
    await user.clear(romMinInput)
    await user.type(romMinInput, '90')

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(saveMotionTargetMock).toHaveBeenCalledTimes(1))
    const [savedTarget, adminUid] = saveMotionTargetMock.mock.calls[0]
    expect(adminUid).toBe('admin-1')
    expect(savedTarget).toMatchObject({
      exerciseId: 'ex-1',
      targetRomMin: 90,
      targetRomMax: 170,
      repEnterAngle: 160,
      repExitAngle: 100,
      repTarget: 10,
    })
  })
})
