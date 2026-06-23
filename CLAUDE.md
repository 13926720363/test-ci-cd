# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

A Vite 5 + React 18 mini-blog whose real subject is the CI/CD wiring around it: GitHub Actions runs lint+test+build on every push/PR, and a separate workflow deploys `dist/` to GitHub Pages at <https://13926720363.github.io/test-ci-cd/>. Application code (`src/`) is intentionally small — three pages and a `posts.js` data module — and exists mainly to give the workflows something real to chew on.

Authoritative deep-dive: [`docs/ci-cd.md`](./docs/ci-cd.md). Read it before changing anything in `.github/workflows/` or `vite.config.js`; it documents both the rationale and the failure modes that were already hit.

## Commands

```bash
npm run dev              # vite dev server, http://localhost:5173
npm run lint             # ESLint — --max-warnings 0, so any warning fails CI
npm test                 # vitest run (one-shot, what CI runs)
npm run test:watch       # vitest in watch mode
npm run test:coverage    # v8 coverage → terminal + coverage/index.html
npm run build            # vite build → dist/
npm run preview          # serve the production build locally

# Single test file / single test name
npx vitest run src/pages/BlogPost.test.jsx
npx vitest run -t "renders 404 for an unknown route"
```

The "what CI does locally" trio is `npm run lint && npm test && npm run build` — run it before pushing anything non-trivial.

## Architecture

- **Routing.** `src/main.jsx` wraps `<App />` in `<HashRouter>`. This is deliberate — GitHub Pages is plain static hosting with no SPA fallback, so `BrowserRouter` would 404 on refresh of any non-root path. Tests substitute `<MemoryRouter>` for the same reason. Don't switch to `BrowserRouter` without also addressing the Pages fallback.
- **Base path injection.** `vite.config.js` reads `process.env.VITE_BASE` (default `/`). The deploy workflow sets it to `/<repo>/` so built asset URLs match the Pages sub-path. Locally `dev` and `build` use `/`, which is correct for `npm run preview` but not for what gets deployed — that path is supplied by CI, not by a committed file.
- **Data layer.** `src/data/posts.js` is a hand-edited array of post objects plus `findPost(slug)`. Pages import it directly; there's no fetch, no MDX, no CMS. Adding a post = adding an entry. `slug` must stay unique (a test enforces this).
- **Content rendering.** `BlogPost.jsx` ships a tiny ad-hoc "markdown": split on ``` for code blocks, double-newline for paragraphs. It is *not* a real parser; don't extend it incrementally — swap to a real MDX/markdown library if richer content is needed.
- **CI/CD topology.** Two independent workflows run in parallel on every push to `main`:
  - `.github/workflows/ci.yml` — `Lint & Build` job: install → lint → test → build. This is the quality gate; uploads no artifact.
  - `.github/workflows/deploy.yml` — separate build (with `VITE_BASE` set) → `upload-pages-artifact` → `deploy-pages`. Also triggered by `workflow_dispatch`.
  The wiring that makes CI actually gate Deploy is the **main branch protection rule**, not workflow dependencies. See "Branch protection" below.

## Hard-won constraints (don't undo without reading the why)

- **CI uses `npm install`, not `npm ci`.** A Windows-generated lockfile (npm 11) marks esbuild's platform-specific optional packages (`@esbuild/<os>-<cpu>`) as required, so `npm ci` on Linux fails with `EBADPLATFORM`. `npm install` follows the lockfile but tolerates platform-mismatched optionals. Don't "fix" this back to `npm ci` unless you regenerate the lockfile on Linux. (`docs/ci-cd.md` §5.2)
- **Vitest runs with `globals: false`.** Every test file explicitly `import { describe, it, expect } from 'vitest'`. RTL's auto-cleanup only registers itself when Vitest globals are on, so `src/test/setup.js` manually wires `afterEach(cleanup)`. If you remove that, tests start finding duplicate DOM nodes across cases. Keep the explicit registration. (`docs/ci-cd.md` §5.1)
- **Branch protection is on for `main`.** No direct push; must go through a PR. The required status check is named **`Lint & Build`** — that's the *job* name (`jobs.build.name` in `ci.yml`), not the workflow name. Rename that job and the protection rule must be updated in lockstep or every PR will sit in "expected — Lint & Build" forever.
- **Pages requires a public repo on Free plan.** This repo is intentionally public. If you flip it to private, the deploy workflow will start failing on `configure-pages`.

## Daily workflow on a protected `main`

```bash
git checkout -b feat/xxx
# edit, commit
git push -u origin feat/xxx
gh pr create --fill --base main
gh pr checks --watch                  # wait for "Lint & Build"
gh pr merge --squash --delete-branch  # zero-approval self-merge is allowed
```

A merge to `main` triggers both CI and Deploy independently; from push to live Pages is typically ~1.5 minutes.
