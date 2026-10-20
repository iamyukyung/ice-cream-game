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
      {/* Figma '03 결과' 기준 배치 (711 아트보드 좌표) */}
      <div className="result__deco" aria-hidden="true">
        <img src={ASSETS.scoops.chocolate} alt="" className="bob bob--late" style={box(-6, 506, 178)} />
        <img src={ASSETS.scoops.strawberry} alt="" className="bob" style={box(560, 550, 158)} />
      </div>

      <h1 className="result__title" style={box(117, 123, 468)}>
        <img src={ASSETS.brand.resultTitle} alt="게임 결과 — 정말 잘했어요!" style={{ width: '100%', height: 'auto' }} />
      </h1>

      {wallet.coupon ? (
        <ImgButton
          label="쿠폰 사용하기"
          bg={ASSETS.buttons.primary}
          textSrc={ASSETS.buttons.textUseCoupon}
          textWidth={56}
          x={52}
          y={949}
          w={608}
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
          x={52}
          y={949}
          w={608}
          h={118}
          onClick={onReplay}
          testId="retry-primary"
        />
      )}

      <button type="button" className="sub-btn" style={box(52, 1098, 296, 84)} onClick={onReplay} data-testid="replay-btn">
        <img src={ASSETS.buttons.secondary} alt="" />
        <span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.6-5.9" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M20.5 3.5v5h-5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          다시 플레이하기
          <em data-testid="plays-left">{canPlay ? `${wallet.playsLeft}회` : '0회'}</em>
        </span>
      </button>
      <button type="button" className="sub-btn" style={box(364, 1098, 296, 84)} onClick={onHome}>
        <img src={ASSETS.buttons.secondary} alt="" />
        <span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          홈으로 가기
        </span>
      </button>

      <button
        type="button"
        className="share-btn"
        style={box(52, 1253, 608, 118)}
        onClick={share}
        disabled={wallet.shareBonusUsed || sharing}
        aria-disabled={wallet.shareBonusUsed || sharing}
        data-testid="share-btn"
      >
        <img className="share-btn__bg" src={ASSETS.buttons.share} alt="" />
        <span className="share-btn__talk display" aria-hidden="true">
          TALK
        </span>
        <span className="share-btn__text">
          {wallet.shareBonusUsed ? (
            <>
              <span>공유 보상을 받았어요 (최대 1회)</span>
              <b className="display">남은 참여 기회 {wallet.playsLeft}회</b>
            </>
          ) : (
            <>
              <span>친구에게 카카오톡으로 공유하면</span>
              <b className="display">
                <Spark /> 게임 참여 기회 1회 추가! <Spark flip />
              </b>
            </>
          )}
        </span>
        <span className="share-btn__deco" aria-hidden="true">
          <img src={ASSETS.scoops.strawberry} alt="" />
          <svg className="share-btn__heart" viewBox="0 0 24 24">
            <path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11Z" fill="#ff4fa3" stroke="#fff" strokeWidth="1.6" />
          </svg>
          <svg className="share-btn__star" viewBox="0 0 24 24">
            <path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z" fill="#ffd84a" />
          </svg>
        </span>
      </button>

      {/* 카드 뒤로 살짝 걸치는 콘 일러스트 */}
      <div className="result__deco" aria-hidden="true">
        <img src={ASSETS.illustrations.coneMint} alt="" className="bob" style={{ ...box(10, 282, 190), rotate: '-8deg' }} />
        <img src={ASSETS.illustrations.coneStrawberry} alt="" className="bob bob--late" style={{ ...box(561, 266, 180), rotate: '10deg' }} />
      </div>

      <div className="result-card glass-card" style={box(86, 624, 550, 278)} data-testid={reward ? 'coupon' : 'coupon-empty'}>
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

      <div className="result-card glass-card result-score" style={box(79, 374, 554, 206)}>
        <span className="result-card__label pink-pill">최종 점수</span>
        <p className="result-score__value" data-testid="final-score">
          <b className="display" style={{ fontSize: `calc(var(--u) * ${scoreSize})` }}>
            {scoreText}
          </b>
          <span className="display">점</span>
        </p>
      </div>

      <FooterNote />
    </section>
  )
}

function Spark({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="share-btn__spark" style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
      <path d="M5 4 8 10M11 3l.4 6M16 6l-3 4" stroke="#f72486" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}
