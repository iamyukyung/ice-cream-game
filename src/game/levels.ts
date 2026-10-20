import { ASSETS } from '../assets/manifest'

/**
 * 스쿱 스킨: 제공된 원형 스쿱 PNG 3종.
 * - scale: 콜라이더 지름 대비 이미지 가로 배율 (PNG 여백/납작한 형태 보정)
 * - oy: 콜라이더 지름 대비 세로 오프셋
 */
export interface SkinDef {
  src: string
  scale: number
  oy: number
}

export const SKINS = {
  strawberry: { src: ASSETS.scoops.strawberry, scale: 1.05, oy: 0 },
  mint: { src: ASSETS.scoops.mint, scale: 1.16, oy: 0.01 },
  chocolate: { src: ASSETS.scoops.chocolate, scale: 1.1, oy: 0.005 },
} satisfies Record<string, SkinDef>

export type SkinKey = keyof typeof SKINS

/**
 * 머지 단계 데이터.
 * 상위 단계용 전용 PNG가 생기면 `src`에 경로만 넣으면 해당 스킨 대신 사용됩니다
 * (필요시 `scale`/`oy`로 보정).
 */
export interface ScoopLevel {
  level: number
  name: string
  /** 물리 콜라이더 반지름 (게임 월드 단위 = 711 아트보드 단위) */
  radius: number
  /** 이 단계가 "만들어질 때" 얻는 점수 */
  mergeScore: number
  skin: SkinKey
  /** 시연용 스킨 재활용 시 기본 회전(rad) */
  rotation: number
  /** 상위 단계 강조 오라 색 (없으면 미표시) */
  aura?: string
  src?: string
  scale?: number
  oy?: number
}

export const LEVELS: readonly ScoopLevel[] = [
  { level: 0, name: '미니 딸기', radius: 25, mergeScore: 0, skin: 'strawberry', rotation: 0 },
  { level: 1, name: '미니 민트', radius: 34, mergeScore: 10, skin: 'mint', rotation: 0 },
  { level: 2, name: '미니 초코', radius: 45, mergeScore: 20, skin: 'chocolate', rotation: 0 },
  { level: 3, name: '딸기', radius: 55, mergeScore: 35, skin: 'strawberry', rotation: 0.35 },
  { level: 4, name: '민트', radius: 67, mergeScore: 55, skin: 'mint', rotation: -0.3 },
  { level: 5, name: '초코', radius: 79, mergeScore: 80, skin: 'chocolate', rotation: 0.4 },
  { level: 6, name: '킹 딸기', radius: 93, mergeScore: 110, skin: 'strawberry', rotation: -0.5, aura: 'rgba(255,120,190,0.45)' },
  { level: 7, name: '킹 민트', radius: 109, mergeScore: 150, skin: 'mint', rotation: 0.55, aura: 'rgba(110,230,200,0.45)' },
  { level: 8, name: '킹 초코', radius: 126, mergeScore: 200, skin: 'chocolate', rotation: -0.6, aura: 'rgba(255,190,90,0.5)' },
  { level: 9, name: '하프갤런 딸기', radius: 145, mergeScore: 260, skin: 'strawberry', rotation: 3.14, aura: 'rgba(255,220,80,0.6)' },
  { level: 10, name: '패밀리 민트', radius: 163, mergeScore: 340, skin: 'mint', rotation: 3.14, aura: 'rgba(255,230,90,0.7)' },
]

export const MAX_LEVEL = LEVELS.length - 1
/** 최고 단계 두 개가 합쳐지면 사라지며 받는 보너스 */
export const MAX_MERGE_BONUS = 500

/** 드롭 가능한 단계와 가중치 */
export const SPAWN_WEIGHTS: readonly [level: number, weight: number][] = [
  [0, 36],
  [1, 30],
  [2, 22],
  [3, 12],
]

export function randomSpawnLevel(rand: () => number = Math.random): number {
  const total = SPAWN_WEIGHTS.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [lvl, w] of SPAWN_WEIGHTS) {
    r -= w
    if (r < 0) return lvl
  }
  return 0
}

export function levelSrc(l: ScoopLevel) {
  return l.src ?? SKINS[l.skin].src
}
export function levelFit(l: ScoopLevel) {
  const s = SKINS[l.skin]
  return { scale: l.scale ?? s.scale, oy: l.oy ?? s.oy }
}
