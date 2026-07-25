import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: { uid: string }) => void) => {
    cb({ uid: 'u1' })
    return () => {}
  },
}))

const markAllRead = vi.fn().mockResolvedValue(undefined)
let emit: (items: unknown[]) => void = () => {}
vi.mock('@/lib/notifications', () => ({
  subscribeNotifications: (_uid: string, cb: (items: unknown[]) => void) => {
    emit = cb
    return () => {}
  },
  markAllRead: (...args: unknown[]) => markAllRead(...args),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import NotificationsPage from '@/app/patient/notifications/page'

const unread = {
  id: 'n1', title: 'Session summary', body: '...', kind: 'system', read: false, createdAt: new Date(),
}
const readItem = { ...unread, id: 'n2', read: true }

describe('NotificationsPage auto mark-read', () => {
  beforeEach(() => markAllRead.mockClear())

  it('marks all read once when the page opens with unread items', async () => {
    render(<NotificationsPage />)
    emit([unread, readItem])
    await waitFor(() => expect(markAllRead).toHaveBeenCalledTimes(1))
    expect(markAllRead).toHaveBeenCalledWith('u1', [unread, readItem])
  })

  it('does not mark read when everything is already read', async () => {
    render(<NotificationsPage />)
    emit([readItem])
    await new Promise((r) => setTimeout(r, 20))
    expect(markAllRead).not.toHaveBeenCalled()
  })

  it('does not auto-mark notifications that arrive after the first load', async () => {
    render(<NotificationsPage />)
    emit([readItem])                 // first batch: nothing unread → guard trips, no mark
    await new Promise((r) => setTimeout(r, 20))
    expect(markAllRead).not.toHaveBeenCalled()
    emit([unread, readItem])         // live arrival after open
    await new Promise((r) => setTimeout(r, 20))
    expect(markAllRead).not.toHaveBeenCalled()
  })
})
