import { Link, Route, Routes } from 'react-router-dom'
import BlogList from './pages/BlogList.jsx'
import BlogPost from './pages/BlogPost.jsx'
import About from './pages/About.jsx'
import NotFound from './pages/NotFound.jsx'
import './App.css'

export default function App() {
  return (
    <div className="layout">
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <span className="brand-dot" />
            My Mini Blog
          </Link>
          <nav className="nav">
            <Link to="/">首页</Link>
            <Link to="/about">关于</Link>
            <a
              href="https://github.com/features/actions"
              target="_blank"
              rel="noreferrer"
            >
              GitHub Actions
            </a>
          </nav>
        </div>
      </header>

      <main className="container main">
        <Routes>
          <Route path="/" element={<BlogList />} />
          <Route path="/posts/:slug" element={<BlogPost />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="container">
          © {new Date().getFullYear()} My Mini Blog · Powered by Vite + React ·
          Deployed via GitHub Actions
        </div>
      </footer>
    </div>
  )
}
