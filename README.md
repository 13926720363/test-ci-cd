# test-ci-cd · Vite + React 博客示例

一个最小可运行的博客站点，演示如何使用 **GitHub Actions** 完成：

- **CI**：push / PR 时自动 `npm ci` → `npm run lint` → `npm run build`
- **CD**：push 到 `main` 后自动构建并部署到 **GitHub Pages**

## 技术栈

| 类别       | 选型                              |
| ---------- | --------------------------------- |
| 构建       | Vite 5                            |
| 框架       | React 18                          |
| 路由       | react-router-dom 6 (HashRouter)   |
| 代码规范   | ESLint                            |
| CI / CD    | GitHub Actions + GitHub Pages     |

## 本地开发

> 需要 Node.js ≥ 18（推荐 20）。

```bash
npm install
npm run dev       # 启动开发服务器 http://localhost:5173
npm run lint      # ESLint 检查
npm run build     # 产物输出到 dist/
npm run preview   # 本地预览生产构建
```

## 目录结构

```
.
├── index.html
├── package.json
├── vite.config.js
├── .eslintrc.cjs
├── .github/workflows/
│   ├── ci.yml          # CI: lint + build
│   └── deploy.yml      # CD: 部署到 GitHub Pages
├── public/
│   └── vite.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.css
    ├── index.css
    ├── data/
    │   └── posts.js    # 博文数据
    └── pages/
        ├── BlogList.jsx
        ├── BlogPost.jsx
        ├── About.jsx
        └── NotFound.jsx
```

## 部署到 GitHub Pages 的步骤

1. 在 GitHub 创建仓库（例如 `your-name/test-ci-cd`），将代码推送到 `main` 分支。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 推送任意提交到 `main`，`Deploy to GitHub Pages` 这条工作流会自动执行：
   - `vite build` 时通过 `VITE_BASE=/<repo>/` 注入正确的资源前缀；
   - 构建产物经 `actions/upload-pages-artifact` + `actions/deploy-pages` 部署。
4. 完成后访问 `https://<your-name>.github.io/<repo>/` 即可。

> 因为站点路径不在根 `/`，仓库默认使用了 `HashRouter`，避免刷新 404。
> 如果你把仓库改名为 `<your-name>.github.io`（用户主页），可以删除 `vite.config.js` 中的 `base` 处理，或在 `deploy.yml` 中不设置 `VITE_BASE`。

## CI 工作流概览

`.github/workflows/ci.yml`：

- 触发：push 或 PR 到 `main`
- 步骤：checkout → setup-node@20（带 npm 缓存）→ `npm ci` → `npm run lint` → `npm run build`

`.github/workflows/deploy.yml`：

- 触发：push 到 `main`，或手动 `workflow_dispatch`
- 步骤：构建 → `configure-pages` → `upload-pages-artifact` → `deploy-pages`
- 权限：`pages: write` + `id-token: write`（Pages 部署所需）

## 后续可拓展

- 接入 [Vitest](https://vitest.dev/) + React Testing Library，并在 CI 中加入 `npm test`
- 用 MDX / 远程 CMS 替换 `src/data/posts.js`
- 在 PR 中使用 `actions/upload-artifact` 暴露预览构建产物
- 给 main 分支加保护规则，要求 CI 通过后才能合并
