import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: { uid: string }) => void) => {
    cb({ uid: 'u1' })
    return () => {}
  },
}))
vi.mock('@/lib/notifications', () => ({
  subscribeNotifications: (_uid: string, cb: (items: unknown[]) => void) => {
    cb([])
    return () => {}
  },
}))

import { NotificationBell } from '@/components/notification-bell'

describe('NotificationBell', () => {
  it('renders an inline SVG bell (not an emoji) when signed in', () => {
    render(<NotificationBell />)
    const svg = document.querySelector('.notification-bell svg')
    expect(svg).toBeInTheDocument()
    expect(document.querySelector('.notification-bell')?.textContent).not.toContain('🔔')
  })
})
