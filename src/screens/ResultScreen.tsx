import { useState } from 'react'
import type { ShareOutcome } from '../App'
import { ASSETS } from '../assets/manifest'
import { FooterNote, ImgButton } from '../components/ui'
import { box, fmt } from '../lib/format'
import { REWARDS, type Reward } from '../lib/rewards'
import { BASE_PLAYS, type Wallet } from '../lib/storage'
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
  const totalPlays = BASE_PLAYS + (wallet.shareBonusUsed ? 1 : 0)

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
      {/* Figma '03 결과' (10/22 수정본) 좌표 */}
      <img src={ASSETS.brand.cloudLogo} alt="" style={box(179, -6, 335)} />
      <img src={ASSETS.brand.gameTitle} alt="Ice Cream Game" style={box(143, 107, 408)} />

      <div className="result__deco" aria-hidden="true">
        <img src={ASSETS.scoops.chocolate} alt="" className="bob bob--late" style={box(-6, 606, 178)} />
        <img src={ASSETS.scoops.strawberry} alt="" className="bob" style={box(560, 650, 158)} />
        <img src={ASSETS.illustrations.coneMint} alt="" className="bob" style={{ ...box(10, 352, 190), rotate: '-8deg' }} />
        <img src={ASSETS.illustrations.coneStrawberry} alt="" className="bob bob--late" style={{ ...box(561, 336, 180), rotate: '10deg' }} />
      </div>

      <h1 className="result__title" style={box(132, 281, 416)}>
        <img src={ASSETS.brand.resultTitle} alt="게임 결과 — 정말 잘했어요!" style={{ width: '100%', height: 'auto' }} />
      </h1>

      <div className="result-card glass-card result-score" style={box(70, 491, 554, 206)}>
        <span className="result-card__label pink-pill">최종 점수</span>
        <p className="result-score__value" data-testid="final-score">
          <b className="display" style={{ fontSize: `calc(var(--u) * ${scoreSize})` }}>
            {scoreText}
          </b>
          <span className="display">점</span>
        </p>
      </div>

      <div className="result-card glass-card" style={box(77, 729, 550, 278)} data-testid={reward ? 'coupon' : 'coupon-empty'}>
        <span className="result-card__label pink-pill">리워드</span>
        <div className="result-ticket" data-empty={!reward}>
          <img src={ASSETS.panels.ticket} alt="" />
          {reward ? (
            <span className="result-ticket__text display">
              <b data-testid="coupon-amount">{fmt(reward.discount)}원</b>
              할인쿠폰
            </span>
          ) : (
            <span className="result-ticket__text display">
              <b>쿠폰 미획득</b>
              {fmt(REWARDS[0].score)}점부터 발급
            </span>
          )}
        </div>
        <p className="result-card__caption display">
          {reward
            ? `배스킨라빈스 ${fmt(reward.discount)}원 할인쿠폰`
            : heldBetter
              ? `보유 중인 ${fmt(heldBetter.discount)}원 쿠폰은 그대로 사용 가능`
              : `${fmt(REWARDS[0].score)}점 달성 시 ${fmt(REWARDS[0].discount)}원 쿠폰 자동 발급`}
        </p>
        {reward && heldBetter && <p className="result-card__note">이전 기록의 {fmt(heldBetter.discount)}원 쿠폰이 유지돼요</p>}
      </div>

      {wallet.coupon ? (
        <ImgButton
          label="쿠폰 사용하기"
          bg={ASSETS.buttons.primary}
          textSrc={ASSETS.buttons.textUseCoupon}
          textWidth={56}
          x={68}
          y={1029}
          w={574}
          h={112}
          onClick={onUseCoupon}
          testId="use-coupon"
        />
      ) : (
        <ImgButton
          label={canPlay ? '다시 플레이하기' : '참여 기회 없음'}
          bg={ASSETS.buttons.primary}
          textSrc={ASSETS.buttons.textPlayAgain}
          textWidth={58}
          x={68}
          y={1029}
          w={574}
          h={112}
          onClick={onReplay}
          testId="retry-primary"
        />
      )}

      <button
        type="button"
        className="share-img-btn"
        style={box(46, 1132, 604, 170)}
        onClick={share}
        disabled={wallet.shareBonusUsed || sharing}
        aria-disabled={wallet.shareBonusUsed || sharing}
        data-testid="share-btn"
      >
        <img src={ASSETS.buttons.shareKakao} alt="" />
        <span className="sr-only">친구에게 카카오톡으로 공유하면 게임 참여 기회 1회 추가</span>
      </button>

      <button type="button" className="pill-btn" style={box(68, 1292, 276, 72)} onClick={onReplay} data-testid="replay-btn">
        <img src={ASSETS.buttons.retryBlank} alt="" />
        <span className="pill-btn__label">
          재도전{' '}
          <span data-testid="plays-left" aria-label={`남은 기회 ${wallet.playsLeft}회, 전체 ${totalPlays}회`}>
            ({wallet.playsLeft}/{totalPlays})
          </span>
        </span>
      </button>
      <button type="button" className="pill-btn" style={box(366, 1291, 276, 74)} onClick={onHome}>
        <img src={ASSETS.buttons.homeRef} alt="" />
        <span className="sr-only">홈으로 가기</span>
      </button>
      <FooterNote />
    </section>
  )
}
