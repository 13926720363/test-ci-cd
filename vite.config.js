import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// 部署到 GitHub Pages 时,base 需要指定为仓库名(在 GitHub Actions 中通过环境变量传入)
export default defineConfig(() => {
  const base = process.env.VITE_BASE || '/'
  return {
    base,
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
