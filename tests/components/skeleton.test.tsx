import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonRow,
  SkeletonTable,
  SkeletonChart,
  SkeletonStatGrid,
  SkeletonForm,
} from '@/components/skeleton'

describe('skeleton primitives', () => {
  it('Skeleton renders a single shimmer block', () => {
    const { container } = render(<Skeleton width="80px" height="20px" />)
    expect(container.querySelector('.skeleton')).toBeInTheDocument()
  })

  it('SkeletonText renders the requested number of lines', () => {
    const { container } = render(<SkeletonText lines={3} />)
    expect(container.querySelectorAll('.skeleton-text-line').length).toBe(3)
  })

  it('SkeletonCircle renders one circular block', () => {
    const { container } = render(<SkeletonCircle size="48px" />)
    expect(container.querySelector('.skeleton-circle')).toBeInTheDocument()
  })

  it('SkeletonRow renders the requested number of rows', () => {
    const { container } = render(<SkeletonRow count={4} />)
    expect(container.querySelectorAll('.skeleton-row').length).toBe(4)
  })

  it('SkeletonTable renders a header plus the requested rows', () => {
    const { container } = render(<SkeletonTable rows={3} columns={5} />)
    expect(container.querySelectorAll('.skeleton-table-row').length).toBe(3)
    expect(container.querySelectorAll('.skeleton-table-header .skeleton').length).toBe(5)
  })

  it('SkeletonChart renders at the requested height', () => {
    const { container } = render(<SkeletonChart height={200} />)
    const chart = container.querySelector('.skeleton-chart') as HTMLElement
    expect(chart.style.height).toBe('200px')
  })

  it('SkeletonStatGrid renders the requested number of tiles', () => {
    const { container } = render(<SkeletonStatGrid count={2} />)
    expect(container.querySelectorAll('.skeleton-stat-tile').length).toBe(2)
  })

  it('SkeletonForm renders the requested number of fields', () => {
    const { container } = render(<SkeletonForm fields={4} />)
    expect(container.querySelectorAll('.skeleton-form-field').length).toBe(4)
  })
})
