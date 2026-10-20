import type { Reward } from './rewards'

export const BASE_PLAYS = 3

export interface Wallet {
  /** 남은 참여 기회 */
  playsLeft: number
  /** 공유 보상(1회 추가)을 이미 받았는지 */
  shareBonusUsed: boolean
  /** 보유 쿠폰 1장 (상위 금액으로만 승급) */
  coupon: Reward | null
  bestScore: number
}

const KEY = 'icg-demo-wallet-v1'

export const freshWallet = (): Wallet => ({
  playsLeft: BASE_PLAYS,
  shareBonusUsed: false,
  coupon: null,
  bestScore: 0,
})

export function loadWallet(): Wallet {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return freshWallet()
    const w = JSON.parse(raw) as Partial<Wallet>
    return { ...freshWallet(), ...w }
  } catch {
    return freshWallet()
  }
}

export function saveWallet(w: Wallet) {
  try {
    localStorage.setItem(KEY, JSON.stringify(w))
  } catch {
    /* private mode 등: 메모리 상태로만 동작 */
  }
}
