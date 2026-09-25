import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// ToastProvider intentionally loads the animated Toast with next/dynamic.
// This suite tests provider state, so keep the child synchronous and avoid
// leaving a GSAP import running after jsdom has torn the test down.
vi.mock('next/dynamic', () => ({
  default: () => ({ message }: { message: string }) => <div>{message}</div>,
}))
vi.mock('@/lib/gsap', () => ({
  gsap: { from: vi.fn() },
}))

import { ToastProvider, useToast } from '@/components/toast-provider'

function TriggerButton({ message, type }: { message: string; type: 'success' | 'info' | 'warning' | 'error' }) {
  const { show } = useToast()
  return <button onClick={() => show(message, type)}>trigger</button>
}

describe('ToastProvider', () => {
  it('shows a toast when show() is called', () => {
    render(
      <ToastProvider>
        <TriggerButton message="Saved!" type="success" />
      </ToastProvider>
    )
    act(() => screen.getByText('trigger').click())
    expect(screen.getByText('Saved!')).toBeInTheDocument()
  })

  it('keeps at most 3 toasts visible at once', () => {
    render(
      <ToastProvider>
        <TriggerButton message="One" type="success" />
        <TriggerButton message="Two" type="success" />
        <TriggerButton message="Three" type="success" />
        <TriggerButton message="Four" type="success" />
      </ToastProvider>
    )
    const buttons = screen.getAllByText('trigger')
    buttons.forEach((b) => act(() => b.click()))
    expect(screen.queryByText('One')).not.toBeInTheDocument()
    expect(screen.getByText('Two')).toBeInTheDocument()
    expect(screen.getByText('Three')).toBeInTheDocument()
    expect(screen.getByText('Four')).toBeInTheDocument()
  })
})
