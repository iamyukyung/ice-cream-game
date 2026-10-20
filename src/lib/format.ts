import type { CSSProperties } from 'react'

export const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR')
export const won = (n: number) => `₩ ${fmt(n)}`

/** 아트보드(711 기준) 단위 → CSS 길이 */
export const u = (n: number) => `calc(var(--u) * ${n})`

/** 시안 좌표(아트보드 단위)로 절대 배치 */
export function box(x: number, y: number, w?: number, h?: number): CSSProperties {
  const s: CSSProperties = { position: 'absolute', left: u(x), top: u(y) }
  if (w !== undefined) s.width = u(w)
  if (h !== undefined) s.height = u(h)
  return s
}
