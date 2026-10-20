import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ASSETS } from '../assets/manifest'
import { Brand, FooterNote, IconButton } from '../components/ui'
import { MergeGame } from '../game/engine'
import { FIELD, GEO, JAR } from '../game/geometry'
import { LEVELS, levelSrc } from '../game/levels'
import { box, fmt, u } from '../lib/format'
import { REWARD_ART, rewardProgress } from '../lib/rewards'
import './game.css'

interface Props {
  onExit: () => void
  onGameOver: (score: number) => void
  onGift: () => void
  onSettings: () => void
  paused: boolean
}

const CHANGES = 3
const BOMBS = 1

declare global {
  interface Window {
    __ICG__?: { game: MergeGame | null }
  }
}
const DEBUG = import.meta.env.DEV || new URLSearchParams(location.search).has('debug')

export function GameScreen({ onExit, onGameOver, onGift, onSettings, paused }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<MergeGame | null>(null)
  const dragging = useRef(false)
  const [score, setScore] = useState(0)
  const [queue, setQueue] = useState<[number, number]>([0, 0])
  const [danger, setDanger] = useState(0)
  const [over, setOver] = useState(false)
  const [changes, setChanges] = useState(CHANGES)
  const [bombs, setBombs] = useState(BOMBS)
  const [celebrate, setCelebrate] = useState<string | null>(null)
  const [finalScore, setFinalScore] = useState(0)
  const lastTier = useRef<number | null>(null)
  const onGameOverRef = useRef(onGameOver)
  useEffect(() => {
    onGameOverRef.current = onGameOver
  }, [onGameOver])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const g = new MergeGame(canvas, {
      onScore: (s) => setScore(s),
      onQueue: (c, n) => setQueue([c, n]),
      onDanger: (r) => setDanger(r),
      onGameOver: (s) => {
        setFinalScore(s)
        setOver(true)
      },
    })
    gameRef.current = g
    if (DEBUG) window.__ICG__ = { game: g }
    fieldRef.current?.focus({ preventScroll: true })
    return () => {
      g.destroy()
      gameRef.current = null
      if (window.__ICG__?.game === g) window.__ICG__ = { game: null }
    }
  }, [])

  useEffect(() => {
    gameRef.current?.setPaused(paused)
  }, [paused])

  // 게임 종료 → 잠깐 연출 후 결과 화면
  useEffect(() => {
    if (!over) return
    const t = setTimeout(() => onGameOverRef.current(finalScore), 1600)
    return () => clearTimeout(t)
  }, [over, finalScore])

  const progress = rewardProgress(score)

  // 리워드 승급 축하
  useEffect(() => {
    const tier = progress.current?.score ?? null
    if (tier !== lastTier.current) {
      if (tier !== null && (lastTier.current === null || tier > lastTier.current)) {
        setCelebrate(`${fmt(progress.current!.discount)}원 쿠폰 달성!`)
        const t = setTimeout(() => setCelebrate(null), 1800)
        lastTier.current = tier
        return () => clearTimeout(t)
      }
      lastTier.current = tier
    }
  }, [progress.current])

  const toWorldX = (clientX: number) => {
    const rect = fieldRef.current!.getBoundingClientRect()
    return ((clientX - rect.left) / rect.width) * FIELD.width
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || over) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    gameRef.current?.setAim(toWorldX(e.clientX))
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return
    if (dragging.current || e.pointerType === 'mouse') gameRef.current?.setAim(toWorldX(e.clientX))
  }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || !dragging.current) return
    dragging.current = false
    gameRef.current?.setAim(toWorldX(e.clientX))
    gameRef.current?.drop()
  }
  const onPointerCancel = () => {
    dragging.current = false
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const g = gameRef.current
    if (!g) return
    const step = e.shiftKey ? 48 : 16
    if (e.key === 'ArrowLeft') g.nudgeAim(-step)
    else if (e.key === 'ArrowRight') g.nudgeAim(step)
    else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown') g.drop()
    else return
    e.preventDefault()
  }

  const drop = useCallback(() => gameRef.current?.drop(), [])
  const change = () => {
    if (changes <= 0 || over) return
    gameRef.current?.changeCurrent()
    setChanges((c) => c - 1)
  }
  const bomb = () => {
    if (bombs <= 0 || over) return
    const n = gameRef.current?.bomb() ?? 0
    if (n > 0) setBombs((b) => b - 1)
  }

  const [cur, next] = queue
  const fieldPx = (n: number) => u(n)

  return (
    <section className="screen game" aria-label="게임 화면">
      <IconButton kind="back" label="시작 화면으로" x={24} y={22} onClick={onExit} />
      <IconButton kind="gift" label="리워드 안내" x={550} y={22} onClick={onGift} />
      <IconButton kind="settings" label="설정" x={628} y={22} onClick={onSettings} />
      <Brand logo={{ x: 238, y: -10, w: 234 }} title={{ x: 208, y: 68, w: 294 }} />

      {/* HUD */}
      <div className="hud glass-card" style={box(20, 190, 671, 146)}>
        <div className="hud__score pink-pill" style={box(14, 14, 206, 112)}>
          <span className="hud__label">현재 점수</span>
          <span className="hud__value display" data-testid="score">
            {fmt(score)}
            <small>점</small>
          </span>
        </div>
        <div className="hud__reward" style={box(232, 12, 214, 116)} data-empty={!progress.current}>
          <span className="hud__label hud__label--pink">현재 리워드</span>
          <div className="hud__reward-body">
            {progress.current ? (
              <>
                <img src={REWARD_ART[progress.current.score]} alt="" />
                <span className="hud__ticket">
                  <b className="display" data-testid="current-reward">
                    {fmt(progress.current.discount)}원
                  </b>
                  할인 쿠폰
                </span>
                <span className="hud__check" aria-hidden="true">
                  <svg viewBox="0 0 20 20">
                    <path d="M5 10.5 8.5 14 15 6.5" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </>
            ) : (
              <span className="hud__none" data-testid="current-reward">
                아직 없어요
                <small>500점부터 쿠폰 지급</small>
              </span>
            )}
          </div>
        </div>
        <div className="hud__next" style={box(458, 10, 200, 124)} aria-live="polite">
          {progress.next ? (
            <>
              <span className="hud__next-title">다음 리워드까지</span>
              <span className="hud__remain">
                <b className="display" data-testid="remaining">
                  {fmt(progress.remaining)}점
                </b>{' '}
                남았어요!
              </span>
            </>
          ) : (
            <>
              <span className="hud__next-title">최고 리워드</span>
              <span className="hud__remain">
                <b className="display" data-testid="remaining">
                  달성 완료!
                </b>
              </span>
            </>
          )}
          <span
            className="hud__bar"
            role="progressbar"
            aria-label="다음 리워드 진행률"
            aria-valuemin={0}
            aria-valuemax={progress.next?.score ?? score}
            aria-valuenow={score}
          >
            <i style={{ width: `${progress.ratio * 100}%` }} />
          </span>
          <span className="hud__frac">
            {fmt(score)} / {fmt(progress.next?.score ?? progress.current?.score ?? 0)}
          </span>
        </div>
      </div>

      {/* 플레이 필드 */}
      <div
        ref={fieldRef}
        className="field"
        data-danger={danger > 0}
        style={box(0, FIELD.top, FIELD.width, FIELD.height)}
        tabIndex={0}
        role="application"
        aria-label="게임통. 좌우로 드래그하거나 화살표 키로 위치를 옮기고, 손을 떼거나 스페이스 키로 아이스크림을 떨어뜨리세요."
        aria-describedby="field-status"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={onKeyDown}
        data-testid="field"
      >
        <img className="field__jar" src={ASSETS.gameplay.container} alt="" style={box(JAR.x, JAR.y, JAR.w, JAR.h)} />
        <div className="field__jar-tint" style={box(GEO.left, JAR.y + 30, GEO.right - GEO.left, GEO.floor - JAR.y - 30)} />
        <div
          className="field__danger"
          style={{ ...box(GEO.left - 10, GEO.dangerY - 2, GEO.right - GEO.left + 20), opacity: 0.65 + danger * 0.35 }}
          aria-hidden="true"
        />
        <span className="field__danger-badge" style={box(46, GEO.dangerY - 66)} aria-hidden="true">
          <i>!</i> 위험 라인!
        </span>
        <div className="next" style={box(553, 30, 138, 160)} aria-hidden="true">
          <span className="next__tag display">NEXT</span>
          <span className="next__bubble">
            <img src={levelSrc(LEVELS[next])} alt="" style={{ width: fieldPx(40 + LEVELS[next].radius * 1.1) }} />
          </span>
        </div>
        <canvas ref={canvasRef} className="field__canvas" />
        {/* 앞쪽 핑크 받침대: 스쿱 아래쪽을 살짝 덮어 통 안에 담긴 느낌 */}
        <img
          className="field__jar field__jar--front"
          src={ASSETS.gameplay.container}
          alt=""
          style={{ ...box(JAR.x, JAR.y, JAR.w, JAR.h), clipPath: `inset(${JAR.frontBandRatio * 100}% 0 0 0)` }}
        />

        <p id="field-status" className="sr-only" aria-live="polite">
          현재 {LEVELS[cur].name}, 다음 {LEVELS[next].name}
        </p>
        {danger > 0 && !over && (
          <span className="field__warn display" style={box(0, GEO.dangerY + 16, FIELD.width)} role="alert">
            위험! 아이스크림이 넘치려고 해요
          </span>
        )}
        {celebrate && (
          <span className="field__celebrate display" style={box(0, 360, FIELD.width)} role="status">
            🎉 {celebrate}
          </span>
        )}
        {over && (
          <div className="field__over" role="alert">
            <span className="display">게임 종료!</span>
            <small>최종 {fmt(finalScore)}점 · 결과를 확인해요</small>
          </div>
        )}
      </div>

      {/* 하단 컨트롤 */}
      <button type="button" className="tool-btn" style={box(22, 1214, 150, 150)} onClick={change} disabled={changes <= 0 || over} aria-label={`다음 체인지, 남은 횟수 ${changes}회`}>
        <img className="tool-btn__bg" src={ASSETS.buttons.circleWhite} alt="" />
        <img className="tool-btn__glyph" src={ASSETS.icons.nextChange} alt="" />
        <span className="tool-btn__label">다음 체인지</span>
        <span className="tool-btn__badge display">{changes}</span>
      </button>
      <button type="button" className="drop-btn" style={box(194, 1214, 324, 156)} onClick={drop} disabled={over} data-testid="drop-btn">
        <svg viewBox="0 0 40 44" className="drop-btn__icon" aria-hidden="true">
          <path d="M14 3h12v19h10L20 41 4 22h10Z" fill="#fff" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
        </svg>
        <img src={ASSETS.buttons.textDrop} alt="" className="drop-btn__text" />
        <span className="sr-only">아이스크림 떨어뜨리기</span>
      </button>
      <button type="button" className="tool-btn" style={box(540, 1214, 150, 150)} onClick={bomb} disabled={bombs <= 0 || over} aria-label={`스페셜 아이템: 가장 작은 스쿱 두 단계 제거, 남은 횟수 ${bombs}회`}>
        <img className="tool-btn__bg" src={ASSETS.buttons.circleWhite} alt="" />
        <img className="tool-btn__glyph" src={ASSETS.icons.special} alt="" />
        <span className="tool-btn__label">스페셜 아이템</span>
        <span className="tool-btn__badge display">{bombs}</span>
      </button>
      <FooterNote />
    </section>
  )
}
