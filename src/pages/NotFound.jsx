import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <article className="article">
      <h1>404</h1>
      <p>你访问的页面不存在。</p>
      <Link to="/">← 回到首页</Link>
    </article>
  )
}
