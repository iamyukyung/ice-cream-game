import { ASSETS } from '../assets/manifest'

/**
 * 콜라이더 파트 (이미지 박스 기준 비율 좌표)
 * - ellipse: 중심(cx, cy)과 반지름(rx, ry). x값은 이미지 폭, y값은 이미지 높이에 대한 비율
 * - poly: 볼록 다각형 꼭짓점 [x, y] 비율
 */
export type ShapePart =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'poly'; pts: [number, number][] }

/**
 * 머지 단계 데이터 — 단계마다 고유 이미지 1개, 크기도 1개로 고정.
 * 스쿱 → 콘 → 컵 순서로 커집니다.
 * 이미지 교체: src 경로와 aspect(높이/폭), shape(콜라이더 비율)만 맞추면 됩니다.
 */
export interface ScoopLevel {
  level: number
  name: string
  family: 'scoop' | 'cone' | 'cup'
  src: string
  /** 화면/물리 공통 이미지 폭 (게임 월드 단위 = 711 아트보드 단위) */
  width: number
  /** 이미지 높이/폭 비율 (public/assets 원본 기준) */
  aspect: number
  shape: ShapePart[]
  /** 이 단계가 "만들어질 때" 얻는 점수 */
  mergeScore: number
}

const SCOOP_STRAWBERRY: ShapePart[] = [{ kind: 'ellipse', cx: 0.5, cy: 0.5, rx: 0.48, ry: 0.47 }]
const SCOOP_CHOCOLATE: ShapePart[] = [{ kind: 'ellipse', cx: 0.5, cy: 0.53, rx: 0.48, ry: 0.44 }]
const CONE_STRAWBERRY: ShapePart[] = [
  { kind: 'ellipse', cx: 0.5, cy: 0.34, rx: 0.48, ry: 0.33 },
  { kind: 'poly', pts: [[0.22, 0.6], [0.8, 0.6], [0.53, 0.995]] },
]
const CONE_MINT: ShapePart[] = [
  { kind: 'ellipse', cx: 0.5, cy: 0.36, rx: 0.47, ry: 0.34 },
  { kind: 'poly', pts: [[0.25, 0.6], [0.75, 0.6], [0.5, 0.995]] },
]
const CUP_RAINBOW: ShapePart[] = [
  { kind: 'ellipse', cx: 0.5, cy: 0.38, rx: 0.47, ry: 0.28 },
  { kind: 'poly', pts: [[0.0, 0.57], [1.0, 0.57], [0.87, 0.995], [0.13, 0.995]] },
]
const CUP_SUNDAE: ShapePart[] = [
  { kind: 'ellipse', cx: 0.5, cy: 0.42, rx: 0.46, ry: 0.25 },
  { kind: 'poly', pts: [[0.03, 0.6], [0.97, 0.6], [0.88, 0.995], [0.12, 0.995]] },
]

const SCOOP_COOKIES: ShapePart[] = [{ kind: 'ellipse', cx: 0.5, cy: 0.53, rx: 0.48, ry: 0.45 }]
const SCOOP_BLUE: ShapePart[] = [{ kind: 'ellipse', cx: 0.5, cy: 0.53, rx: 0.48, ry: 0.45 }]
const SCOOP_PISTACHIO: ShapePart[] = [{ kind: 'ellipse', cx: 0.5, cy: 0.52, rx: 0.48, ry: 0.46 }]
const CONE_MANGO: ShapePart[] = [
  { kind: 'ellipse', cx: 0.5, cy: 0.33, rx: 0.48, ry: 0.32 },
  { kind: 'poly', pts: [[0.24, 0.6], [0.76, 0.6], [0.5, 0.995]] },
]

const S = ASSETS.scoops
const I = ASSETS.illustrations
export const LEVELS: readonly ScoopLevel[] = [
  { level: 0, name: '딸기 스쿱', family: 'scoop', src: S.strawberry, width: 120, aspect: 502 / 512, shape: SCOOP_STRAWBERRY, mergeScore: 0 },
  { level: 1, name: '초코 스쿱', family: 'scoop', src: S.chocolate, width: 133, aspect: 453 / 512, shape: SCOOP_CHOCOLATE, mergeScore: 8 },
  { level: 2, name: '쿠키앤크림 스쿱', family: 'scoop', src: S.cookiesCream, width: 146, aspect: 446 / 512, shape: SCOOP_COOKIES, mergeScore: 15 },
  { level: 3, name: '블루 스쿱', family: 'scoop', src: S.blue, width: 161, aspect: 453 / 512, shape: SCOOP_BLUE, mergeScore: 25 },
  { level: 4, name: '피스타치오 스쿱', family: 'scoop', src: S.pistachio, width: 178, aspect: 443 / 512, shape: SCOOP_PISTACHIO, mergeScore: 40 },
  { level: 5, name: '딸기 콘', family: 'cone', src: I.coneStrawberry, width: 186, aspect: 895 / 700, shape: CONE_STRAWBERRY, mergeScore: 70 },
  { level: 6, name: '민트 콘', family: 'cone', src: I.coneMint, width: 204, aspect: 871 / 700, shape: CONE_MINT, mergeScore: 110 },
  { level: 7, name: '망고 콘', family: 'cone', src: I.coneMango, width: 222, aspect: 919 / 700, shape: CONE_MANGO, mergeScore: 170 },
  { level: 8, name: 'BR 컵', family: 'cup', src: I.cupRainbow, width: 246, aspect: 929 / 700, shape: CUP_RAINBOW, mergeScore: 270 },
  { level: 9, name: '선데 컵', family: 'cup', src: I.cupSundae, width: 270, aspect: 1003 / 700, shape: CUP_SUNDAE, mergeScore: 440 },
]

export const MAX_LEVEL = LEVELS.length - 1
/** 최고 단계(선데 컵)는 더 이상 합쳐지지 않고 통에 남음 → 통이 차면 게임 종료 */
export const MAX_LEVEL_MERGES = false

/** 드롭되는 건 작은 스쿱 3종만 */
export const SPAWN_WEIGHTS: readonly [level: number, weight: number][] = [
  [0, 45],
  [1, 33],
  [2, 22],
]

export function randomSpawnLevel(rand: () => number = Math.random): number {
  const total = SPAWN_WEIGHTS.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [lvl, w] of SPAWN_WEIGHTS) {
    r -= w
    if (r < 0) return lvl
  }
  return SPAWN_WEIGHTS[0][0]
}

export const levelSrc = (l: ScoopLevel) => l.src
export const levelHeight = (l: ScoopLevel) => l.width * l.aspect
/** 조준 시 좌우 한계에 쓰는 반폭 */
export const levelHalfWidth = (l: ScoopLevel) => {
  let m = 0
  for (const p of l.shape) {
    if (p.kind === 'ellipse') m = Math.max(m, Math.abs(p.cx - 0.5) + p.rx)
    else for (const [x] of p.pts) m = Math.max(m, Math.abs(x - 0.5))
  }
  return m * l.width
}
