import { describe, it, expect } from 'vitest'
import { findPost, posts } from './posts.js'

describe('findPost', () => {
  it('returns the post when slug exists', () => {
    const post = findPost('hello-vite-react')
    expect(post).toBeDefined()
    expect(post.title).toMatch(/Vite/)
  })

  it('returns undefined for an unknown slug', () => {
    expect(findPost('definitely-not-a-real-post')).toBeUndefined()
  })
})

describe('posts data', () => {
  it('every post has the required shape', () => {
    expect(posts.length).toBeGreaterThan(0)
    for (const post of posts) {
      expect(post.slug).toEqual(expect.any(String))
      expect(post.title).toEqual(expect.any(String))
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Array.isArray(post.tags)).toBe(true)
      expect(post.excerpt).toEqual(expect.any(String))
      expect(post.content).toEqual(expect.any(String))
    }
  })

  it('slugs are unique', () => {
    const slugs = posts.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
