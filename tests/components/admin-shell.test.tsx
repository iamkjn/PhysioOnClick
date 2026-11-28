import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

const { pathname } = vi.hoisted(() => ({ pathname: { value: '/admin' } }))

vi.mock('next/navigation', () => ({ usePathname: () => pathname.value }))
const { signedIn } = vi.hoisted(() => ({ signedIn: { email: 'admin@physioonclick.co.uk' } }))
vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
  onAuthStateChanged: (_auth: unknown, next: (user: { email: string }) => void) => {
    next(signedIn)
    return () => {}
  },
}))
vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: { email: 'admin@physioonclick.co.uk' } },
}))
vi.mock('@/components/admin-notification-bell', () => ({
  AdminNotificationBell: () => <button type="button">Notifications</button>,
}))

import { AdminShell } from '@/components/admin-shell'

describe('AdminShell', () => {
  it('provides complete route-aware admin navigation', () => {
    pathname.value = '/admin'
    render(<AdminShell><main>Dashboard content</main></AdminShell>)

    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Sessions' })).toHaveAttribute('href', '/admin/sessions')
    expect(screen.getByRole('link', { name: 'Patients' })).toHaveAttribute('href', '/admin/patients')
    expect(screen.getByRole('link', { name: 'Recovery tools' })).toHaveAttribute('href', '/admin/recovery')
    expect(screen.getByRole('link', { name: 'Invoices' })).toHaveAttribute('href', '/admin/invoices')
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })

  it('opens and closes the responsive navigation drawer', async () => {
    pathname.value = '/admin/patients'
    const { container } = render(<AdminShell><main>Patients</main></AdminShell>)

    expect(screen.getByRole('link', { name: 'Patients' })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }))
    expect(container.querySelector('.admin-app-shell')).toHaveClass('is-nav-open')
    await userEvent.click(screen.getByRole('button', { name: 'Close navigation' }))
    expect(container.querySelector('.admin-app-shell')).not.toHaveClass('is-nav-open')
  })

  it('shows the practice tools to the owner only', () => {
    pathname.value = '/admin'
    signedIn.email = 'otherdoctor@example.com'
    const other = render(<AdminShell><main>x</main></AdminShell>)
    expect(screen.queryByRole('link', { name: 'Add appointment' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Price checker' })).toBeNull()
    other.unmount()

    signedIn.email = 'hello@physioonclick.co.uk'
    render(<AdminShell><main>x</main></AdminShell>)
    expect(screen.getByRole('link', { name: 'Add appointment' })).toHaveAttribute('href', '/admin/appointments')
    expect(screen.getByRole('link', { name: 'Price checker' })).toHaveAttribute('href', '/admin/price-checker')
  })
})
