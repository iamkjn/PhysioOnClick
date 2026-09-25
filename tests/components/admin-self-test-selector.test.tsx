import { fireEvent, render, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'

import { AdminSelfTestSelector } from '@/components/admin-self-test-selector'
import { selfTests } from '@/lib/self-tests'

function renderSelector(overrides: Partial<ComponentProps<typeof AdminSelfTestSelector>> = {}) {
  const first = selfTests[0]
  const second = selfTests[1]
  const props: ComponentProps<typeof AdminSelfTestSelector> = {
    recommendedSlugs: [first.slug, second.slug],
    selectedSlugs: [first.slug],
    results: [],
    onSelectedChange: vi.fn(),
    onResultsChange: vi.fn(),
    onPresent: vi.fn(),
    ...overrides,
  }
  return { ...render(<AdminSelfTestSelector {...props} />), props, first, second }
}

describe('AdminSelfTestSelector', () => {
  it('shows selected, suggested and full-library tests in one workspace', () => {
    const { getByText, first, second } = renderSelector()

    expect(getByText('Test list')).toBeInTheDocument()
    expect(getByText('Suggested tests')).toBeInTheDocument()
    expect(getByText('All available tests')).toBeInTheDocument()
    expect(getByText(first.name)).toBeInTheDocument()
    expect(getByText(second.name)).toBeInTheDocument()
  })

  it('adds a suggested test to the selected list', () => {
    const onSelectedChange = vi.fn()
    const { getByText, props, second } = renderSelector({ onSelectedChange })
    const card = getByText(second.name).closest('article')
    expect(card).not.toBeNull()

    fireEvent.click(within(card as HTMLElement).getByRole('button', { name: 'Add test' }))
    expect(onSelectedChange).toHaveBeenCalledWith([...props.selectedSlugs, second.slug])
  })

  it('removes a selected test and its recorded result', () => {
    const onSelectedChange = vi.fn()
    const onResultsChange = vi.fn()
    const first = selfTests[0]
    const { getByText } = renderSelector({
      results: [{ slug: first.slug, result: 'positive' }],
      onSelectedChange,
      onResultsChange,
    })
    const card = getByText(first.name).closest('article')
    expect(card).not.toBeNull()

    fireEvent.click(within(card as HTMLElement).getByRole('button', { name: 'Remove' }))
    expect(onSelectedChange).toHaveBeenCalledWith([])
    expect(onResultsChange).toHaveBeenCalledWith([])
  })

  it('cancels a suggestion without removing the test from the complete library', () => {
    const { getByRole, getByText, queryByText, second } = renderSelector()
    fireEvent.click(getByRole('button', { name: `Cancel ${second.name} suggestion` }))

    expect(queryByText('Suggested tests')).not.toBeInTheDocument()
    const libraryCard = getByText(second.name).closest('article')
    expect(libraryCard).not.toBeNull()
    expect(within(libraryCard as HTMLElement).getByRole('button', { name: 'Add test' })).toBeInTheDocument()
  })
})
