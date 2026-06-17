import { Link } from 'react-router-dom'
import { posts } from '../data/posts.js'

export default function BlogList() {
  return (
    <section>
      <h1 className="page-title">最新文章</h1>
      {posts
        .slice()
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((post) => (
          <Link key={post.slug} to={`/posts/${post.slug}`} className="post-card">
            <h2>{post.title}</h2>
            <div className="post-meta">
              {post.date} ·{' '}
              {post.tags.map((t) => (
                <span key={t} className="tag">
                  #{t}
                </span>
              ))}
            </div>
            <p className="post-excerpt">{post.excerpt}</p>
          </Link>
        ))}
    </section>
  )
}
