// 全局测试 setup —— 引入 jest-dom 自定义匹配器,
// 让我们能用 expect(el).toBeInTheDocument() 之类更可读的断言。
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// 我们用 globals: false(显式 import describe/it/expect),
// 这种模式下 RTL 的自动 cleanup 不会注册,需要手动挂上,
// 否则跨用例的 DOM 会累积,导致 getByRole 命中多个元素。
afterEach(() => {
  cleanup()
})
