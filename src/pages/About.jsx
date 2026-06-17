export default function About() {
  return (
    <article className="article">
      <h1>关于本站</h1>
      <p>
        这是一个用于演示 GitHub Actions CI/CD 流程的极简博客示例。它使用 Vite 构建、
        React 渲染,并通过 GitHub Pages 提供静态托管。
      </p>
      <p>技术栈:</p>
      <ul>
        <li>Vite 5 — 极速开发 / 打包工具</li>
        <li>React 18 + React Router 6 (HashRouter)</li>
        <li>ESLint — 代码风格检查</li>
        <li>GitHub Actions — CI(lint + build) / CD(部署到 Pages)</li>
      </ul>
      <p>
        所有源代码托管在 GitHub 仓库中,提交到 <code>main</code> 分支后,CI 与 CD
        会自动运行。
      </p>
    </article>
  )
}
