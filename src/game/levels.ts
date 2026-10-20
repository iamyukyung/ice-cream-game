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

export const LEVELS: readonly ScoopLevel[] = [
  { level: 0, name: '딸기 스쿱', family: 'scoop', src: ASSETS.scoops.strawberry, width: 104, aspect: 502 / 512, shape: SCOOP_STRAWBERRY, mergeScore: 0 },
  { level: 1, name: '초코 스쿱', family: 'scoop', src: ASSETS.scoops.chocolate, width: 126, aspect: 453 / 512, shape: SCOOP_CHOCOLATE, mergeScore: 5 },
  { level: 2, name: '딸기 콘', family: 'cone', src: ASSETS.illustrations.coneStrawberry, width: 150, aspect: 895 / 700, shape: CONE_STRAWBERRY, mergeScore: 15 },
  { level: 3, name: '민트 콘', family: 'cone', src: ASSETS.illustrations.coneMint, width: 176, aspect: 871 / 700, shape: CONE_MINT, mergeScore: 40 },
  { level: 4, name: 'BR 컵', family: 'cup', src: ASSETS.illustrations.cupRainbow, width: 226, aspect: 929 / 700, shape: CUP_RAINBOW, mergeScore: 100 },
  { level: 5, name: '선데 컵', family: 'cup', src: ASSETS.illustrations.cupSundae, width: 258, aspect: 1003 / 700, shape: CUP_SUNDAE, mergeScore: 220 },
]

export const MAX_LEVEL = LEVELS.length - 1
/** 최고 단계(선데 컵)는 더 이상 합쳐지지 않고 통에 남음 → 통이 차면 게임 종료 */
export const MAX_LEVEL_MERGES = false

/** 드롭되는 건 스쿱 2종만 */
export const SPAWN_WEIGHTS: readonly [level: number, weight: number][] = [
  [0, 62],
  [1, 38],
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
