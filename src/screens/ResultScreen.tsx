import { useState } from 'react'
import type { ShareOutcome } from '../App'
import { ASSETS } from '../assets/manifest'
import { FooterNote, ImgButton } from '../components/ui'
import { box, fmt } from '../lib/format'
import { REWARDS, type Reward } from '../lib/rewards'
import type { Wallet } from '../lib/storage'
import './result.css'

interface Props {
  score: number
  reward: Reward | null
  wallet: Wallet
  onUseCoupon: () => void
  onShare: () => Promise<ShareOutcome>
  onReplay: () => void
  onHome: () => void
}

export function ResultScreen({ score, reward, wallet, onUseCoupon, onShare, onReplay, onHome }: Props) {
  const [sharing, setSharing] = useState(false)
  const scoreText = fmt(score)
  const scoreSize = scoreText.length <= 5 ? 118 : scoreText.length <= 6 ? 98 : 82
  const heldBetter = wallet.coupon && (!reward || wallet.coupon.discount > reward.discount) ? wallet.coupon : null
  const canPlay = wallet.playsLeft > 0

  const share = async () => {
    if (sharing || wallet.shareBonusUsed) return
    setSharing(true)
    try {
      await onShare()
    } finally {
      setSharing(false)
    }
  }

  return (
    <section className="screen result" aria-label="게임 결과">
      <img src={ASSETS.brand.cloudLogo} alt="" style={box(188, -4, 335)} />
      <img src={ASSETS.brand.gameTitle} alt="Ice Cream Game" style={box(152, 106, 408)} />
      <h1 className="result__title" style={box(168, 280, 376)}>
        <img src={ASSETS.brand.resultTitle} alt="게임 결과 — 정말 잘했어요!" style={{ width: '100%', height: 'auto' }} />
      </h1>

      <div className="result__deco" aria-hidden="true">
        <img src={ASSETS.illustrations.coneMint} alt="" className="bob" style={{ ...box(14, 352, 182), rotate: '-8deg' }} />
        <img src={ASSETS.illustrations.coneStrawberry} alt="" className="bob bob--late" style={{ ...box(528, 362, 170), rotate: '10deg' }} />
        <img src={ASSETS.scoops.chocolate} alt="" className="bob bob--late" style={box(-6, 596, 178)} />
        <img src={ASSETS.scoops.strawberry} alt="" className="bob" style={box(560, 640, 158)} />
      </div>

      <div className="result__score glass-card" style={box(170, 452, 372, 206)}>
        <span className="result__score-label pink-pill">최종 점수</span>
        <svg className="result__crown" viewBox="0 0 40 30" aria-hidden="true">
          <path d="M3 9l9 7 8-13 8 13 9-7-4 18H7Z" fill="#ffd23f" stroke="#f2a900" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <p className="result__score-value" data-testid="final-score">
          <b className="display" style={{ fontSize: `calc(var(--u) * ${scoreSize})` }}>
            {scoreText}
          </b>
          <span className="display">점</span>
        </p>
      </div>

      <div className="result__ribbon" style={box(132, 650, 448, 110)}>
        <img src={ASSETS.panels.ribbon} alt="" />
        <span className="result__ribbon-text display">
          {reward ? (
            <>
              <i className="result__check" aria-hidden="true">
                ✓
              </i>
              {fmt(reward.score)}점 달성!
            </>
          ) : (
            <>{fmt(REWARDS[0].score - score)}점만 더!</>
          )}
        </span>
      </div>
      <p className="result__ribbon-sub" style={box(0, 752, 711)}>
        {reward ? '달콤한 리워드를 획득했어요!' : '500점부터 할인 쿠폰을 받을 수 있어요'}
      </p>

      {reward ? (
        <div className="coupon" style={box(84, 790, 544, 208)} data-testid="coupon">
          <img className="coupon__bg" src={ASSETS.panels.ticket} alt="" />
          <div className="coupon__stub">
            <img src={ASSETS.brand.cloudLogo} alt="" />
          </div>
          <div className="coupon__body">
            <span className="coupon__brand">배스킨라빈스</span>
            <b className="coupon__amount display" data-testid="coupon-amount">
              {fmt(reward.discount)}원
            </b>
            <span className="coupon__kind display">할인 쿠폰</span>
          </div>
        </div>
      ) : (
        <div className="coupon coupon--empty" style={box(84, 790, 544, 208)} data-testid="coupon-empty">
          <img className="coupon__bg" src={ASSETS.panels.ticket} alt="" />
          <div className="coupon__body coupon__body--empty">
            <b className="coupon__amount display">쿠폰 미획득</b>
            <span className="coupon__hint">
              다음 판에서 {fmt(REWARDS[0].score)}점을 넘기면
              <br />
              {fmt(REWARDS[0].discount)}원 할인 쿠폰이 자동 발급돼요
            </span>
          </div>
        </div>
      )}
      {heldBetter && (
        <p className="result__held" style={box(0, 994, 711)}>
          이전 기록으로 보유 중인 {fmt(heldBetter.discount)}원 쿠폰이 유지돼요
        </p>
      )}

      {wallet.coupon ? (
        <ImgButton
          label="쿠폰 사용하기"
          bg={ASSETS.buttons.primary}
          textSrc={ASSETS.buttons.textUseCoupon}
          textWidth={56}
          x={56}
          y={1014}
          w={600}
          h={118}
          onClick={onUseCoupon}
          testId="use-coupon"
        />
      ) : (
        <ImgButton
          label={canPlay ? '다시 플레이하기' : '참여 기회 없음'}
          bg={ASSETS.buttons.primary}
          textSrc={ASSETS.buttons.textPlayAgain}
          textWidth={58}
          x={56}
          y={1014}
          w={600}
          h={118}
          onClick={onReplay}
          testId="retry-primary"
        />
      )}

      <button
        type="button"
        className="share-img-btn"
        style={box(34, 1146, 644, 127)}
        onClick={share}
        disabled={wallet.shareBonusUsed || sharing}
        aria-disabled={wallet.shareBonusUsed || sharing}
        data-testid="share-btn"
        data-done={wallet.shareBonusUsed}
      >
        <img src={ASSETS.buttons.shareKakao} alt="" />
        {wallet.shareBonusUsed ? (
          <span className="share-img-btn__done display">
            공유 완료 · 남은 기회 {wallet.playsLeft}회
          </span>
        ) : (
          <span className="sr-only">친구에게 카카오톡으로 공유하면 게임 참여 기회 1회 추가</span>
        )}
      </button>

      {/* 하단 보조 버튼: 사용자 제작 이미지 (텍스트 포함). 버튼 영역 = 이미지 속 알약 모양 */}
      <button type="button" className="pill-btn" style={box(52, 1301, 296, 70)} onClick={onReplay} data-testid="replay-btn">
        <img src={ASSETS.buttons.replayPill} alt="" />
        <span className="sr-only">다시 플레이하기, 남은 기회</span>
        <em className="pill-btn__count display" data-testid="plays-left">
          {canPlay ? `${wallet.playsLeft}회` : '0회'}
        </em>
      </button>
      <button type="button" className="pill-btn" style={box(364, 1301, 296, 70)} onClick={onHome}>
        <img src={ASSETS.buttons.homePill} alt="" />
        <span className="sr-only">홈으로 가기</span>
      </button>
      <FooterNote />
    </section>
  )
}
