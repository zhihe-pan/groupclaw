import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Actions 里设置 VITE_BASE_PATH=/groupclaw/ 与仓库 Pages 子路径一致；本地默认 /
const rawBase = process.env.VITE_BASE_PATH ?? '/'
const base =
  rawBase === '/' || rawBase === ''
    ? '/'
    : rawBase.endsWith('/')
      ? rawBase
      : `${rawBase}/`

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
