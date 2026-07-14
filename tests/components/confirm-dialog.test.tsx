import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConfirmDialog } from '@/components/confirm-dialog'

describe('ConfirmDialog', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Cancel appointment?"
        body="Body"
        confirmLabel="Cancel"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.queryByText('Cancel appointment?')).not.toBeInTheDocument()
  })

  it('renders title, body, and calls onConfirm/onCancel', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        isOpen
        title="Cancel appointment?"
        body="This will cancel your booking."
        confirmLabel="Cancel Appointment"
        confirmVariant="destructive"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    expect(screen.getByText('Cancel appointment?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel Appointment'))
    expect(onConfirm).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Keep'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('closes on Escape key', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        isOpen
        title="T"
        body="B"
        confirmLabel="Confirm"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalled()
  })
})
