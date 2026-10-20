import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' → dist/를 어떤 하위 경로(GitHub Pages 등)에 올려도 동작
export default defineConfig({
  base: './',
  plugins: [react()],
})
