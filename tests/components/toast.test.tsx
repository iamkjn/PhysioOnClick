import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Toast } from '@/components/toast'

describe('Toast', () => {
  it('renders the message and an svg icon', () => {
    render(<Toast id="1" message="Saved" type="success" onDismiss={vi.fn()} />)
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('shows a dismiss button for manual-dismiss types (warning/error)', () => {
    render(<Toast id="1" message="Careful" type="warning" onDismiss={vi.fn()} />)
    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument()
  })

  it('does not show a dismiss button for auto-dismiss types (success/info)', () => {
    render(<Toast id="1" message="Done" type="success" onDismiss={vi.fn()} />)
    expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument()
  })

  it('renders a progress bar only for auto-dismiss types', () => {
    const { rerender } = render(<Toast id="1" message="Done" type="info" onDismiss={vi.fn()} />)
    expect(document.querySelector('.toast-progress')).toBeInTheDocument()

    rerender(<Toast id="1" message="Careful" type="error" onDismiss={vi.fn()} />)
    expect(document.querySelector('.toast-progress')).not.toBeInTheDocument()
  })

  it('calls onDismiss when the dismiss button is clicked', () => {
    const onDismiss = vi.fn()
    render(<Toast id="7" message="Failed" type="error" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByLabelText('Dismiss'))
    expect(onDismiss).toHaveBeenCalledWith('7')
  })

  it('auto-dismisses success/info toasts after 3 seconds', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<Toast id="2" message="Saved" type="success" onDismiss={onDismiss} />)
    vi.advanceTimersByTime(3000)
    expect(onDismiss).toHaveBeenCalledWith('2')
    vi.useRealTimers()
  })
})
