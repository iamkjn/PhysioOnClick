import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const pushMock = vi.fn()
const markReadMock = vi.fn()
let emitNotifications: ((items: unknown[]) => void) | undefined

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/lib/admin-notifications', () => ({
  subscribeAdminNotifications: (callback: (items: unknown[]) => void) => {
    emitNotifications = callback
    return () => {}
  },
  markAdminNotificationRead: (...args: unknown[]) => markReadMock(...args),
  enableAdminPushNotifications: vi.fn(),
}))

import { AdminNotificationBell } from '@/components/admin-notification-bell'

beforeEach(() => {
  pushMock.mockReset()
  markReadMock.mockReset()
  markReadMock.mockResolvedValue(undefined)
  emitNotifications = undefined
})

describe('AdminNotificationBell', () => {
  it('opens a reminder in the shared self-assessment workspace', async () => {
    render(<AdminNotificationBell />)
    act(() => {
      emitNotifications?.([{
        id: 'notice-1',
        bookingId: 'booking-1',
        patientName: 'Jane Doe',
        read: false,
        sessionDate: new Date(Date.now() + 60_000),
      }])
    })

    await userEvent.click(screen.getByRole('button', { name: /notifications/i }))
    await userEvent.click(screen.getByRole('button', { name: /jane doe/i }))

    expect(markReadMock).toHaveBeenCalledWith('notice-1')
    expect(pushMock).toHaveBeenCalledWith('/admin/session/booking-1#self-assessment')
  })

  it('clears the badge when the panel is opened, including past sessions', async () => {
    render(<AdminNotificationBell />)
    act(() => {
      emitNotifications?.([
        { id: 'past-1', bookingId: 'b1', patientName: 'John Past', read: false, sessionDate: new Date(Date.now() - 86_400_000) },
        { id: 'next-1', bookingId: 'b2', patientName: 'Jane Next', read: false, sessionDate: new Date(Date.now() + 60_000) },
        { id: 'seen-1', bookingId: 'b3', patientName: 'Old Seen', read: true, sessionDate: new Date(Date.now() - 60_000) },
      ])
    })

    expect(screen.getByRole('button', { name: 'Notifications, 2 unread' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /notifications/i }))

    expect(markReadMock).toHaveBeenCalledTimes(2)
    expect(markReadMock).toHaveBeenCalledWith('past-1')
    expect(markReadMock).toHaveBeenCalledWith('next-1')
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeTruthy()
  })
})
