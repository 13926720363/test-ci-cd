import { Link, useParams } from 'react-router-dom'
import { findPost } from '../data/posts.js'

// 把超简化的 markdown 切成段落 / 代码块
function renderContent(content) {
  const parts = content.split(/```/)
  return parts.map((chunk, i) => {
    const isCode = i % 2 === 1
    if (isCode) {
      return <pre key={i}>{chunk.replace(/^\n+|\n+$/g, '')}</pre>
    }
    return chunk
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((para, j) => <p key={`${i}-${j}`}>{para}</p>)
  })
}

export default function BlogPost() {
  const { slug } = useParams()
  const post = findPost(slug)

  if (!post) {
    return (
      <article className="article">
        <Link to="/" className="back-link">
          ← 返回首页
        </Link>
        <h1>文章未找到</h1>
        <p>slug 为 “{slug}” 的文章不存在。</p>
      </article>
    )
  }

  return (
    <article className="article">
      <Link to="/" className="back-link">
        ← 返回首页
      </Link>
      <h1>{post.title}</h1>
      <div className="post-meta">
        {post.date} ·{' '}
        {post.tags.map((t) => (
          <span key={t} className="tag">
            #{t}
          </span>
        ))}
      </div>
      {renderContent(post.content)}
    </article>
  )
}
