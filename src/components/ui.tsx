import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { ASSETS } from '../assets/manifest'
import { box, u } from '../lib/format'

interface ImgButtonProps {
  label: string
  bg: string
  /** IMAGE_TEXT PNG. 없으면 children을 CSS 텍스트로 렌더 */
  textSrc?: string
  /** 텍스트 이미지 가로 폭 (버튼 대비 %) */
  textWidth?: number
  x: number
  y: number
  w: number
  h: number
  onClick?: () => void
  disabled?: boolean
  children?: ReactNode
  className?: string
  style?: CSSProperties
  testId?: string
}

export function ImgButton(p: ImgButtonProps) {
  return (
    <button
      type="button"
      className={`img-btn ${p.className ?? ''}`}
      style={{ ...box(p.x, p.y, p.w, p.h), ...p.style }}
      onClick={p.onClick}
      disabled={p.disabled}
      data-testid={p.testId}
    >
      <img className="img-btn__bg" src={p.bg} alt="" />
      <span className="img-btn__content">
        {p.textSrc ? (
          <>
            <img src={p.textSrc} alt="" style={{ width: `${p.textWidth ?? 70}%`, height: 'auto' }} />
            <span className="sr-only">{p.label}</span>
          </>
        ) : (
          p.children
        )}
      </span>
    </button>
  )
}

type IconKind = 'back' | 'gift' | 'settings' | 'home'

export function IconButton({
  kind,
  label,
  x,
  y,
  size = 62,
  onClick,
}: {
  kind: IconKind
  label: string
  x: number
  y: number
  size?: number
  onClick?: () => void
}) {
  return (
    <button type="button" className="icon-btn" style={box(x, y, size, size)} onClick={onClick} aria-label={label}>
      {kind === 'home' ? (
        <>
          <img src={ASSETS.buttons.circleWhite} alt="" />
          <span className="icon-btn__home">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3.5 11 12 4l8.5 7" stroke="#f72486" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 9.5V20h12V9.5" fill="#f72486" />
              <rect x="10" y="14" width="4" height="6" rx="1" fill="#fff" />
            </svg>
          </span>
        </>
      ) : (
        <img src={ASSETS.icons[kind]} alt="" />
      )}
    </button>
  )
}

export function FooterNote({ y }: { y?: number }) {
  return (
    <p className="footer-note" style={y !== undefined ? { top: u(y), bottom: 'auto' } : undefined}>
      비공식 개인 포트폴리오 데모 · 실제 브랜드·결제·공유 서비스와 무관
    </p>
  )
}

export function Brand({
  logo,
  title,
}: {
  logo: { x: number; y: number; w: number }
  title: { x: number; y: number; w: number }
}) {
  return (
    <>
      <img src={ASSETS.brand.cloudLogo} alt="" style={box(logo.x, logo.y, logo.w)} />
      <h1 style={{ margin: 0 }}>
        <img src={ASSETS.brand.gameTitle} alt="Ice Cream Game" style={box(title.x, title.y, title.w)} />
      </h1>
    </>
  )
}

/** 접근 가능한 네이티브 dialog 래퍼 */
export function Dialog({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  labelledBy: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const openRef = useRef(open)
  useEffect(() => {
    openRef.current = open
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      if (typeof d.showModal === 'function') d.showModal()
      else d.setAttribute('open', '')
    } else if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={labelledBy}
      // 프로그램적으로 닫힌 경우(open=false)에는 onClose를 다시 부르지 않음
      onClose={() => {
        if (openRef.current) onClose()
      }}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      {open && <div className="dialog__panel">{children}</div>}
    </dialog>
  )
}

export function Toast({ message, id }: { message: string | null; id: number }) {
  if (!message) return null
  return (
    <div key={id} className="toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}
