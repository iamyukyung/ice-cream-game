import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.tsx'

// iOS Safari: 핀치 줌/더블탭 줌 방지 (게임 드래그 우선)
document.addEventListener('gesturestart', (e) => e.preventDefault())

// 입력 방식 추적: 키보드 사용 중에만 게임통 포커스 테두리를 보여줌
const NAV_KEYS = new Set(['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'])
document.addEventListener(
  'keydown',
  (e) => {
    if (NAV_KEYS.has(e.key)) document.documentElement.dataset.input = 'keyboard'
  },
  true,
)
document.addEventListener('pointerdown', () => delete document.documentElement.dataset.input, true)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
