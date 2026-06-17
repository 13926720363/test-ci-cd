# CI/CD 构建流程知识文档

> 本文记录 `test-ci-cd` 仓库的 CI/CD 全流程：触发条件、执行步骤、关键配置、踩坑记录与扩展建议。
> 当前生效的工作流文件位于 `.github/workflows/`，对应的产物站点位于
> <https://13926720363.github.io/test-ci-cd/>。

---

## 1. 总览

```
                           push / PR → main
                                  │
            ┌─────────────────────┴─────────────────────┐
            ▼                                           ▼
      ┌─────────────┐                            ┌──────────────┐
      │     CI      │                            │   Deploy     │
      │ (lint+test+ │                            │ (build →     │
      │   build)    │                            │  Pages)      │
      └──────┬──────┘                            └──────┬───────┘
             │ 失败                                       │
             ▼                                           ▼
       挡住 PR / 暴露                                 push main 才执行
       回归                                           workflow_dispatch 可手动触发
                                                    部署到 GitHub Pages
```

- **CI** 是质量门：每次 push 与 PR 都跑，挂掉就阻止合入。
- **Deploy** 是发布管道：仅 `main` 分支 push 触发，构建并发布静态产物到
  GitHub Pages。

两条 workflow 互相独立：CI 失败不会阻止 Deploy 排队；但 Deploy 内部也会跑 build，
如果代码本身构不出来同样会失败，事实上对部署形成了二次防护。

---

## 2. 工作流详解

### 2.1 `.github/workflows/ci.yml` — 质量门

| 项目        | 取值                                                    |
| ----------- | ------------------------------------------------------- |
| 触发        | `push` 到 `main`、对 `main` 的 `pull_request`           |
| 运行环境    | `ubuntu-latest`                                          |
| Node        | `20`，启用 `actions/setup-node@v4` 自带的 npm 缓存       |
| 关键步骤    | `Install → Lint → Test → Build`                         |

执行顺序与目的：

1. **Checkout** (`actions/checkout@v4`)：拉取仓库代码。
2. **Setup Node** (`actions/setup-node@v4`)：固定 Node 20，开启 `cache: npm`
   减少依赖下载耗时。
3. **Install dependencies**：使用 `npm install --no-audit --no-fund`。
   - 没有用 `npm ci` 的原因见 [§5.2](#52-windows-生成的-lockfile-在-linux-上-npm-ci-报-ebadplatform)。
4. **Lint**：`npm run lint` → `eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0`。
   `--max-warnings 0` 让任何 warning 也算挂。
5. **Test**：`npm test` → `vitest run`，跑当前的 16 个用例（详见 [§4](#4-测试层)）。
6. **Build**：`npm run build` → `vite build`。出现编译错或类型/导入问题立即暴露。

CI 不上传任何 artifact，只承担"门"的职责；产物会由 Deploy workflow 单独构建上传。

### 2.2 `.github/workflows/deploy.yml` — 发布管道

| 项目        | 取值                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| 触发        | `push` 到 `main`、`workflow_dispatch`（手动）                            |
| 权限        | `contents: read`、`pages: write`、`id-token: write`                     |
| 并发控制    | `concurrency: { group: pages, cancel-in-progress: true }` 同一时间一份  |
| 环境        | `github-pages`（部署完毕后 `page_url` 暴露在 environment 上）            |

工作流分两个 job：

1. **build**：和 CI 大同小异，多了三件事：
   - 通过环境变量注入 base 路径：
     ```yaml
     env:
       VITE_BASE: /${{ github.event.repository.name }}/
     ```
     `vite.config.js` 读取它，让产物中的资源路径变为
     `/test-ci-cd/assets/...`，匹配 `https://<user>.github.io/test-ci-cd/`
     的子路径托管。
   - `actions/configure-pages@v5`：在仓库 Pages 设置层面准备部署上下文。
   - `actions/upload-pages-artifact@v3`：把 `./dist` 打成 Pages artifact。
2. **deploy**：依赖 `build`，调用 `actions/deploy-pages@v4` 把 artifact 推上线。

> Deploy 不会跑 lint 与 test —— 那部分由 CI 守。也就是说一次 push 同时收到
> CI 与 Deploy 两份反馈。

### 2.3 关于 Pages 与可见性

- **GitHub Free 计划下，Pages 仅对 public 仓库免费**。Private 仓启用 Pages 需要
  Pro/Team/Enterprise，否则 `gh api -X POST .../pages` 会返回 422。
- 当前仓库为 public。Pages 已通过 API 启用，模式为 `build_type: workflow`
  （即 Source = GitHub Actions）。

---

## 3. 关键配置文件

| 文件 | 作用 | 关键点 |
|---|---|---|
| `package.json` | 脚本与依赖 | `dev`/`build`/`preview`/`lint`/`test`/`test:watch`/`test:coverage` |
| `vite.config.js` | Vite + Vitest 配置 | `base` 来自 `VITE_BASE`；`test.environment: jsdom`；`test.globals: false`（显式 import）；`test.setupFiles: ['./src/test/setup.js']` |
| `.eslintrc.cjs` | 代码风格门 | `react`/`react-hooks`/`react-refresh` 规则；`ignorePatterns` 排除 `dist`/`coverage` |
| `.gitignore` | 版本控制黑名单 | 忽略 `node_modules`、`dist`、`coverage`、`.env*` |
| `src/test/setup.js` | 测试 setup | 引入 `@testing-library/jest-dom/vitest`；显式注册 `afterEach(cleanup)` |
| `.github/workflows/ci.yml` | CI 工作流 | install → lint → test → build |
| `.github/workflows/deploy.yml` | CD 工作流 | install → build (with VITE_BASE) → upload artifact → deploy-pages |

---

## 4. 测试层

技术栈：**Vitest 4 + React Testing Library + jsdom + jest-dom**。

### 4.1 用例分布

```
src/
├── data/
│   ├── posts.js
│   └── posts.test.js          # 3 用例 — 纯函数 / 数据形状
├── pages/
│   ├── BlogList.jsx
│   ├── BlogList.test.jsx      # 4 用例 — 列表组件
│   ├── BlogPost.jsx
│   ├── BlogPost.test.jsx      # 4 用例 — 详情组件 + 路由参数
│   ├── About.jsx
│   └── NotFound.jsx
├── App.jsx
├── App.test.jsx               # 5 用例 — 路由集成 + 用户交互
└── test/
    └── setup.js               # 全局 setup
```

合计 **4 文件 / 16 用例**。

### 4.2 各文件检查的能力

| 测试文件 | 关注层级 | 验证什么 |
|---|---|---|
| `src/data/posts.test.js` | **单元（纯函数 + 数据）** | `findPost` 命中 / 未命中；每条 post 字段齐全；slug 唯一 |
| `src/pages/BlogList.test.jsx` | **组件渲染** | 标题、卡片数量、按日期倒序、链接 `href` + 标签 |
| `src/pages/BlogPost.test.jsx` | **组件 + 路由参数** | 用 `<MemoryRouter>` + `<Route path="/posts/:slug">` 注入 slug；验证文章渲染、代码块 `<pre>`、未找到分支、返回链接 |
| `src/App.test.jsx` | **集成（路由 + 用户事件）** | 不同 `initialEntries` 下渲染对应页；`userEvent.click` 模拟点击列表卡片，断言跳转到详情页 |

### 4.3 设计取舍

- **`globals: false`**：每个测试文件显式 `import { describe, it, expect } from 'vitest'`。
  好处：ESLint 不需要额外 vitest globals 配置；坏处：必须手动注册
  RTL 的 `cleanup`（见 [§5.1](#51-rtl-自动-cleanup-未注册导致跨用例-dom-累积)）。
- **不替换 React Router**：测试用 `<MemoryRouter>` 驱动，与生产环境的
  `<HashRouter>` 是同一个库的不同壳子，行为高度一致。
- **不 mock 数据**：`posts.js` 是仓库内的纯模块，直接 import 实数据更接近真实场景。

### 4.4 覆盖率（已配置但未在 CI 强制）

`vite.config.js` 的 `test.coverage` 已就绪：

```js
coverage: {
  provider: 'v8',
  reporter: ['text', 'html'],
  include: ['src/**/*.{js,jsx}'],
  exclude: ['src/main.jsx', 'src/test/**', '**/*.test.{js,jsx}'],
}
```

本地查看：

```bash
npm run test:coverage     # 终端输出 + coverage/ 目录下 HTML 报告
```

CI 当前未强制阈值。如要门禁覆盖率，可加上 `thresholds`（见 [§6](#6-扩展建议)）。

---

## 5. 踩坑记录

### 5.1 RTL 自动 cleanup 未注册导致跨用例 DOM 累积

**现象**：`getByRole('link', { name: /返回首页/ })` 报 "found multiple elements"。

**根因**：`@testing-library/react` 通过检测全局 `afterEach` 来自动注册 `cleanup`。
当 Vitest `globals: false` 时这些钩子不在全局，于是 cleanup 不会注册，
上一个测试渲染的 DOM 会残留到下一个，命中重复元素。

**解决**：在 `src/test/setup.js` 里显式挂上：

```js
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

### 5.2 Windows 生成的 lockfile 在 Linux 上 `npm ci` 报 `EBADPLATFORM`

**现象**：

```
npm error code EBADPLATFORM
npm error notsup Unsupported platform for @esbuild/netbsd-arm64@0.28.1:
  wanted {"os":"netbsd","cpu":"arm64"} (current: {"os":"linux","cpu":"x64"})
```

**根因**：npm 11（本地 Windows）在生成 lockfile 时，把 esbuild 的平台可选二进制
（`@esbuild/<os>-<cpu>`）标记成必装而非 optional。
GitHub Actions 上 npm 10 严格模式的 `npm ci` 拿到这种 lockfile，发现"必装"的
NetBSD/arm64 包在 Linux/x64 装不上，直接报错退出。

**解决**：CI/CD workflow 把 `npm ci` 换成 `npm install --no-audit --no-fund`。
`npm install` 仍会按 lockfile 安装，但宽容跳过平台不匹配的可选包，行为正确，
对构建零影响。

> 兼容 npm 11 的彻底方案是在 Linux 上重新生成一次 lockfile（让 npm 正确标记
> optional），但日常仅 Windows 协作的项目现实意义有限。

### 5.3 私有仓库无法启用 Pages

**现象**：仓库初次推送时按计划是 private。`gh api -X POST .../pages` 返回：

```
Your current plan does not support GitHub Pages for this repository.
```

**根因**：GitHub Free 计划下 Pages 仅对 public 仓库免费。

**解决**：把仓库改为 public（`gh repo edit ... --visibility public --accept-visibility-change-consequences`），
再启用 Pages。此项目示例代码无敏感信息，公开无碍。

---

## 6. 扩展建议

按收益从高到低排：

### 6.1 给 `main` 加分支保护

仓库 **Settings → Branches → Add rule**：

- 要求 PR 才能合入 `main`
- 勾选 "Require status checks to pass" → 选 `CI` workflow

这一步才让 CI **真正卡住**流程，否则 CI 失败也能 push。

### 6.2 强制覆盖率阈值

在 `vite.config.js` 的 `test.coverage` 加：

```js
thresholds: {
  lines: 80,
  functions: 80,
  branches: 70,
  statements: 80,
},
```

并在 `ci.yml` 把 Test 步骤改为：

```yaml
- name: Test (with coverage)
  run: npm run test:coverage
```

低于阈值会让 vitest 退出非 0，CI 即挂。

### 6.3 PR 中显示用例与覆盖率

- **JUnit + dorny/test-reporter**：在 PR 文件视图里贴行内注释，标记哪条用例挂。
  ```bash
  vitest run --reporter=junit --outputFile=test-report/junit.xml
  ```
- **codecov / coveralls**：上传 `coverage/lcov.info`，PR 自动补上覆盖率徽章。

### 6.4 加 e2e 层（可选）

当前测试都跑在 jsdom 里，不模拟真实浏览器。需要的话可加 Playwright：

```bash
npm i -D @playwright/test
npx playwright install --with-deps chromium
```

CI 可加一个 `npx playwright test` 步骤。建议放在独立 workflow，
和单元测试分开维护。

---

## 7. 开发者本地速查

```bash
# 开发
npm run dev               # http://localhost:5173

# 三件套(模拟 CI 本地跑一遍)
npm run lint
npm test
npm run build

# 测试相关
npm run test:watch        # 改文件自动重跑
npm run test:coverage     # 跑完打开 coverage/index.html

# Pages 部署链路相关
git push                  # 推到 main 后自动触发 CI 与 Deploy
gh run list               # 看最近的 workflow 状态
gh run view <id> --log    # 看具体 run 日志
gh run view <id> --log-failed   # 只看失败步骤
```

---

## 8. 当前一次完整流转的实测时间

| 阶段                    | 耗时   |
| ----------------------- | ------ |
| CI（lint + test + build）| ~27 s  |
| Deploy（build → Pages）  | ~48 s  |
| 站点 CDN 生效            | < 30 s |

从 `git push` 到 Pages 上看到新内容大约 **1 分半内**。
