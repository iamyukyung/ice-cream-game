import { ASSETS } from '../assets/manifest'
import { Brand, FooterNote, IconButton, ImgButton } from '../components/ui'
import { box, fmt } from '../lib/format'
import { REWARDS, REWARD_ART } from '../lib/rewards'
import './start.css'

interface Props {
  onStart: () => void
  onGift: () => void
  onSettings: () => void
}

/** 시안 01_start_screen.jpg 좌표(상태바 60px 제외)를 그대로 따름 */
export function StartScreen({ onStart, onGift, onSettings }: Props) {
  const S = ASSETS.scoops
  const I = ASSETS.illustrations
  return (
    <section className="screen start" aria-label="시작 화면">
      <IconButton kind="gift" label="리워드 안내" x={550} y={24} onClick={onGift} />
      <IconButton kind="settings" label="설정" x={628} y={24} onClick={onSettings} />

      <Brand logo={{ x: 178, y: -4, w: 355 }} title={{ x: 88, y: 116, w: 535 }} />

      <p className="start__lead" style={box(0, 346, 711)}>
        <span className="start__lead1">같은 아이스크림을 합쳐</span>
        <span className="start__lead2">더 큰 달콤함을 완성하세요</span>
      </p>

      {/* 머지 연출 일러스트 */}
      <div className="start__hero" aria-hidden="true">
        <img src={I.coneStrawberry} alt="" className="float-a" style={{ ...box(36, 392, 176), rotate: '-14deg' }} />
        <svg className="start__arrow" style={box(232, 428, 140, 110)} viewBox="0 0 140 110">
          <path d="M14 46 C 40 6, 98 4, 112 58" fill="none" stroke="#ff4fa3" strokeWidth="20" strokeLinecap="round" />
          <path d="M88 52 L 136 50 L 112 96 Z" fill="#ff4fa3" strokeLinejoin="round" stroke="#ff4fa3" strokeWidth="8" />
          <path d="M22 40 C 44 14, 88 12, 104 44" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="5" strokeLinecap="round" />
        </svg>
        <img src={I.coneMint} alt="" className="float-b" style={{ ...box(388, 412, 150), rotate: '8deg' }} />
        <img src={I.cupSundae} alt="" className="float-a" style={box(482, 446, 168)} />
        <Star x={236} y={530} s={36} />
        <Star x={612} y={640} s={26} color="#ffd84a" />

        {/* 통: 뒤쪽 트레이 → 스쿱 → 앞쪽 받침대 순으로 겹쳐 '담긴' 느낌 */}
        <img src={ASSETS.gameplay.container} alt="" className="start__tub" style={{ ...box(26, 291, 660), clipPath: 'inset(64% 0 0 0)' }} />
        <img src={S.mint} alt="" style={box(40, 742, 150)} />
        <img src={S.strawberry} alt="" style={box(28, 640, 146)} />
        <img src={I.cupRainbow} alt="" style={box(494, 640, 178)} />
        <img src={S.chocolate} alt="" style={box(100, 664, 212)} />
        <img src={S.mint} alt="" style={box(392, 730, 128)} />
        <img src={S.strawberry} alt="" className="start__big" style={box(236, 566, 276)} />
        <img src={S.mint} alt="" style={box(206, 760, 184)} />
        <img src={S.strawberry} alt="" style={box(372, 782, 142)} />
        <img src={S.chocolate} alt="" style={box(520, 800, 120)} />
        <img src={ASSETS.gameplay.container} alt="" className="start__tub" style={{ ...box(26, 291, 660), clipPath: 'inset(81.5% 0 0 0)' }} />
      </div>

      <p className="start__ribbon pink-pill" style={box(60, 902, 591, 58)}>
        <Spark /> 점수를 모아 더 달콤한 혜택을 만나보세요! <Spark flip />
      </p>

      <ul className="start__rewards glass-card" style={box(24, 954, 663, 280)} aria-label="점수별 리워드">
        {REWARDS.map((r, i) => (
          <li key={r.score} className="reward-card" style={box(18 + i * 213, 14, 194, 246)}>
            <strong className="reward-card__score display">{fmt(r.score)}점</strong>
            <img src={REWARD_ART[r.score]} alt="" className="reward-card__art" />
            <span className="reward-card__ticket">
              <b className="display">₩ {fmt(r.discount)}</b>
              <span>할인 쿠폰</span>
            </span>
            {i < REWARDS.length - 1 && (
              <span className="reward-card__chev" aria-hidden="true">
                ›
              </span>
            )}
          </li>
        ))}
      </ul>

      <ImgButton
        label="게임 시작하기"
        bg={ASSETS.buttons.primary}
        textSrc={ASSETS.buttons.textStart}
        textWidth={60}
        x={60}
        y={1246}
        w={590}
        h={138}
        onClick={onStart}
        testId="start-btn"
      />
      <FooterNote />
    </section>
  )
}

function Star({ x, y, s, color = '#ffd84a' }: { x: number; y: number; s: number; color?: string }) {
  return (
    <svg style={box(x, y, s, s)} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.5 14.6 9.4 22.5 12l-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6Z" fill={color} />
    </svg>
  )
}

function Spark({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="spark" style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
      <path d="M4 3 7 9M10 2l.5 6M16 4l-3 5" stroke="#bfe7ff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}
