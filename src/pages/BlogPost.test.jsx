import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BlogPost from './BlogPost.jsx'
import { posts } from '../data/posts.js'

// BlogPost 用 useParams 拿 slug,所以必须在带路由参数的环境里渲染。
function renderAtPath(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/posts/:slug" element={<BlogPost />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('<BlogPost />', () => {
  it('renders the matching post when slug exists', () => {
    const post = posts[0]
    renderAtPath(`/posts/${post.slug}`)
    expect(
      screen.getByRole('heading', { level: 1, name: post.title }),
    ).toBeInTheDocument()
    expect(screen.getByText(post.date, { exact: false })).toBeInTheDocument()
  })

  it('renders code blocks for fenced ``` segments', () => {
    // hello-vite-react 是已知含有代码块的文章
    renderAtPath('/posts/hello-vite-react')
    const codeBlocks = document.querySelectorAll('pre')
    expect(codeBlocks.length).toBeGreaterThan(0)
  })

  it('shows a "not found" message for an unknown slug', () => {
    renderAtPath('/posts/this-post-does-not-exist')
    expect(
      screen.getByRole('heading', { level: 1, name: /未找到/ }),
    ).toBeInTheDocument()
  })

  it('always renders a "back to home" link', () => {
    renderAtPath(`/posts/${posts[0].slug}`)
    const backLink = screen.getByRole('link', { name: /返回首页/ })
    expect(backLink).toHaveAttribute('href', '/')
  })
})
