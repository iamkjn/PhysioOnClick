import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: null, db: null }))
vi.mock('@/lib/patient-account', () => ({ ensurePatientRecord: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import { BlogFavoriteButton } from '@/components/blog-favorite-button'
import type { BlogArticle } from '@/lib/blog'

const article: BlogArticle = {
  slug: 'a',
  title: 'A',
  category: 'Back pain',
  excerpt: '',
  readTime: '5 min',
  seoTitle: 'A',
  seoDescription: '',
  publishedAt: '2024-01-01',
  image: '',
  sections: []
}

describe('BlogFavoriteButton', () => {
  it('shows a skeleton circle while the favourite state is unresolved', () => {
    const { container } = render(<BlogFavoriteButton article={article} />)
    expect(container.querySelector('.skeleton-circle')).toBeInTheDocument()
  })
})
