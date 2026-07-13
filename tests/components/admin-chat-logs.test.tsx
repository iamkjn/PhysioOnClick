import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: null }))

import { AdminChatLogs } from '@/components/admin-chat-logs'

describe('AdminChatLogs', () => {
  it('shows SkeletonRow while loading', () => {
    const { container } = render(<AdminChatLogs />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()
  })
})
