import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BlogList from './BlogList.jsx'
import { posts } from '../data/posts.js'

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('<BlogList />', () => {
  it('renders the page title', () => {
    renderWithRouter(<BlogList />)
    expect(
      screen.getByRole('heading', { level: 1, name: /最新文章/ }),
    ).toBeInTheDocument()
  })

  it('renders a card for every post', () => {
    renderWithRouter(<BlogList />)
    for (const post of posts) {
      expect(screen.getByText(post.title)).toBeInTheDocument()
      expect(screen.getByText(post.excerpt)).toBeInTheDocument()
    }
  })

  it('orders posts from newest to oldest', () => {
    renderWithRouter(<BlogList />)
    const headings = screen.getAllByRole('heading', { level: 2 })
    const titlesInOrder = headings.map((h) => h.textContent)
    const expected = [...posts]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((p) => p.title)
    expect(titlesInOrder).toEqual(expected)
  })

  it('each card links to its post detail page', () => {
    renderWithRouter(<BlogList />)
    for (const post of posts) {
      const heading = screen.getByText(post.title)
      // <h2> is wrapped by the <a class="post-card">
      const link = heading.closest('a')
      expect(link).not.toBeNull()
      expect(link).toHaveAttribute('href', `/posts/${post.slug}`)
      // tags are rendered inside the same card
      for (const tag of post.tags) {
        expect(within(link).getByText(`#${tag}`)).toBeInTheDocument()
      }
    }
  })
})
