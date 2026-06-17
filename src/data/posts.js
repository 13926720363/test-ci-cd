// 简单起见，博客内容直接以模块形式提供。content 字段使用一个非常简易的伪
// markdown：双换行分段、以 ``` 包裹的代码块。生产项目可换为 mdx / 后端接口。

export const posts = [
  {
    slug: 'hello-vite-react',
    title: '从零开始：Vite + React 项目结构速览',
    date: '2026-06-10',
    tags: ['Vite', 'React'],
    excerpt:
      '为什么我们选择 Vite 替代 CRA？看一下这个示例博客的目录结构与依赖。',
    content: `Vite 凭借基于 ESBuild 的超快冷启动以及 Rollup 的产物优化,已经成为现代 React 项目的主流选择。

本项目结构非常精简:

\`\`\`
.
├── index.html              # 入口 HTML
├── src/
│   ├── main.jsx            # React 挂载点
│   ├── App.jsx             # 路由壳
│   ├── pages/              # 页面组件
│   └── data/posts.js       # 博文数据
├── vite.config.js
└── .github/workflows/      # CI / CD 配置
\`\`\`

之所以使用 HashRouter 而不是 BrowserRouter,是因为 GitHub Pages 不支持 SPA 的服务端 fallback,使用 hash 路由可以避免刷新出现 404。`,
  },
  {
    slug: 'github-actions-ci-cd',
    title: '把项目交给 GitHub Actions:CI 与 CD 实战',
    date: '2026-06-12',
    tags: ['GitHub Actions', 'CI/CD'],
    excerpt:
      '一份能直接复用的 workflow:推送到 main 自动 lint、build,并部署到 GitHub Pages。',
    content: `本仓库提供两个 workflow:

1. \`ci.yml\`:每次 push / PR 都会运行,负责安装依赖、ESLint 检查与 \`vite build\`,确保主干不会被破坏。
2. \`deploy.yml\`:仅在 push 到 \`main\` 时触发,构建产物会上传到 GitHub Pages 环境。

要让站点正常访问,需要做两件事:

- 在仓库 Settings → Pages 中,把 Source 设为 "GitHub Actions"。
- 因为部署在 \`https://<user>.github.io/<repo>/\` 路径下,工作流会向 \`vite build\` 注入 \`VITE_BASE=/<repo>/\`,以保证静态资源路径正确。

\`\`\`yaml
- name: Build
  run: npm run build
  env:
    VITE_BASE: /\${{ github.event.repository.name }}/
\`\`\`

之后 push 一次 main,几分钟内就能在 Pages 上看到这个博客。`,
  },
  {
    slug: 'why-hash-router-on-pages',
    title: '在 GitHub Pages 上为什么推荐 HashRouter',
    date: '2026-06-15',
    tags: ['React Router', '部署'],
    excerpt: 'BrowserRouter 在静态托管下刷新就会 404,HashRouter 是最省事的选择。',
    content: `GitHub Pages 是纯静态托管,没有 nginx try_files 这类 SPA fallback 能力。

如果使用 BrowserRouter,直接访问 \`/posts/foo\` 会因为找不到对应的 \`posts/foo/index.html\` 而 404。

HashRouter 通过 URL 中的 \`#\` 完成前端路由切换,所有路径在静态服务器看来都是请求根 \`index.html\`,因此天然兼容 Pages。

如果你坚持要用 BrowserRouter,常见做法是:把 \`dist/index.html\` 同时拷贝为 \`dist/404.html\`,Pages 会用它作为兜底。`,
  },
]

export function findPost(slug) {
  return posts.find((p) => p.slug === slug)
}
