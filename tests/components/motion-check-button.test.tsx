import { render, waitFor, screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'

const getMotionTargetMock = vi.fn()
vi.mock('@/lib/motion', () => ({
  getMotionTarget: (...args: unknown[]) => getMotionTargetMock(...args),
}))

// motion-check.tsx is heavy/client-only (MediaPipe et al.) and is loaded via
// next/dynamic(..., { ssr: false }) in the component under test. Stub the
// dynamic() call so it resolves to a lightweight fake modal instead of
// pulling in the real camera component.
vi.mock('next/dynamic', () => ({
  default: () => {
    function MotionCheckStub(props: { onClose: () => void; exercise: { title: string } }) {
      return (
        <div data-testid="motion-check-stub">
          <span>{props.exercise.title}</span>
          <button type="button" onClick={props.onClose}>Close</button>
        </div>
      )
    }
    return MotionCheckStub
  },
}))

import { MotionCheckButton } from '@/components/motion-check-button'

const exercise = { id: 'ex-1', title: 'Sit to Stand Control', bodyPart: 'Lower limb' }
const target = {
  exerciseId: 'ex-1', bodyPart: 'Lower limb',
  joint: { a: 0, vertex: 1, b: 2 },
  targetRomMin: 85, targetRomMax: 170, repEnterAngle: 160, repExitAngle: 100, repTarget: 10,
}

function mockDevices(devices: MediaDeviceInfo[]) {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { enumerateDevices: vi.fn().mockResolvedValue(devices) },
    configurable: true,
  })
}

afterEach(() => {
  Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true })
})

describe('MotionCheckButton', () => {
  it('renders the button when a target exists and a camera is present', async () => {
    getMotionTargetMock.mockResolvedValue(target)
    mockDevices([{ kind: 'videoinput' } as MediaDeviceInfo])

    render(<MotionCheckButton exerciseId="ex-1" exercise={exercise} uid="u1" personId="p1" />)

    expect(await screen.findByRole('button', { name: /check your motion/i })).toBeInTheDocument()
  })

  it('renders nothing when there is no video input device', async () => {
    getMotionTargetMock.mockResolvedValue(target)
    mockDevices([{ kind: 'audioinput' } as MediaDeviceInfo])

    const { container } = render(
      <MotionCheckButton exerciseId="ex-1" exercise={exercise} uid="u1" personId="p1" />
    )

    await waitFor(() => expect(getMotionTargetMock).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when there is no motion target for the exercise', async () => {
    getMotionTargetMock.mockResolvedValue(null)
    mockDevices([{ kind: 'videoinput' } as MediaDeviceInfo])

    const { container } = render(
      <MotionCheckButton exerciseId="ex-4" exercise={exercise} uid="u1" personId="p1" />
    )

    await waitFor(() => expect(getMotionTargetMock).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('opens MotionCheck in a modal on click and closes it via onClose', async () => {
    getMotionTargetMock.mockResolvedValue(target)
    mockDevices([{ kind: 'videoinput' } as MediaDeviceInfo])

    render(<MotionCheckButton exerciseId="ex-1" exercise={exercise} uid="u1" personId="p1" />)

    const button = await screen.findByRole('button', { name: /check your motion/i })
    button.click()

    expect(await screen.findByTestId('motion-check-stub')).toBeInTheDocument()

    screen.getByRole('button', { name: /close/i }).click()

    await waitFor(() => expect(screen.queryByTestId('motion-check-stub')).not.toBeInTheDocument())
  })
})
