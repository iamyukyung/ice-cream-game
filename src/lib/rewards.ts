import { ASSETS } from '../assets/manifest'

export interface Reward {
  score: number
  discount: number
}

/** 리워드 구간 (스펙 그대로). 점수 오름차순이어야 합니다. */
export const REWARDS: readonly Reward[] = [
  { score: 500, discount: 2000 },
  { score: 1000, discount: 3000 },
  { score: 1500, discount: 5000 },
] as const

/** 구간별 썸네일 (시작 화면 리워드 카드 / 게임 HUD 현재 리워드) */
export const REWARD_ART: Record<number, string> = {
  500: ASSETS.scoops.strawberry,
  1000: ASSETS.illustrations.cupRainbow,
  1500: ASSETS.illustrations.cupSundae,
}

/** 달성한 최고 구간 1개 (없으면 null). 중복 발급 없이 상위 금액으로만 승급. */
export function bestReward(score: number): Reward | null {
  let best: Reward | null = null
  for (const r of REWARDS) if (score >= r.score) best = r
  return best
}

/** 다음 목표 구간 (최고 구간 달성 시 null) */
export function nextReward(score: number): Reward | null {
  return REWARDS.find((r) => score < r.score) ?? null
}

export interface RewardProgress {
  current: Reward | null
  next: Reward | null
  remaining: number
  /** 0~1, 시안처럼 `점수 / 다음 목표` 비율 */
  ratio: number
}

export function rewardProgress(score: number): RewardProgress {
  const s = Math.max(0, Math.floor(score))
  const current = bestReward(s)
  const next = nextReward(s)
  if (!next) return { current, next, remaining: 0, ratio: 1 }
  return { current, next, remaining: next.score - s, ratio: Math.min(1, s / next.score) }
}

/** 쿠폰 할인액은 상품 합계를 넘지 않음 */
export function couponDiscount(subtotal: number, coupon: Reward | null): number {
  if (!coupon) return 0
  return Math.max(0, Math.min(subtotal, coupon.discount))
}
