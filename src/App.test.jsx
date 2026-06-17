import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'
import { posts } from './data/posts.js'

// App 自身不带 Router(Router 在 main.jsx),测试时用 MemoryRouter 注入路由。
function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('<App /> routing', () => {
  it('renders the blog list at "/"', () => {
    renderApp('/')
    expect(
      screen.getByRole('heading', { level: 1, name: /最新文章/ }),
    ).toBeInTheDocument()
  })

  it('renders the about page at "/about"', () => {
    renderApp('/about')
    expect(
      screen.getByRole('heading', { level: 1, name: /关于本站/ }),
    ).toBeInTheDocument()
  })

  it('renders 404 for an unknown route', () => {
    renderApp('/this/does/not/exist')
    expect(
      screen.getByRole('heading', { level: 1, name: '404' }),
    ).toBeInTheDocument()
  })

  it('navigates from the list to a post when a card is clicked', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const post = [...posts].sort((a, b) => (a.date < b.date ? 1 : -1))[0] // 最新一篇
    // 点击列表里那篇文章的标题
    await user.click(screen.getByText(post.title))

    // 现在应该在详情页:<h1>{title}</h1>
    expect(
      screen.getByRole('heading', { level: 1, name: post.title }),
    ).toBeInTheDocument()
  })
})
