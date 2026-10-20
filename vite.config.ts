import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' → dist/를 어떤 하위 경로에 올려도 동작
export default defineConfig({
  base: './',
  plugins: [react()],
  // Railway 등 배포 환경: `npm start`(vite preview)가 외부 도메인 요청을 받도록 허용
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
