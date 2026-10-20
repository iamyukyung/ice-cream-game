import { useCallback, useEffect, useRef, useState } from 'react'
import { ASSETS, PRELOAD } from './assets/manifest'
import { Dialog, Toast } from './components/ui'
import { fmt } from './lib/format'
import { REWARDS, bestReward, type Reward } from './lib/rewards'
import { freshWallet, loadWallet, saveWallet, type Wallet } from './lib/storage'
import { CheckoutScreen } from './screens/CheckoutScreen'
import { GameScreen } from './screens/GameScreen'
import { ResultScreen } from './screens/ResultScreen'
import { StartScreen } from './screens/StartScreen'

export type Screen = 'start' | 'game' | 'result' | 'checkout'

const BG: Record<Screen, string> = {
  start: ASSETS.bg.start,
  game: ASSETS.bg.gameplay,
  result: ASSETS.bg.result,
  checkout: ASSETS.bg.checkout,
}

export type ShareOutcome = 'granted' | 'already' | 'cancelled'

export default function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [wallet, setWallet] = useState<Wallet>(loadWallet)
  const [lastScore, setLastScore] = useState(0)
  const [gameKey, setGameKey] = useState(0)
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null)
  const [dialog, setDialog] = useState<null | 'gift' | 'settings' | 'noPlays'>(null)
  const shareLock = useRef(false)

  useEffect(() => saveWallet(wallet), [wallet])
  useEffect(() => {
    for (const src of PRELOAD) {
      const i = new Image()
      i.src = src
    }
  }, [])

  const notify = useCallback((msg: string) => setToast({ msg, id: Date.now() }), [])

  const go = useCallback((s: Screen) => {
    setScreen(s)
    setDialog(null)
  }, [])

  const startGame = useCallback(() => {
    if (wallet.playsLeft <= 0) {
      setDialog('noPlays')
      return
    }
    setWallet((w) => ({ ...w, playsLeft: Math.max(0, w.playsLeft - 1) }))
    setGameKey((k) => k + 1)
    go('game')
  }, [wallet.playsLeft, go])

  const finishGame = useCallback(
    (score: number) => {
      const reward = bestReward(score)
      setLastScore(score)
      setWallet((w) => ({
        ...w,
        bestScore: Math.max(w.bestScore, score),
        // 쿠폰 1장만 보유: 이번 달성 금액이 더 높을 때만 승급
        coupon: reward && (!w.coupon || reward.discount > w.coupon.discount) ? reward : w.coupon,
      }))
      go('result')
    },
    [go],
  )

  /** 공유 보상: 최대 1회. 연타·동시 호출도 shareLock으로 차단 */
  const share = useCallback(async (): Promise<ShareOutcome> => {
    if (wallet.shareBonusUsed || shareLock.current) return 'already'
    shareLock.current = true
    const url = location.href.split('?')[0]
    const data = {
      title: 'Ice Cream Game (포트폴리오 데모)',
      text: '같은 아이스크림을 합쳐 더 큰 달콤함을 완성해 보세요! (비공식 데모)',
      url,
    }
    let ok = false
    try {
      if (navigator.share) {
        await navigator.share(data)
        ok = true
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${data.text} ${url}`)
        notify('공유 링크를 복사했어요 (데모)')
        ok = true
      } else {
        ok = true
      }
    } catch (e) {
      // 사용자가 공유 시트를 닫은 경우는 보상 없음, 그 외 오류는 데모이므로 지급
      ok = !(e instanceof DOMException && e.name === 'AbortError')
    }
    if (!ok) {
      shareLock.current = false
      return 'cancelled'
    }
    setWallet((w) => (w.shareBonusUsed ? w : { ...w, shareBonusUsed: true, playsLeft: w.playsLeft + 1 }))
    notify('게임 참여 기회 1회가 추가됐어요!')
    return 'granted'
  }, [wallet.shareBonusUsed, notify])

  const resetDemo = () => {
    shareLock.current = false
    setWallet(freshWallet())
    setDialog(null)
    notify('데모 데이터를 초기화했어요')
  }

  const lastReward: Reward | null = bestReward(lastScore)

  return (
    <div className="app">
      <div className="app__bgwrap" aria-hidden="true">
        <div className="app__bg" style={{ backgroundImage: `url(${BG[screen]})` }} />
      </div>
      <main className="stage">
        <div className="artboard">
          {screen === 'start' && (
            <StartScreen onStart={startGame} onGift={() => setDialog('gift')} onSettings={() => setDialog('settings')} />
          )}
          {screen === 'game' && (
            <GameScreen
              key={gameKey}
              onExit={() => go('start')}
              onGameOver={finishGame}
              onGift={() => setDialog('gift')}
              onSettings={() => setDialog('settings')}
              paused={dialog !== null}
            />
          )}
          {screen === 'result' && (
            <ResultScreen
              score={lastScore}
              reward={lastReward}
              wallet={wallet}
              onUseCoupon={() => go('checkout')}
              onShare={share}
              onReplay={startGame}
              onHome={() => go('start')}
            />
          )}
          {screen === 'checkout' && (
            <CheckoutScreen coupon={wallet.coupon} onBack={() => go('result')} onHome={() => go('start')} />
          )}
          {toast && <Toast message={toast.msg} id={toast.id} />}
        </div>
      </main>

      <Dialog open={dialog === 'gift'} onClose={() => setDialog(null)} labelledBy="dlg-gift">
        <span className="dialog__badge">REWARD</span>
        <h2 className="dialog__title" id="dlg-gift">
          점수별 리워드
        </h2>
        <p className="dialog__desc">달성한 최고 구간의 쿠폰 1장만 자동 발급되고, 더 높은 점수를 달성하면 상위 금액으로 승급돼요.</p>
        <div className="dialog__tiers">
          {REWARDS.map((r) => (
            <div key={r.score} className="dialog__tier" data-on={wallet.coupon?.score === r.score}>
              <span>{fmt(r.score)}점</span>
              <span>₩ {fmt(r.discount)} 할인 쿠폰</span>
            </div>
          ))}
        </div>
        <p className="dialog__desc">
          보유 쿠폰: <b>{wallet.coupon ? `₩ ${fmt(wallet.coupon.discount)}` : '없음'}</b> · 최고 점수 {fmt(wallet.bestScore)}점 · 남은
          기회 {wallet.playsLeft}회
        </p>
        <div className="dialog__actions">
          <button type="button" className="dialog__btn dialog__btn--primary" onClick={() => setDialog(null)}>
            확인
          </button>
        </div>
      </Dialog>

      <Dialog open={dialog === 'settings'} onClose={() => setDialog(null)} labelledBy="dlg-settings">
        <span className="dialog__badge">SETTINGS</span>
        <h2 className="dialog__title" id="dlg-settings">
          설정
        </h2>
        <p className="dialog__desc">
          조작: 게임통을 좌우로 드래그해 위치를 맞추고 손을 떼면 떨어집니다. 키보드는 ← → 이동, Space/Enter 드롭.
        </p>
        <p className="dialog__desc">
          이 페이지는 비공식 개인 포트폴리오 시연입니다. 배스킨라빈스·카카오톡·LINE Pay 등과의 공식 제휴가 아니며 실제 결제·쿠폰 발급이
          일어나지 않습니다.
        </p>
        <div className="dialog__actions">
          <button type="button" className="dialog__btn dialog__btn--ghost" onClick={resetDemo}>
            데모 데이터 초기화
          </button>
          <button type="button" className="dialog__btn dialog__btn--primary" onClick={() => setDialog(null)}>
            닫기
          </button>
        </div>
      </Dialog>

      <Dialog open={dialog === 'noPlays'} onClose={() => setDialog(null)} labelledBy="dlg-noplays">
        <span className="dialog__badge">DEMO</span>
        <h2 className="dialog__title" id="dlg-noplays">
          참여 기회를 모두 사용했어요
        </h2>
        <p className="dialog__desc">
          {wallet.shareBonusUsed
            ? '공유 보상도 이미 받았어요. 시연을 계속하려면 설정에서 데모 데이터를 초기화하세요.'
            : '결과 화면에서 카카오톡 공유하기를 누르면 1회 추가 기회를 받을 수 있어요.'}
        </p>
        <div className="dialog__actions">
          <button type="button" className="dialog__btn dialog__btn--ghost" onClick={resetDemo}>
            데모 초기화
          </button>
          <button type="button" className="dialog__btn dialog__btn--primary" onClick={() => setDialog(null)}>
            확인
          </button>
        </div>
      </Dialog>
    </div>
  )
}
