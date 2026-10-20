import { describe, expect, it } from 'vitest'
import { bestReward, couponDiscount, nextReward, rewardProgress } from './rewards'

describe('bestReward — 임계치 직전/직후', () => {
  it.each([
    [0, null],
    [499, null],
    [500, 2000],
    [501, 2000],
    [999, 2000],
    [1000, 3000],
    [1280, 3000],
    [1499, 3000],
    [1500, 5000],
    [9999, 5000],
  ])('%i점 → %s', (score, discount) => {
    expect(bestReward(score)?.discount ?? null).toBe(discount)
  })
})

describe('nextReward / progress', () => {
  it('820점: 1,000점까지 180점, 82%', () => {
    const p = rewardProgress(820)
    expect(p.current?.discount).toBe(2000)
    expect(p.next?.score).toBe(1000)
    expect(p.remaining).toBe(180)
    expect(p.ratio).toBeCloseTo(0.82)
  })
  it('499 → 다음 500, 1점 남음', () => {
    expect(rewardProgress(499).remaining).toBe(1)
    expect(nextReward(499)?.score).toBe(500)
  })
  it('1500 이상은 다음 없음, 진행 100%', () => {
    const p = rewardProgress(1500)
    expect(p.next).toBeNull()
    expect(p.ratio).toBe(1)
  })
})

describe('couponDiscount', () => {
  it('3,700원 - 3,000원 쿠폰', () => {
    expect(3700 - couponDiscount(3700, { score: 1000, discount: 3000 })).toBe(700)
  })
  it('할인액은 상품가를 넘지 않음', () => {
    expect(couponDiscount(3700, { score: 1500, discount: 5000 })).toBe(3700)
  })
  it('쿠폰 없음', () => {
    expect(couponDiscount(3700, null)).toBe(0)
  })
})
